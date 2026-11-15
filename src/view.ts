import { createMolecularController } from "./controller.js";
import type { DocumentController, ReplacementResult } from "./controller.js";
import { SketcherError } from "./diagnostics.js";
import { prepareSuppliedMolecule } from "./documents.js";
import {
  buildMolecularScene,
  hitTestMolecularScene,
  validateSceneOptions,
} from "./scene.js";
import type { MolecularScene, ScenePick, Theme } from "./scene.js";
import {
  createBrowserTextMeasurer,
  renderMolecularSvg,
  SVG_COLORS,
} from "./svg.js";
import type { BrowserTextMeasurer } from "./svg.js";
import type { PreparedMolecule } from "./types.js";

export interface MolecularSvgViewOptions {
  readonly instanceId: string;
  readonly theme?: Theme;
  readonly fontSize?: number;
}
export interface AcceptedMolecularView {
  readonly document: PreparedMolecule;
  readonly documentGeneration: number;
  readonly scene: MolecularScene;
}
export type ViewReplacementResult =
  | {
      readonly status: "accepted";
      readonly requestId: number;
      readonly accepted: AcceptedMolecularView;
    }
  | Exclude<
      ReplacementResult<PreparedMolecule>,
      { readonly status: "accepted" }
    >;

/** Experimental independently mounted read-only surface for supplied depictions. */
export class MolecularSvgView {
  readonly ready: Promise<void>;
  readonly #container: HTMLElement;
  readonly #options: MolecularSvgViewOptions;
  readonly #measurer: BrowserTextMeasurer;
  readonly #controller: DocumentController<PreparedMolecule>;
  readonly #listeners = new Set<(pick: ScenePick | null) => void>();
  #candidate: {
    requestId: number;
    scene: MolecularScene;
    svg: SVGSVGElement;
  } | null = null;
  #accepted: AcceptedMolecularView | null = null;
  #svg: SVGSVGElement | null = null;
  #selection: ScenePick | null = null;
  #focus = -1;
  #intent = 0;
  #disposed = false;
  #viewport: { width: number; height: number } | null = null;
  #operation: {
    readonly status: "idle" | "pending" | "accepted" | "failed" | "disposed";
    readonly error: SketcherError | null;
  } = Object.freeze({ status: "idle", error: null });

  constructor(container: HTMLElement, options: MolecularSvgViewOptions) {
    if (!container?.isConnected || !container.ownerDocument)
      throw new SketcherError(
        "invalid-input",
        "Mount the view in a connected HTML container.",
      );
    validateSceneOptions({ ...options, generation: 1 });
    this.#container = container;
    this.#options = Object.freeze({ ...options });
    this.#measurer = createBrowserTextMeasurer(container.ownerDocument);
    this.ready = this.#measurer.ready;
    this.#controller = createMolecularController({
      instanceId: options.instanceId,
      prepare: async (input, context) => {
        await this.ready;
        if (context.signal.aborted || this.#disposed)
          throw new SketcherError(
            "disposed",
            "The drawing preparation has retired.",
          );
        const document = prepareSuppliedMolecule(input);
        const scene = buildMolecularScene(document, this.#measurer.measure, {
          ...this.#options,
          generation: context.requestId,
        });
        const svg = renderMolecularSvg(scene, this.#container.ownerDocument);
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

  async replace(input: unknown): Promise<ViewReplacementResult> {
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
          "A coherent drawing candidate is unavailable.",
        );
      const previous = this.#svg;
      if (previous?.parentNode === this.#container)
        previous.replaceWith(candidate.svg);
      else this.#container.append(candidate.svg);
      previous?.removeEventListener("click", this.#onClick);
      previous?.removeEventListener("keydown", this.#onKeyDown);
      this.#svg = candidate.svg;
      this.#accepted = Object.freeze({
        document: result.snapshot.document,
        documentGeneration: result.snapshot.generation,
        scene: candidate.scene,
      });
      this.#candidate = null;
      this.#selection = null;
      this.#focus = -1;
      this.#svg.addEventListener("click", this.#onClick);
      this.#svg.addEventListener("keydown", this.#onKeyDown);
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

  subscribeSelection(listener: (pick: ScenePick | null) => void): () => void {
    if (this.#disposed)
      throw new SketcherError("disposed", "The view has been disposed.");
    if (typeof listener !== "function")
      throw new SketcherError(
        "invalid-input",
        "A selection listener must be a function.",
      );
    if (this.#listeners.size >= 32)
      throw new SketcherError(
        "input-limit",
        "The initial view supports at most 32 selection subscriptions.",
      );
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  resize(width: number, height: number): void {
    if (this.#disposed)
      throw new SketcherError("disposed", "The view has been disposed.");
    if (
      ![width, height].every((n) => Number.isFinite(n) && n > 0 && n <= 16384)
    )
      throw new SketcherError("invalid-input", "Invalid SVG viewport size.");
    this.#viewport = { width, height };
    if (this.#svg) {
      this.#svg.style.width = `${width}px`;
      this.#svg.style.height = `${height}px`;
    }
  }

  exportSvg(): string {
    if (this.#disposed || !this.#accepted || !this.#svg)
      throw new SketcherError(
        "invalid-input",
        "An accepted live drawing is required for export.",
      );
    const svg = renderMolecularSvg(
      this.#accepted.scene,
      this.#container.ownerDocument,
    );
    const bounds = this.#svg.getBoundingClientRect();
    svg.setAttribute("width", String(Math.max(1, bounds.width)));
    svg.setAttribute("height", String(Math.max(1, bounds.height)));
    svg.removeAttribute("tabindex");
    return new XMLSerializer().serializeToString(svg);
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    ++this.#intent;
    this.#controller.dispose();
    this.#measurer.dispose();
    this.#svg?.removeEventListener("click", this.#onClick);
    this.#svg?.removeEventListener("keydown", this.#onKeyDown);
    this.#svg?.remove();
    this.#svg = null;
    this.#accepted = null;
    this.#candidate = null;
    this.#selection = null;
    this.#listeners.clear();
    this.#operation = Object.freeze({ status: "disposed", error: null });
  }

  #select(pick: ScenePick | null): void {
    this.#selection = pick;
    this.#drawSelection(pick);
    for (const listener of [...this.#listeners]) {
      if (this.#disposed) break;
      listener(pick);
    }
  }

  #drawSelection(pick: ScenePick | null, focused = false): void {
    const layer = this.#svg?.querySelector(
      `[data-layer="${focused ? "focus" : "selection"}"]`,
    );
    if (!layer || !this.#accepted) return;
    layer.replaceChildren();
    if (!pick) return;
    const scene = this.#accepted.scene,
      color = SVG_COLORS[scene.theme].selection;
    const atom =
      pick.kind === "atom"
        ? scene.atoms.find((a) => a.semanticId === pick.semanticId)
        : null;
    const bond =
      pick.kind === "bond"
        ? scene.bonds.find((b) => b.semanticId === pick.semanticId)
        : null;
    const points = atom
      ? [atom.position]
      : bond
        ? bond.atoms.map(
            (id) => scene.atoms.find((a) => a.displayId === id)!.position,
          )
        : [];
    for (const point of points) {
      const circle = this.#container.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      for (const [key, value] of Object.entries({
        cx: point.x,
        cy: point.y,
        r: focused ? 11 : 8,
        fill: "none",
        stroke: color,
        "stroke-width": 2,
        "stroke-dasharray": focused ? "2 2" : "none",
      }))
        circle.setAttribute(key, String(value));
      layer.append(circle);
    }
  }

  readonly #onClick = (event: MouseEvent): void => {
    const svg = this.#svg;
    if (
      this.#disposed ||
      !svg ||
      event.currentTarget !== svg ||
      !this.#accepted
    )
      return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const pick = hitTestMolecularScene(
      this.#accepted.scene,
      { x: event.clientX, y: event.clientY },
      matrix,
    );
    this.#select(pick);
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
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
    const scene = this.#accepted.scene;
    const targets = [
      ...scene.atoms.map((a) => ({ kind: "atom" as const, ...a })),
      ...scene.bonds.map((b) => ({ kind: "bond" as const, ...b })),
    ];
    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();
      const direction =
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      this.#focus =
        this.#focus < 0
          ? direction > 0
            ? 0
            : targets.length - 1
          : (this.#focus + direction + targets.length) % targets.length;
      const target = targets[this.#focus]!;
      this.#svg?.setAttribute(
        "aria-label",
        `${target.kind} ${target.semanticId} of molecule ${scene.documentId}. Enter selects; Escape clears.`,
      );
      this.#drawSelection(
        {
          kind: target.kind,
          semanticId: target.semanticId,
          displayId: target.displayId,
          instanceId: scene.instanceId,
          documentId: scene.documentId,
          sceneGeneration: scene.generation,
          depictionGeneration: scene.depictionGeneration,
          context: scene.context,
        },
        true,
      );
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      this.#focus >= 0
    ) {
      event.preventDefault();
      const target = targets[this.#focus]!;
      this.#select(
        Object.freeze({
          kind: target.kind,
          semanticId: target.semanticId,
          displayId: target.displayId,
          instanceId: scene.instanceId,
          documentId: scene.documentId,
          sceneGeneration: scene.generation,
          depictionGeneration: scene.depictionGeneration,
          context: scene.context,
        }),
      );
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.#focus = -1;
      this.#drawSelection(null, true);
      this.#svg?.removeAttribute("aria-label");
      this.#select(null);
    }
  };
}

export function createMolecularSvgView(
  container: HTMLElement,
  options: MolecularSvgViewOptions,
): MolecularSvgView {
  return new MolecularSvgView(container, options);
}
