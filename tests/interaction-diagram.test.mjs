import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  prepareInteractionDiagram,
  buildInteractionDiagramScene,
  createInteractionDiagramController,
  hitTestInteractionDiagramScene,
  inspectDiagramTarget,
  buildMolecularScene,
} from "../dist/index.js";
const corpus = JSON.parse(
  readFileSync(new URL("./data/interaction-diagrams.json", import.meta.url)),
);
const fixture = (id = corpus.cases[0].id) =>
  structuredClone(corpus.cases.find((c) => c.id === id).input);
const measure = (text, size) => ({
  x: 0,
  y: -size,
  width: text.length * size * 0.55,
  height: size,
});
const options = { instanceId: "diagram", generation: 1 };
const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

test("all nine native mapped bundles produce immutable two-mode schematic scenes", () => {
  for (const c of corpus.cases) {
    const accepted = prepareInteractionDiagram(c.input),
      scene = buildInteractionDiagramScene(accepted, measure, options);
    assert.deepEqual(scene.document, c.input);
    assert.ok(Object.isFrozen(scene.incidences));
    assert.equal(scene.fragments.length, c.input.parents.length);
    assert.equal(
      scene.observations.length,
      c.input.page.native.page.occurrence_indices.length,
    );
    assert.equal(
      scene.incidences.length,
      scene.topology.observations.reduce(
        (s, o) => s + o.participants.length,
        0,
      ),
    );
    for (const f of scene.fragments)
      assert.deepEqual(
        f.scene.atoms,
        buildMolecularScene(
          c.input.parents.find((p) => p.parentIndex === f.parentIndex).molecule,
          measure,
          { ...options, instanceId: `diagram:parent:${f.parentIndex}` },
        ).atoms,
      );
  }
});
test("ligand geometry stays fixed while partner labels and topology grouping change", () => {
  const first = fixture(),
    second = fixture();
  second.parents[1].label = "A much longer declared context label";
  second.groups = [
    {
      id: "rings",
      label: "Both complete rings",
      members: [
        { occurrenceIndex: 0, participantIndex: 0 },
        { occurrenceIndex: 0, participantIndex: 1 },
      ],
    },
  ];
  const a = buildInteractionDiagramScene(first, measure, options),
    b = buildInteractionDiagramScene(second, measure, {
      ...options,
      generation: 2,
    });
  const focus = (s) => s.fragments.find((f) => f.parentIndex === 0);
  assert.deepEqual(focus(a).offset, { x: 0, y: 0 });
  assert.deepEqual(focus(a).scene.atoms, focus(b).scene.atoms);
  assert.deepEqual(focus(a).offset, focus(b).offset);
  assert.equal(b.groups.length, 1);
  assert.equal(b.incidences.length, 2);
  assert.equal(b.incidences[0].atoms.length, 6);
});
test("interface composition partitions composite sides and mediators without a central ligand", () => {
  const input = fixture("two-water-interface-centered"),
    scene = buildInteractionDiagramScene(input, measure, options);
  assert.equal(scene.document.composition.mode, "interface-centered");
  assert.ok(scene.fragments[0].box.x < scene.fragments[1].box.x);
  assert.ok(scene.fragments[1].box.x < scene.fragments.at(-1).box.x);
  assert.equal(scene.incidences.length, 9);
  assert.equal(scene.groups.length, 2);
  assert.deepEqual(
    scene.incidences.map((i) => i.member.role),
    input.page.native.page.participant_roles,
  );
  for (const incidence of scene.incidences)
    assert.equal(incidence.atoms.length, incidence.member.atoms.length);
});
test("exact parent states, complete source atom maps and nonambiguous composition refuse before drawing", () => {
  const mutations = [
    (x) => (x.parents[0].molecule.context.chemicalState = "old"),
    (x) => (x.page.correspondence.atoms[0].atomId = "unknown"),
    (x) => (x.parents[1].parentIndex = 0),
    (x) => (x.composition.focusParentIndex = 9),
    (x) => (x.composition.mode = "interface-centered"),
    (x) =>
      (x.groups = [
        {
          id: "bad",
          label: "Bad",
          members: [{ occurrenceIndex: 99, participantIndex: 0 }],
        },
      ]),
  ];
  for (const mutate of mutations) {
    const x = fixture();
    mutate(x);
    assert.throws(() => prepareInteractionDiagram(x));
  }
  const partition = fixture("two-water-interface-centered");
  partition.composition.right = [0];
  assert.throws(() => prepareInteractionDiagram(partition));
  const duplicate = fixture();
  duplicate.parents[0].molecule.atoms[0].id = "foreign";
  duplicate.parents[0].molecule.depiction.atoms[0].atomId = "foreign";
  assert.throws(() => prepareInteractionDiagram(duplicate));
});
test("failed atomic replacement retains the complete previous molecular/native bundle", async () => {
  const controller = createInteractionDiagramController({
    instanceId: "atomic",
  });
  const accepted = await controller.replace(fixture());
  const bad = fixture("two-water-interface-centered");
  bad.parents[1].molecule.context.preparation.generation = "stale";
  assert.equal((await controller.replace(bad)).status, "failed");
  assert.equal(controller.state.accepted, accepted.snapshot);
  controller.dispose();
  assert.equal((await controller.replace(fixture())).status, "disposed");
});
test("CSS-scaled molecular, native role, group and observation hits return exact source context", () => {
  const scene = buildInteractionDiagramScene(
    fixture("two-water-interface-centered"),
    measure,
    options,
  );
  const matrix = { a: 2, b: 0, c: 0, d: 2, e: 11, f: 17 },
    screen = (p) => ({ x: p.x * 2 + 11, y: p.y * 2 + 17 });
  const row = scene.incidences[2],
    pick = hitTestInteractionDiagramScene(
      scene,
      screen({ x: row.row.x + 30, y: row.row.y + 12 }),
      matrix,
    );
  assert.equal(pick.kind, "participant");
  assert.equal(pick.member.role, "leg_1_acceptor");
  assert.deepEqual(pick.native.analysis, scene.document.page.analysis);
  const browserMatrix = Object.defineProperties(
    {},
    Object.fromEntries(
      Object.entries(matrix).map(([key, value]) => [
        key,
        { value, enumerable: false },
      ]),
    ),
  );
  const f = scene.fragments[1],
    a = f.scene.atoms[0],
    atom = hitTestInteractionDiagramScene(
      scene,
      screen({ x: a.position.x + f.offset.x, y: a.position.y + f.offset.y }),
      browserMatrix,
    );
  assert.equal(atom.kind, "molecular");
  assert.equal(atom.parentIndex, 1);
  assert.equal(atom.memberships.length, 2);
  const group = scene.groups[0];
  assert.equal(
    hitTestInteractionDiagramScene(
      scene,
      screen({ x: group.box.x + 4, y: group.box.y + 4 }),
      matrix,
    ).kind,
    "group",
  );
  const o = scene.observations[0];
  assert.equal(
    hitTestInteractionDiagramScene(
      scene,
      screen({ x: o.box.x + 8, y: o.box.y + 8 }),
      matrix,
    ).native.memberships.length,
    9,
  );
  assert.equal(inspectDiagramTarget(scene, "retired-id"), null);
});
test("native PBC images remain scientific records rather than physical diagram transforms", () => {
  const scene = buildInteractionDiagramScene(
    fixture("two-water-periodic-interface-centered"),
    measure,
    options,
  );
  assert.deepEqual(
    scene.incidences.map((i) => i.member.image),
    scene.document.page.native.page.image_vectors,
  );
  assert.equal(scene.layout, "fixed-fragments-lanes@1");
  assert.match(scene.header[1].text, /not physical/);
});
test("unknown type is explicit, with no prototype lookup or assumed scientific glyph", () => {
  const input = fixture();
  input.page.native.page.relation_types = ["constructor"];
  input.page.native.page.participant_roles[0] = "positive";
  const scene = buildInteractionDiagramScene(input, measure, options);
  assert.equal(scene.observations[0].known, false);
  assert.match(scene.incidences[0].label.text, /Positive participant/);
  assert.doesNotMatch(scene.incidences[0].label.text, /ion ·/);
  assert.match(scene.observations[0].title.text, /Unknown interaction/);
});
test("evaluated-empty coverage and finite drawing refusal are explicit", () => {
  const empty = buildInteractionDiagramScene(
    fixture("rings-empty-interface-centered"),
    measure,
    options,
  );
  assert.equal(empty.topology.coverage, "evaluated-empty");
  assert.equal(empty.incidences.length, 0);
  assert.throws(() =>
    buildInteractionDiagramScene(
      fixture(),
      () => ({ x: 0, y: 0, width: 0, height: 0 }),
      options,
    ),
  );
  assert.throws(() =>
    hitTestInteractionDiagramScene(empty, { x: Infinity, y: 0 }, identity),
  );
  assert.throws(() =>
    hitTestInteractionDiagramScene(
      empty,
      { x: 0, y: 0 },
      { ...identity, a: -1 },
    ),
  );
});
test("input and scene options are owned without executing accessors", () => {
  let calls = 0;
  const input = fixture();
  Object.defineProperty(input, "groups", {
    get() {
      calls++;
      return [];
    },
    enumerable: true,
  });
  assert.throws(() => prepareInteractionDiagram(input));
  assert.equal(calls, 0);
  const value = fixture(),
    scene = buildInteractionDiagramScene(value, measure, options);
  value.parents[0].label = "changed";
  assert.notEqual(scene.document.parents[0].label, "changed");
  assert.throws(() => {
    scene.fragments[0].offset.x = 1;
  }, TypeError);
});

test("a structurally valid synthetic nine-occurrence page refuses the first drawing budget explicitly", () => {
  const input = fixture(),
    page = input.page.native.page;
  // Contract-only extent control; no new detector observations are claimed.
  page.method = "synthetic.diagram.extent";
  page.parameters = { scope: "synthetic extent control" };
  page.software = { "synthetic-control": "1" };
  page.total_count = 9;
  page.occurrence_indices = Array.from({ length: 9 }, (_, i) => i);
  page.structure_indices = Array(9).fill(0);
  page.relation_indices = Array(9).fill(0);
  page.evidence = Array(9).fill("synthetic");
  for (const field of Object.keys(page.measurements))
    page.measurements[field] = Array(9).fill(page.measurements[field][0]);
  if (page.image_vectors !== null) {
    const vectors = page.image_vectors;
    page.image_vectors = Array.from({ length: 9 }, () => vectors).flat();
    page.image_offsets = Array.from(
      { length: 10 },
      (_, i) => i * vectors.length,
    );
  }
  assert.throws(
    () => prepareInteractionDiagram(input),
    (e) => e.code === "input-limit",
  );
});
