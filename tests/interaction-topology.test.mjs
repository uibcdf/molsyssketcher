import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildInteractionTopology,
  findInteractionParticipantNode,
  inspectInteractionTopology,
} from "../dist/index.js";

const corpus = JSON.parse(
  readFileSync(new URL("./data/molsysmt-participants.json", import.meta.url)),
);
const ionic = JSON.parse(
  readFileSync(new URL("./data/molsysmt-interactions.json", import.meta.url)),
);
const fixture = (id) =>
  structuredClone(
    [...corpus.cases, ...ionic.cases].find((c) => c.id === id).projection,
  );
const options = (groups = []) => ({
  instanceId: "interaction-panel",
  generation: 1,
  groups,
});
const key = (occurrenceIndex, participantIndex) => ({
  occurrenceIndex,
  participantIndex,
});

test("all eight native participant controls produce reversible role-bearing topology without changing native pages", () => {
  for (const { projection } of corpus.cases) {
    const graph = buildInteractionTopology(projection, options());
    assert.deepEqual(graph.projection, projection);
    assert.equal(
      graph.observations.length,
      projection.native.page.occurrence_indices.length,
    );
    for (const observation of graph.observations) {
      const pick = inspectInteractionTopology(graph, observation.id);
      assert.deepEqual(pick.analysis, projection.analysis);
      assert.deepEqual(pick.parents, projection.document.parents);
      for (const member of pick.memberships) {
        const node = findInteractionParticipantNode(graph, memberKey(member));
        assert.deepEqual(
          inspectInteractionTopology(graph, node.id).memberships,
          [memberWithoutNode(member)],
        );
      }
    }
  }
});
const memberKey = (m) => key(m.occurrenceIndex, m.participantIndex);
const memberWithoutNode = ({ nodeId, ...member }) => member;

test("symmetric ring participants retain every original constituent and one native relation across geometries", () => {
  const parallel = buildInteractionTopology(
    fixture("rings-parallel"),
    options(),
  );
  const edge = buildInteractionTopology(fixture("rings-edge"), options());
  const [a, b] = parallel.observations[0].participants;
  assert.equal(a.role, "ring_a");
  assert.equal(b.role, "ring_b");
  assert.equal(a.atoms.length, 6);
  assert.equal(b.atoms.length, 6);
  assert.deepEqual(
    a.atoms.map((x) => x.index),
    [0, 1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    b.atoms.map((x) => x.index),
    [6, 7, 8, 9, 10, 11],
  );
  assert.equal(
    parallel.observations[0].relationIndex,
    edge.observations[0].relationIndex,
  );
  assert.notEqual(
    parallel.observations[0].evidence,
    edge.observations[0].evidence,
  );
  assert.notEqual(parallel.observations[0].id, edge.observations[0].id);
});

test("explicit grouping preserves parallel directed hydrogen bonds as two complete native hyperedges", () => {
  const graph = buildInteractionTopology(
    fixture("hydrogen-bonds"),
    options([
      {
        id: "donor-side",
        label: "Donors",
        members: [key(0, 0), key(0, 1), key(1, 0), key(1, 1)],
      },
      {
        id: "acceptor-side",
        label: "Acceptor",
        members: [key(0, 2), key(1, 2)],
      },
    ]),
  );
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.observations.length, 2);
  assert.notEqual(
    graph.observations[0].relationIndex,
    graph.observations[1].relationIndex,
  );
  for (const observation of graph.observations) {
    assert.deepEqual(
      observation.participants.map((p) => p.role),
      ["donor", "hydrogen", "acceptor"],
    );
    assert.deepEqual(
      observation.participants.map((p) => p.nodeId),
      [graph.nodes[0].id, graph.nodes[0].id, graph.nodes[1].id],
    );
  }
  assert.equal(
    inspectInteractionTopology(graph, graph.nodes[0].id).memberships.length,
    4,
  );
});

test("one- and two-water paths retain repeated mediator atoms and every directed leg after grouping", () => {
  for (const [id, roles] of [
    ["one-water", 6],
    ["two-water", 9],
    ["two-water-reverse", 9],
  ]) {
    const input = fixture(id),
      expanded = buildInteractionTopology(input, options());
    const original = expanded.observations[0].participants;
    assert.equal(original.length, roles);
    const waterMembers = original
      .filter((p) => p.atoms[0].index === 1)
      .map(memberKey);
    const grouped = buildInteractionTopology(
      input,
      options([{ id: "water", label: "Mediator", members: waterMembers }]),
    );
    const water = grouped.nodes.find((n) => n.groupId === "water");
    assert.equal(water.memberships.length, 2);
    assert.equal(new Set(water.memberships.map((m) => m.role)).size, 2);
    assert.equal(
      new Set(water.memberships.map((m) => m.atoms[0].index)).size,
      1,
    );
    assert.equal(grouped.observations[0].participants.length, roles);
    assert.deepEqual(
      grouped.observations[0].participants.map(memberWithoutNode),
      original.map(memberWithoutNode),
    );
  }
  const forward = buildInteractionTopology(fixture("two-water"), options())
    .observations[0].participants;
  const reverse = buildInteractionTopology(
    fixture("two-water-reverse"),
    options(),
  ).observations[0].participants;
  assert.deepEqual(
    forward
      .slice(3, 6)
      .map((p) => p.atoms[0].index)
      .filter((_, i) => i !== 1),
    [1, 2],
  );
  assert.deepEqual(
    reverse
      .slice(3, 6)
      .map((p) => p.atoms[0].index)
      .filter((_, i) => i !== 1),
    [2, 1],
  );
});

test("native PBC images remain attached to each role including repeated mediator occurrences", () => {
  const graph = buildInteractionTopology(
    fixture("two-water-periodic"),
    options(),
  );
  const images = graph.projection.native.page.image_vectors;
  const members = graph.observations[0].participants;
  assert.equal(images.length, 9);
  assert.deepEqual(
    members.map((m) => m.image),
    images,
  );
  assert.ok(images.some((v) => v.some((x) => x !== 0)));
  for (const atom of [1, 2]) {
    const matching = members.filter((m) => m.atoms[0].index === atom);
    assert.equal(matching.length, 2);
    assert.deepEqual(matching[0].image, matching[1].image);
  }
});

test("refuses unknown, duplicated, overlapping, partial and unsafe group declarations", () => {
  const input = fixture("one-water"),
    valid = { id: "group", label: "Label", members: [key(0, 0)] };
  for (const groups of [
    null,
    [{ ...valid, members: [] }],
    [{ ...valid, members: [key(99, 0)] }],
    [{ ...valid, members: [key(0, 0), key(0, 0)] }],
    [valid, { ...valid, id: "other" }],
    [valid, { ...valid, members: [key(0, 1)] }],
    [{ ...valid, members: [{ ...key(0, 0), atomId: "partial" }] }],
  ]) {
    assert.throws(() =>
      buildInteractionTopology(input, { ...options(), groups }),
    );
  }
  let calls = 0;
  const unsafe = options();
  Object.defineProperty(unsafe, "groups", {
    get() {
      calls++;
      return [];
    },
    enumerable: true,
  });
  assert.throws(() => buildInteractionTopology(input, unsafe));
  assert.equal(calls, 0);
  assert.throws(() =>
    buildInteractionTopology(input, { ...options(), generation: 0 }),
  );
});

test("expansion restores every member and original scientific declarations without recalculation", () => {
  const input = fixture("rings-parallel");
  const collapsed = buildInteractionTopology(
    input,
    options([
      { id: "both", label: "Interface", members: [key(0, 0), key(0, 1)] },
    ]),
  );
  const expanded = buildInteractionTopology(collapsed.projection, {
    ...options(),
    generation: 2,
  });
  assert.equal(collapsed.nodes.length, 1);
  assert.equal(expanded.nodes.length, 2);
  assert.deepEqual(
    collapsed.observations[0].participants.map(memberWithoutNode),
    expanded.observations[0].participants.map(memberWithoutNode),
  );
  assert.deepEqual(expanded.projection, input);
});

test("visual lookup refuses retired generations, other instances, analyses and frames", () => {
  const input = fixture("rings-parallel"),
    original = buildInteractionTopology(input, options());
  const foreign = fixture("rings-parallel");
  foreign.analysis = { ...foreign.analysis, generation: "2" };
  foreign.document.analyses[0].result = { ...foreign.analysis };
  for (const graph of [
    buildInteractionTopology(input, { ...options(), generation: 2 }),
    buildInteractionTopology(input, { ...options(), instanceId: "other" }),
    buildInteractionTopology(foreign, options()),
    buildInteractionTopology(fixture("rings-edge"), options()),
  ]) {
    assert.equal(inspectInteractionTopology(graph, original.nodes[0].id), null);
    assert.equal(
      inspectInteractionTopology(graph, original.observations[0].id),
      null,
    );
  }
});

test("later pages use original occurrence handles; evaluated-empty and unevaluated topologies stay distinct", () => {
  const graph = buildInteractionTopology(fixture("last-page"), options());
  assert.equal(graph.partial, true);
  assert.equal(findInteractionParticipantNode(graph, key(0, 0)), null);
  assert.equal(
    findInteractionParticipantNode(graph, key(1, 0)).memberships[0]
      .relationIndex,
    1,
  );
  for (const [id, coverage] of [
    ["rings-empty", "evaluated-empty"],
    ["unevaluated", "unevaluated"],
  ]) {
    const empty = buildInteractionTopology(fixture(id), options());
    assert.equal(empty.coverage, coverage);
    assert.deepEqual(empty.nodes, []);
    assert.deepEqual(empty.observations, []);
  }
});

test("input/group edits cannot mutate a topology, its picks, native bindings or retained units", () => {
  const input = fixture("rings-parallel"),
    configuration = options([
      { id: "one", label: "Ring", members: [key(0, 0)] },
    ]);
  const graph = buildInteractionTopology(input, configuration);
  configuration.groups[0].label = "Changed";
  input.correspondence.atoms[0].atomId = "Changed";
  assert.equal(graph.nodes[0].label, "Ring");
  assert.equal(graph.nodes[0].memberships[0].atoms[0].atomId, "C0");
  assert.throws(() => graph.nodes[0].memberships[0].atoms.pop(), TypeError);
  assert.throws(
    () =>
      (inspectInteractionTopology(
        graph,
        graph.nodes[0].id,
      ).parents[0].structure = "changed"),
    TypeError,
  );
  assert.equal(
    graph.projection.native.page.measure_units.plane_angle,
    "radians",
  );
});
