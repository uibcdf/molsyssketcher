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
import type { Point } from "./geometry.js";
import {
  fitViewport,
  panViewport,
  zoomViewport,
  viewportBounds,
} from "./viewport.js";
import type { ViewportState } from "./viewport.js";

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
  readonly #hoverListeners = new Set<(pick: ScenePick | null) => void>();
  readonly #resizeObserver: ResizeObserver;
  #observedSize: { width: number; height: number } | null = null;
  #candidate: {
    requestId: number;
    scene: MolecularScene;
    svg: SVGSVGElement;
  } | null = null;
  #accepted: AcceptedMolecularView | null = null;
  #svg: SVGSVGElement | null = null;
  #selection: ScenePick | null = null;
  #hover: ScenePick | null = null;
  #camera: ViewportState | null = null;
  #gesture: {
    pointerId: number;
    start: Point;
    last: Point;
    dragging: boolean;
  } | null = null;
  #suppressClick = false;
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
    const Observer = container.ownerDocument.defaultView?.ResizeObserver;
    if (!Observer)
      throw new SketcherError(
        "unsupported-feature",
        "This browser lacks viewport resize observation.",
      );
    this.#resizeObserver = new Observer((entries) => {
      const entry = entries.find((entry) => entry.target === this.#svg);
      if (!entry || this.#disposed) return;
      const { width, height } = entry.contentRect;
      const previous = this.#observedSize;
      this.#observedSize = { width, height };
      if (
        previous &&
        (width !== previous.width || height !== previous.height)
      ) {
        this.#cancelGesture();
        this.#setHover(null);
      }
    });
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
      hover: this.#hover,
      viewport: this.#camera,
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
      this.#cancelGesture();
      this.#resizeObserver.disconnect();
      if (previous?.parentNode === this.#container)
        previous.replaceWith(candidate.svg);
      else this.#container.append(candidate.svg);
      if (previous) this.#wire(previous, false);
      this.#svg = candidate.svg;
      this.#accepted = Object.freeze({
        document: result.snapshot.document,
        documentGeneration: result.snapshot.generation,
        scene: candidate.scene,
      });
      this.#candidate = null;
      this.#selection = null;
      this.#focus = -1;
      this.#camera = fitViewport(candidate.scene.bounds);
      this.#svg.style.touchAction = "none";
      this.#svg.style.userSelect = "none";
      this.#svg.style.cursor = "grab";
      this.#wire(this.#svg, true);
      this.#observedSize = null;
      this.#resizeObserver.observe(this.#svg);
      this.#operation = Object.freeze({ status: "accepted", error: null });
      this.#setHover(null);
      if (this.#disposed)
        return Object.freeze({
          status: "disposed",
          requestId: result.requestId,
        });
      if (intent !== this.#intent)
        return Object.freeze({
          status: "superseded",
          requestId: result.requestId,
        });
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
    this.#cancelGesture();
    this.#setHover(null);
  }

  subscribeHover(listener: (pick: ScenePick | null) => void): () => void {
    if (this.#disposed)
      throw new SketcherError("disposed", "The view has been disposed.");
    if (typeof listener !== "function")
      throw new SketcherError(
        "invalid-input",
        "A hover listener must be a function.",
      );
    if (this.#hoverListeners.size >= 32)
      throw new SketcherError(
        "input-limit",
        "The view supports at most 32 hover subscriptions.",
      );
    this.#hoverListeners.add(listener);
    return () => this.#hoverListeners.delete(listener);
  }

  fit(): void {
    const { scene } = this.#liveCamera();
    this.#cancelGesture();
    this.#applyCamera(fitViewport(scene.bounds));
  }

  /** Positive zoom, optionally anchored at a client CSS-pixel position. */
  zoomBy(factor: number, clientPoint?: Point): void {
    const { scene, camera } = this.#liveCamera();
    const anchor = clientPoint ? this.#clientPoint(clientPoint) : camera.center;
    if (!anchor)
      throw new SketcherError(
        "unsupported-feature",
        "A visible viewport is required for anchored zoom.",
      );
    const next = zoomViewport(scene.bounds, camera, factor, anchor);
    this.#cancelGesture();
    this.#applyCamera(next);
  }

  /** Move the drawing by client CSS pixels without changing source coordinates. */
  panBy(dx: number, dy: number): void {
    this.#liveCamera();
    if (![dx, dy].every((n) => Number.isFinite(n) && Math.abs(n) <= 16384))
      throw new SketcherError(
        "invalid-input",
        "Invalid CSS-pixel displacement.",
      );
    this.#cancelGesture();
    this.#pan(dx, dy);
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
    if (this.#camera) {
      const cameraBounds = viewportBounds(
        this.#accepted.scene.bounds,
        this.#camera,
      );
      svg.setAttribute(
        "viewBox",
        `${cameraBounds.x} ${cameraBounds.y} ${cameraBounds.width} ${cameraBounds.height}`,
      );
      const metadata = svg.querySelector("metadata")!;
      metadata.textContent = JSON.stringify({
        ...JSON.parse(metadata.textContent!),
        viewport: {
          camera: this.#camera,
          viewBox: cameraBounds,
          width: Math.max(1, bounds.width),
          height: Math.max(1, bounds.height),
        },
      });
    }
    svg.removeAttribute("tabindex");
    return new XMLSerializer().serializeToString(svg);
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    ++this.#intent;
    this.#controller.dispose();
    this.#measurer.dispose();
    this.#resizeObserver.disconnect();
    this.#observedSize = null;
    this.#cancelGesture();
    if (this.#svg) this.#wire(this.#svg, false);
    this.#svg?.remove();
    this.#svg = null;
    this.#accepted = null;
    this.#candidate = null;
    this.#selection = null;
    this.#hover = null;
    this.#camera = null;
    this.#listeners.clear();
    this.#hoverListeners.clear();
    this.#operation = Object.freeze({ status: "disposed", error: null });
  }

  #select(pick: ScenePick | null): void {
    this.#selection = pick;
    this.#drawIndicator(pick, "selection");
    for (const listener of [...this.#listeners]) {
      if (this.#disposed) break;
      listener(pick);
    }
  }

  #drawIndicator(
    pick: ScenePick | null,
    role: "selection" | "focus" | "hover",
  ): void {
    const layer = this.#svg?.querySelector(`[data-layer="${role}"]`);
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
        r: role === "focus" ? 11 : role === "hover" ? 6 : 8,
        fill: "none",
        stroke: color,
        "stroke-width": role === "hover" ? 1 : 2,
        "stroke-dasharray":
          role === "focus" ? "2 2" : role === "hover" ? "1 2" : "none",
      }))
        circle.setAttribute(key, String(value));
      layer.append(circle);
    }
  }

  #liveCamera() {
    if (this.#disposed)
      throw new SketcherError("disposed", "The view has been disposed.");
    if (!this.#svg || !this.#accepted || !this.#camera)
      throw new SketcherError(
        "invalid-input",
        "An accepted drawing is required for navigation.",
      );
    return {
      svg: this.#svg,
      scene: this.#accepted.scene,
      camera: this.#camera,
    };
  }

  #applyCamera(camera: ViewportState): void {
    const { svg, scene } = this.#liveCamera();
    const bounds = viewportBounds(scene.bounds, camera);
    this.#camera = camera;
    svg.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`,
    );
    this.#setHover(null);
  }

  #clientPoint(point: Point): Point | null {
    if (![point.x, point.y].every(Number.isFinite))
      throw new SketcherError("invalid-input", "Invalid client position.");
    const inverse = this.#svg?.getScreenCTM()?.inverse();
    if (
      !inverse ||
      ![inverse.a, inverse.b, inverse.c, inverse.d, inverse.e, inverse.f].every(
        Number.isFinite,
      )
    )
      return null;
    return {
      x: inverse.a * point.x + inverse.c * point.y + inverse.e,
      y: inverse.b * point.x + inverse.d * point.y + inverse.f,
    };
  }

  #pan(dx: number, dy: number): void {
    const { svg, scene, camera } = this.#liveCamera();
    const inverse = svg.getScreenCTM()?.inverse();
    if (
      !inverse ||
      ![inverse.a, inverse.b, inverse.c, inverse.d].every(Number.isFinite)
    )
      return;
    this.#applyCamera(
      panViewport(scene.bounds, camera, {
        x: -(inverse.a * dx + inverse.c * dy),
        y: -(inverse.b * dx + inverse.d * dy),
      }),
    );
  }

  #setHover(pick: ScenePick | null): void {
    if (
      this.#hover === pick ||
      (this.#hover &&
        pick &&
        this.#hover.kind === pick.kind &&
        this.#hover.semanticId === pick.semanticId &&
        this.#hover.sceneGeneration === pick.sceneGeneration)
    )
      return;
    this.#hover = pick;
    this.#drawIndicator(pick, "hover");
    if (this.#svg)
      this.#svg.style.cursor = this.#gesture?.dragging
        ? "grabbing"
        : pick
          ? "pointer"
          : "grab";
    for (const listener of [...this.#hoverListeners]) {
      if (this.#disposed || this.#hover !== pick) break;
      if (this.#hoverListeners.has(listener)) listener(pick);
    }
  }

  #pick(event: MouseEvent): ScenePick | null {
    const box = this.#svg?.getBoundingClientRect();
    if (
      !box ||
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      return null;
    const matrix = this.#svg?.getScreenCTM();
    if (!matrix || !this.#accepted) return null;
    return hitTestMolecularScene(
      this.#accepted.scene,
      { x: event.clientX, y: event.clientY },
      matrix,
    );
  }

  #cancelGesture(): void {
    const gesture = this.#gesture;
    this.#gesture = null;
    if (!gesture) return;
    this.#suppressClick = true;
    if (this.#svg?.hasPointerCapture(gesture.pointerId))
      this.#svg.releasePointerCapture(gesture.pointerId);
    if (this.#svg) this.#svg.style.cursor = this.#hover ? "pointer" : "grab";
  }

  #wire(svg: SVGSVGElement, attach: boolean): void {
    const listeners: Record<string, EventListener> = {
      click: this.#onClick as EventListener,
      keydown: this.#onKeyDown as EventListener,
      pointerdown: this.#onPointerDown as EventListener,
      pointermove: this.#onPointerMove as EventListener,
      pointerup: this.#onPointerUp as EventListener,
      pointercancel: this.#onPointerCancel as EventListener,
      lostpointercapture: this.#onPointerCancel as EventListener,
      pointerleave: this.#onPointerLeave as EventListener,
      wheel: this.#onWheel as EventListener,
      blur: this.#onBlur as EventListener,
    };
    for (const [name, listener] of Object.entries(listeners)) {
      if (attach) svg.addEventListener(name, listener, { passive: false });
      else svg.removeEventListener(name, listener);
    }
  }

  readonly #onPointerDown = (event: PointerEvent): void => {
    const svg = this.#svg;
    if (
      this.#disposed ||
      !svg ||
      !this.#accepted ||
      event.currentTarget !== svg ||
      !event.isPrimary ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    this.#cancelGesture();
    this.#suppressClick = false;
    this.#gesture = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      last: { x: event.clientX, y: event.clientY },
      dragging: false,
    };
    svg.setPointerCapture(event.pointerId);
    svg.focus({ preventScroll: true });
  };

  readonly #onPointerMove = (event: PointerEvent): void => {
    const svg = this.#svg;
    if (
      this.#disposed ||
      !svg ||
      !this.#accepted ||
      event.currentTarget !== svg ||
      !event.isPrimary
    )
      return;
    const gesture = this.#gesture;
    if (gesture) {
      if (event.pointerId !== gesture.pointerId) return;
      // Capture may be released before its pending acquisition generates a
      // lostpointercapture event. Treat its absence as cancellation as well.
      if (!svg.hasPointerCapture(gesture.pointerId)) {
        this.#cancelGesture();
        this.#setHover(null);
        return;
      }
      if (
        !gesture.dragging &&
        Math.hypot(
          event.clientX - gesture.start.x,
          event.clientY - gesture.start.y,
        ) < 4
      )
        return;
      const previous = gesture.dragging ? gesture.last : gesture.start;
      gesture.dragging = true;
      gesture.last = { x: event.clientX, y: event.clientY };
      svg.style.cursor = "grabbing";
      event.preventDefault();
      this.#pan(event.clientX - previous.x, event.clientY - previous.y);
    } else if (event.pointerType !== "touch" && event.buttons === 0)
      this.#setHover(this.#pick(event));
  };

  readonly #onPointerUp = (event: PointerEvent): void => {
    if (
      this.#disposed ||
      event.currentTarget !== this.#svg ||
      event.pointerId !== this.#gesture?.pointerId
    )
      return;
    const dragged = this.#gesture.dragging;
    this.#cancelGesture();
    this.#suppressClick = dragged;
    if (event.pointerType !== "touch") this.#setHover(this.#pick(event));
  };

  readonly #onPointerCancel = (event: PointerEvent): void => {
    if (
      event.currentTarget !== this.#svg ||
      event.pointerId !== this.#gesture?.pointerId
    )
      return;
    this.#cancelGesture();
    this.#setHover(null);
  };

  readonly #onPointerLeave = (event: PointerEvent): void => {
    if (event.currentTarget === this.#svg && !this.#disposed)
      this.#setHover(null);
  };

  readonly #onBlur = (): void => {
    this.#cancelGesture();
    this.#setHover(null);
  };

  readonly #onWheel = (event: WheelEvent): void => {
    const svg = this.#svg;
    if (
      this.#disposed ||
      !svg ||
      !this.#accepted ||
      event.currentTarget !== svg ||
      !event.deltaY ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    const pixels =
      event.deltaY *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? svg.getBoundingClientRect().height
          : 1);
    if (!Number.isFinite(pixels)) return;
    event.preventDefault();
    this.zoomBy(Math.exp(-Math.max(-240, Math.min(240, pixels)) * 0.002), {
      x: event.clientX,
      y: event.clientY,
    });
  };

  readonly #onClick = (event: MouseEvent): void => {
    const svg = this.#svg;
    if (
      this.#disposed ||
      !svg ||
      event.currentTarget !== svg ||
      !this.#accepted
    )
      return;
    if (this.#suppressClick) {
      this.#suppressClick = false;
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    this.#select(this.#pick(event));
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (
      this.#disposed ||
      event.currentTarget !== this.#svg ||
      !this.#accepted ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (event.shiftKey && event.key !== "+")
    )
      return;
    const key = event.key.toLowerCase();
    if (["+", "=", "-", "home", "0", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      if (["home", "0"].includes(key)) this.fit();
      else if (["+", "=", "-"].includes(key))
        this.zoomBy(key === "-" ? 1 / 1.25 : 1.25);
      else
        this.panBy(
          key === "a" ? -40 : key === "d" ? 40 : 0,
          key === "w" ? -40 : key === "s" ? 40 : 0,
        );
      return;
    }
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
      this.#drawIndicator(
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
        "focus",
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
      this.#drawIndicator(null, "focus");
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
