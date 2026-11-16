import {
  createInteractionDiagramController,
  prepareInteractionDiagram,
} from "./interaction-diagram.js";
import type { InteractionDiagram } from "./interaction-diagram.js";
import type { DocumentController, ReplacementResult } from "./controller.js";
import { SketcherError } from "./diagnostics.js";
import {
  buildInteractionDiagramScene,
  hitTestInteractionDiagramScene,
  inspectDiagramTarget,
} from "./interaction-scene.js";
import type {
  InteractionDiagramScene,
  InteractionDiagramPick,
} from "./interaction-scene.js";
import {
  renderInteractionDiagramSvg,
  drawDiagramIndicator,
} from "./interaction-svg.js";
import { createBrowserTextMeasurer } from "./svg.js";
import type { BrowserTextMeasurer } from "./svg.js";
import { validateSceneOptions } from "./scene.js";
import type { Theme } from "./scene.js";
import { snapshotJson } from "./json.js";

export interface InteractionSvgViewOptions {
  readonly instanceId: string;
  readonly theme?: Theme;
  readonly fontSize?: number;
}
export interface AcceptedInteractionView {
  readonly document: InteractionDiagram;
  readonly documentGeneration: number;
  readonly scene: InteractionDiagramScene;
}
export type InteractionViewReplacementResult =
  | {
      readonly status: "accepted";
      readonly requestId: number;
      readonly accepted: AcceptedInteractionView;
    }
  | Exclude<
      ReplacementResult<InteractionDiagram>,
      { readonly status: "accepted" }
    >;

/** First bounded supplied two-mode surface; no engine, physical decoder or host transport. */
export class InteractionSvgView {
  readonly ready: Promise<void>;
  readonly #container: HTMLElement;
  readonly #options: InteractionSvgViewOptions;
  readonly #measurer: BrowserTextMeasurer;
  readonly #controller: DocumentController<InteractionDiagram>;
  readonly #listeners = new Set<
    (pick: InteractionDiagramPick | null) => void
  >();
  #candidate: {
    requestId: number;
    scene: InteractionDiagramScene;
    svg: SVGSVGElement;
  } | null = null;
  #accepted: AcceptedInteractionView | null = null;
  #svg: SVGSVGElement | null = null;
  #selection: InteractionDiagramPick | null = null;
  #focus = -1;
  #intent = 0;
  #disposed = false;
  #viewport: { width: number; height: number } | null = null;
  #operation: {
    readonly status: "idle" | "pending" | "accepted" | "failed" | "disposed";
    readonly error: SketcherError | null;
  } = Object.freeze({ status: "idle", error: null });
  constructor(container: HTMLElement, options: InteractionSvgViewOptions) {
    if (!container?.isConnected || !container.ownerDocument)
      throw new SketcherError(
        "invalid-input",
        "Mount the interaction view in a connected HTML container.",
      );
    this.#options = snapshotJson(
      options,
    ) as unknown as InteractionSvgViewOptions;
    validateSceneOptions({ ...this.#options, generation: 1 });
    this.#container = container;
    this.#measurer = createBrowserTextMeasurer(container.ownerDocument);
    this.ready = this.#measurer.ready;
    this.#controller = createInteractionDiagramController({
      instanceId: this.#options.instanceId,
      prepare: async (input, context) => {
        await this.ready;
        if (this.#disposed || context.signal.aborted)
          throw new SketcherError(
            "disposed",
            "The diagram candidate has retired.",
          );
        const document = prepareInteractionDiagram(input);
        const scene = buildInteractionDiagramScene(
          document,
          this.#measurer.measure,
          { ...this.#options, generation: context.requestId },
        );
        const svg = renderInteractionDiagramSvg(
          scene,
          this.#container.ownerDocument,
        );
        if (this.#viewport) {
          svg.style.width = `${this.#viewport.width}px`;
          svg.style.height = `${this.#viewport.height}px`;
        }
        this.#candidate = { requestId: context.requestId, scene, svg };
        return document;
      },
    });
  }
  get state() {
    return Object.freeze({
      lifecycle: this.#disposed ? ("disposed" as const) : ("ready" as const),
      accepted: this.#accepted,
      operation: this.#operation,
      selection: this.#selection,
    });
  }
  async replace(input: unknown): Promise<InteractionViewReplacementResult> {
    const intent = ++this.#intent;
    if (!this.#disposed)
      this.#operation = Object.freeze({ status: "pending", error: null });
    const result = await this.#controller.replace(input);
    if (this.#disposed)
      return Object.freeze({ status: "disposed", requestId: result.requestId });
    if (intent !== this.#intent)
      return Object.freeze({
        status: "superseded",
        requestId: result.requestId,
      });
    if (result.status === "accepted") {
      const candidate = this.#candidate;
      if (!candidate || candidate.requestId !== result.requestId)
        throw new SketcherError(
          "preparation-failed",
          "A coherent diagram candidate is unavailable.",
        );
      const old = this.#svg;
      if (old) this.#wire(old, false);
      if (old?.parentNode === this.#container) old.replaceWith(candidate.svg);
      else this.#container.append(candidate.svg);
      this.#svg = candidate.svg;
      this.#candidate = null;
      this.#selection = null;
      this.#focus = -1;
      this.#accepted = Object.freeze({
        document: result.snapshot.document,
        documentGeneration: result.snapshot.generation,
        scene: candidate.scene,
      });
      this.#wire(this.#svg, true);
      this.#operation = Object.freeze({ status: "accepted", error: null });
      return Object.freeze({
        status: "accepted",
        requestId: result.requestId,
        accepted: this.#accepted,
      });
    }
    if (this.#candidate?.requestId === result.requestId) this.#candidate = null;
    if (result.status === "failed")
      this.#operation = Object.freeze({
        status: "failed",
        error: result.error,
      });
    return result;
  }
  subscribeSelection(
    listener: (pick: InteractionDiagramPick | null) => void,
  ): () => void {
    if (this.#disposed)
      throw new SketcherError("disposed", "The diagram has been disposed.");
    if (typeof listener !== "function")
      throw new SketcherError(
        "invalid-input",
        "Supply a diagram selection listener.",
      );
    if (this.#listeners.size >= 32)
      throw new SketcherError(
        "input-limit",
        "The diagram supports at most 32 selection subscriptions.",
      );
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  resize(width: number, height: number): void {
    if (this.#disposed)
      throw new SketcherError("disposed", "The diagram has been disposed.");
    if (
      ![width, height].every((n) => Number.isFinite(n) && n > 0 && n <= 16384)
    )
      throw new SketcherError(
        "invalid-input",
        "Invalid diagram viewport size.",
      );
    this.#viewport = { width, height };
    if (this.#svg) {
      this.#svg.style.width = `${width}px`;
      this.#svg.style.height = `${height}px`;
    }
  }
  setSelection(visualId: string | null, expectedSceneGeneration: number): void {
    if (this.#disposed)
      throw new SketcherError("disposed", "The diagram has been disposed.");
    if (
      !this.#accepted ||
      expectedSceneGeneration !== this.#accepted.scene.generation ||
      (visualId !== null && typeof visualId !== "string")
    )
      throw new SketcherError(
        "invalid-input",
        "Supply the exact current diagram generation and target.",
      );
    const pick =
      visualId === null
        ? null
        : inspectDiagramTarget(this.#accepted.scene, visualId);
    if (visualId !== null && !pick)
      throw new SketcherError(
        "invalid-input",
        "Unknown current diagram target.",
      );
    this.#select(pick);
  }
  exportSvg(): string {
    if (this.#disposed)
      throw new SketcherError("disposed", "The diagram has been disposed.");
    if (!this.#svg)
      throw new SketcherError(
        "invalid-input",
        "Accept a diagram before exporting.",
      );
    const copy = this.#svg.cloneNode(true) as SVGSVGElement;
    const viewport = this.#svg.getBoundingClientRect();
    copy.setAttribute("width", String(viewport.width));
    copy.setAttribute("height", String(viewport.height));
    copy.style.width = `${viewport.width}px`;
    copy.style.height = `${viewport.height}px`;
    const metadata = copy.querySelector("metadata")!;
    metadata.textContent = JSON.stringify({
      ...JSON.parse(metadata.textContent!),
      viewport: {
        width: viewport.width,
        height: viewport.height,
        units: "CSS pixels",
        viewBox: copy.getAttribute("viewBox"),
      },
    });
    for (const role of ["selection", "focus"])
      copy.querySelector(`[data-layer="diagram-${role}"]`)!.replaceChildren();
    copy.removeAttribute("tabindex");
    return new XMLSerializer().serializeToString(copy);
  }
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    ++this.#intent;
    this.#controller.dispose();
    this.#listeners.clear();
    this.#candidate = null;
    this.#selection = null;
    this.#accepted = null;
    if (this.#svg) {
      this.#wire(this.#svg, false);
      if (this.#svg.parentNode === this.#container) this.#svg.remove();
    }
    this.#svg = null;
    this.#measurer.dispose();
    this.#operation = Object.freeze({ status: "disposed", error: null });
  }
  #select(pick: InteractionDiagramPick | null): void {
    this.#selection = pick;
    drawDiagramIndicator(this.#svg!, this.#accepted!.scene, pick, "selection");
    for (const listener of [...this.#listeners]) {
      if (this.#disposed || this.#selection !== pick) break;
      if (this.#listeners.has(listener)) listener(pick);
    }
  }
  #wire(svg: SVGSVGElement, attach: boolean): void {
    for (const [name, listener] of [
      ["click", this.#click],
      ["keydown", this.#key],
    ] as const)
      if (attach) svg.addEventListener(name, listener as EventListener);
      else svg.removeEventListener(name, listener as EventListener);
  }
  readonly #click = (event: MouseEvent): void => {
    if (
      this.#disposed ||
      event.currentTarget !== this.#svg ||
      !this.#accepted ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const matrix = this.#svg!.getScreenCTM();
    if (!matrix) return;
    const box = this.#svg!.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      return;
    this.#select(
      hitTestInteractionDiagramScene(
        this.#accepted.scene,
        { x: event.clientX, y: event.clientY },
        matrix,
      ),
    );
  };
  readonly #key = (event: KeyboardEvent): void => {
    if (
      this.#disposed ||
      event.currentTarget !== this.#svg ||
      !this.#accepted ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const scene = this.#accepted.scene,
      ids = [
        ...scene.observations.map((o) => o.id),
        ...scene.incidences.map((i) => i.id),
        ...scene.groups.map((g) => g.id),
      ];
    if (
      ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key) &&
      ids.length
    ) {
      event.preventDefault();
      this.#focus =
        (this.#focus +
          (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) +
          ids.length) %
        ids.length;
      drawDiagramIndicator(
        this.#svg!,
        scene,
        inspectDiagramTarget(scene, ids[this.#focus]!),
        "focus",
      );
    } else if (event.key === "Enter" && this.#focus >= 0) {
      event.preventDefault();
      this.#select(inspectDiagramTarget(scene, ids[this.#focus]!));
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.#select(null);
    }
  };
}
export function createInteractionSvgView(
  container: HTMLElement,
  options: InteractionSvgViewOptions,
): InteractionSvgView {
  return new InteractionSvgView(container, options);
}
