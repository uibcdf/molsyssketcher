import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fitViewport,
  panViewport,
  zoomViewport,
  viewportBounds,
  VIEWPORT_LIMITS,
  SketcherError,
} from "../dist/index.js";

const bounds = Object.freeze({ x: -40, y: -30, width: 180, height: 120 });
const close = (a, b) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${a} differs from ${b}`);

test("camera zoom keeps an arbitrary anchor at the same normalized viewport position", () => {
  const fitted = fitViewport(bounds);
  const anchor = { x: 13, y: 55 };
  for (const factor of [0.25, 0.5, 2, 8, 1000]) {
    const next = zoomViewport(bounds, fitted, factor, anchor);
    const before = viewportBounds(bounds, fitted),
      after = viewportBounds(bounds, next);
    close(
      (anchor.x - before.x) / before.width,
      (anchor.x - after.x) / after.width,
    );
    close(
      (anchor.y - before.y) / before.height,
      (anchor.y - after.y) / after.height,
    );
    assert.ok(after.width > 0 && after.height > 0);
    assert.equal(after.width / after.height, bounds.width / bounds.height);
    assert.equal(Object.isFrozen(next.center), true);
  }
  assert.deepEqual(viewportBounds(bounds, fitted), bounds);
});

test("bounded camera pan and zoom compose reversibly without mutating source or old state", () => {
  const fitted = fitViewport(bounds),
    before = structuredClone(fitted);
  let camera = zoomViewport(bounds, fitted, 2);
  camera = panViewport(bounds, camera, { x: 15, y: -9 });
  assert.equal(camera.zoom, 2);
  camera = panViewport(bounds, camera, { x: -15, y: 9 });
  camera = zoomViewport(bounds, camera, 0.5);
  assert.deepEqual(camera, fitted);
  assert.deepEqual(fitted, before);
  assert.equal(
    zoomViewport(bounds, fitted, 1e300).zoom,
    VIEWPORT_LIMITS.maxZoom,
  );
  assert.equal(
    zoomViewport(bounds, fitted, 1e-300).zoom,
    VIEWPORT_LIMITS.minZoom,
  );
  const clamped = panViewport(bounds, fitted, { x: 1e300, y: -1e300 });
  assert.equal(
    clamped.center.x,
    fitted.center.x + bounds.width * VIEWPORT_LIMITS.panExtent,
  );
  assert.equal(
    clamped.center.y,
    fitted.center.y - bounds.height * VIEWPORT_LIMITS.panExtent,
  );
  assert.deepEqual(bounds, { x: -40, y: -30, width: 180, height: 120 });
});

test("invalid cameras and nonfinite/degenerate navigation refuse explicitly", () => {
  const fitted = fitViewport(bounds);
  for (const factor of [0, -1, NaN, Infinity])
    assert.throws(() => zoomViewport(bounds, fitted, factor), SketcherError);
  assert.throws(() => fitViewport({ ...bounds, width: 0 }), SketcherError);
  assert.throws(() => fitViewport({ ...bounds, x: Infinity }), SketcherError);
  assert.throws(() => fitViewport({ ...bounds, width: 1e308 }), SketcherError);
  assert.throws(
    () => fitViewport({ ...bounds, width: Number.MIN_VALUE }),
    SketcherError,
  );
  assert.throws(
    () => viewportBounds(bounds, { ...fitted, zoom: 0 }),
    SketcherError,
  );
  assert.throws(
    () => viewportBounds(bounds, { ...fitted, center: { x: 1e308, y: 0 } }),
    SketcherError,
  );
  assert.throws(
    () => panViewport(bounds, fitted, { x: NaN, y: 0 }),
    SketcherError,
  );
  assert.throws(
    () => zoomViewport(bounds, fitted, 2, { x: 0, y: Infinity }),
    SketcherError,
  );
});
