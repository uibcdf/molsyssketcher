import { SketcherError } from "./diagnostics.js";
import type { Point, Rect } from "./geometry.js";

/** Nonphysical camera over an immutable scene; zoom is relative to fitted bounds. */
export interface ViewportState {
  readonly zoom: number;
  readonly center: Point;
}

export const VIEWPORT_LIMITS = Object.freeze({
  minZoom: 0.25,
  maxZoom: 8,
  panExtent: 4,
});

function validate(bounds: Rect, viewport?: ViewportState): void {
  const margin =
    VIEWPORT_LIMITS.panExtent + 1 / (2 * VIEWPORT_LIMITS.minZoom) + 1;
  const middle = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  if (
    ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) ||
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    bounds.width / VIEWPORT_LIMITS.maxZoom === 0 ||
    bounds.height / VIEWPORT_LIMITS.maxZoom === 0 ||
    ![
      bounds.x - bounds.width * margin,
      bounds.x + bounds.width * margin,
      bounds.y - bounds.height * margin,
      bounds.y + bounds.height * margin,
    ].every(Number.isFinite) ||
    (viewport &&
      (!Number.isFinite(viewport.zoom) ||
        viewport.zoom < VIEWPORT_LIMITS.minZoom ||
        viewport.zoom > VIEWPORT_LIMITS.maxZoom ||
        ![viewport.center.x, viewport.center.y].every(Number.isFinite) ||
        viewport.center.x <
          middle.x - bounds.width * VIEWPORT_LIMITS.panExtent ||
        viewport.center.x >
          middle.x + bounds.width * VIEWPORT_LIMITS.panExtent ||
        viewport.center.y <
          middle.y - bounds.height * VIEWPORT_LIMITS.panExtent ||
        viewport.center.y >
          middle.y + bounds.height * VIEWPORT_LIMITS.panExtent))
  )
    throw new SketcherError(
      "invalid-input",
      "Invalid scene bounds or viewport state.",
    );
}

const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));

function snapshot(bounds: Rect, zoom: number, center: Point): ViewportState {
  const middle = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  return Object.freeze({
    zoom,
    center: Object.freeze({
      x: clamp(
        center.x,
        middle.x - bounds.width * VIEWPORT_LIMITS.panExtent,
        middle.x + bounds.width * VIEWPORT_LIMITS.panExtent,
      ),
      y: clamp(
        center.y,
        middle.y - bounds.height * VIEWPORT_LIMITS.panExtent,
        middle.y + bounds.height * VIEWPORT_LIMITS.panExtent,
      ),
    }),
  });
}

export function fitViewport(bounds: Rect): ViewportState {
  validate(bounds);
  return snapshot(bounds, 1, {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  });
}

/** Move the camera center by a nonphysical scene-space delta. */
export function panViewport(
  bounds: Rect,
  viewport: ViewportState,
  delta: Point,
): ViewportState {
  validate(bounds, viewport);
  if (![delta.x, delta.y].every(Number.isFinite))
    throw new SketcherError("invalid-input", "Invalid camera displacement.");
  return snapshot(bounds, viewport.zoom, {
    x: viewport.center.x + delta.x,
    y: viewport.center.y + delta.y,
  });
}

/** Positive uniform zoom; the anchor keeps its screen position unless pan clamps. */
export function zoomViewport(
  bounds: Rect,
  viewport: ViewportState,
  factor: number,
  anchor: Point = viewport.center,
): ViewportState {
  validate(bounds, viewport);
  if (
    !Number.isFinite(factor) ||
    factor <= 0 ||
    ![anchor.x, anchor.y].every(Number.isFinite)
  )
    throw new SketcherError(
      "invalid-input",
      "Zoom requires a positive factor and finite anchor.",
    );
  const zoom = clamp(
    viewport.zoom * factor,
    VIEWPORT_LIMITS.minZoom,
    VIEWPORT_LIMITS.maxZoom,
  );
  const ratio = viewport.zoom / zoom;
  if (zoom === viewport.zoom) return snapshot(bounds, zoom, viewport.center);
  return snapshot(bounds, zoom, {
    x: anchor.x + (viewport.center.x - anchor.x) * ratio,
    y: anchor.y + (viewport.center.y - anchor.y) * ratio,
  });
}

export function viewportBounds(bounds: Rect, viewport: ViewportState): Rect {
  validate(bounds, viewport);
  const width = bounds.width / viewport.zoom,
    height = bounds.height / viewport.zoom;
  return Object.freeze({
    x: viewport.center.x - width / 2,
    y: viewport.center.y - height / 2,
    width,
    height,
  });
}
