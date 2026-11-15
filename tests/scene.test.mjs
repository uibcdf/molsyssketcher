import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMolecularScene,
  hitTestMolecularScene,
  SketcherError,
} from "../dist/index.js";
import { molecule } from "./fixtures.mjs";

// Synthetic metrics exercise geometry only; real SVG metrics have a browser gate.
const measure = (text, size) => ({
  x: 0,
  y: -size * 0.8,
  width: text.length * size * 0.6,
  height: size,
});
const options = { instanceId: "unit-scene", generation: 1 };

test("scene preserves exact IDs, source context and immutable source/display separation", () => {
  const input = molecule();
  const original = structuredClone(input);
  const scene = buildMolecularScene(input, measure, options);
  assert.deepEqual(input, original);
  assert.equal(scene.atoms[0].semanticId, "carbon");
  assert.equal(scene.atoms[0].displayId, "display-c");
  assert.deepEqual(scene.context, input.context);
  assert.throws(() => {
    scene.atoms[0].position.x = 2;
  }, TypeError);
  assert.ok(
    scene.glyphs.every(
      (g) => g.mask.width >= g.box.width && g.mask.height >= g.box.height,
    ),
  );
});

test("directed solid/hashed wedges retain their originating endpoint after tuple reversal", () => {
  for (const style of ["solid-wedge", "hashed-wedge"]) {
    const input = molecule();
    input.depiction.bonds[0].style = style;
    input.depiction.bonds[0].from = "display-o";
    const first = buildMolecularScene(input, measure, options);
    input.depiction.bonds[0].atoms.reverse();
    const second = buildMolecularScene(input, measure, options);
    assert.deepEqual(first.bonds[0].primitives, second.bonds[0].primitives);
    const origin = first.atoms.find(
      (a) => a.displayId === "display-o",
    ).position;
    if (style === "solid-wedge")
      assert.deepEqual(first.bonds[0].primitives[0].points[0], origin);
    else {
      const widths = first.bonds[0].primitives.map((p) =>
        Math.hypot(
          p.points[0].x - p.points[1].x,
          p.points[0].y - p.points[1].y,
        ),
      );
      assert.ok(widths.every((width, i) => !i || width > widths[i - 1]));
    }
  }
});

test("declared source axes produce the same screen geometry without a user reflection", () => {
  const up = molecule();
  up.depiction.atoms[1].y = 1;
  const down = structuredClone(up);
  down.depiction.axes = "x-right-y-down";
  down.depiction.atoms[1].y = -1;
  assert.deepEqual(
    buildMolecularScene(up, measure, options).atoms,
    buildMolecularScene(down, measure, options).atoms,
  );
});

test("viewport hit testing follows rendered labels and bond primitives at different scales", () => {
  const scene = buildMolecularScene(molecule(), measure, options);
  for (const scale of [0.25, 1, 3]) {
    const matrix = { a: scale, b: 0, c: 0, d: scale, e: 100, f: 50 };
    const atom = scene.atoms[0];
    const hit = hitTestMolecularScene(
      scene,
      { x: atom.position.x * scale + 100, y: atom.position.y * scale + 50 },
      matrix,
    );
    assert.equal(hit.kind, "atom");
    assert.equal(hit.semanticId, "carbon");
    assert.equal(hit.sceneGeneration, 1);
    assert.deepEqual(hit.context, scene.context);
  }
  const [a, b] = scene.atoms.map((a) => a.position);
  assert.equal(
    hitTestMolecularScene(scene, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
      .kind,
    "bond",
  );
  const glyph = scene.glyphs[0];
  assert.equal(
    hitTestMolecularScene(scene, {
      x: glyph.box.x + glyph.box.width / 2,
      y: glyph.box.y + glyph.box.height / 2,
    }).semanticId,
    "oxygen",
  );
  assert.equal(hitTestMolecularScene(scene, { x: 10000, y: 10000 }), null);
  for (const scale of [0.5, 8]) {
    const matrix = { a: scale, b: 0, c: 0, d: scale, e: 0, f: 0 };
    const point = {
      x: ((a.x + b.x) / 2) * scale,
      y: ((a.y + b.y) / 2) * scale + 0.8 * scale,
    };
    assert.equal(hitTestMolecularScene(scene, point, matrix, 0)?.kind, "bond");
    assert.equal(
      hitTestMolecularScene(
        scene,
        { ...point, y: point.y + 0.4 * scale },
        matrix,
        0,
      ),
      null,
    );
  }
  assert.throws(
    () =>
      hitTestMolecularScene(
        scene,
        { x: 0, y: 0 },
        { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      ),
    SketcherError,
  );
});

test("all declared strokes have geometric primitives and invalid layouts/metrics refuse explicitly", () => {
  for (const [style, count] of [
    ["single", 1],
    ["double", 2],
    ["triple", 3],
    ["wavy", 1],
  ]) {
    const input = molecule();
    input.depiction.bonds[0].style = style;
    assert.equal(
      buildMolecularScene(input, measure, options).bonds[0].primitives.length,
      count,
    );
  }
  assert.throws(
    () =>
      buildMolecularScene(
        molecule(),
        () => ({ x: 0, y: 0, width: NaN, height: 1 }),
        options,
      ),
    SketcherError,
  );
  const coincident = molecule();
  coincident.depiction.atoms[1].x = 0;
  assert.throws(
    () => buildMolecularScene(coincident, measure, options),
    SketcherError,
  );
});
