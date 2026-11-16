import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createInteractionPageController,
  inspectInteractionPage,
  prepareInteractionPage,
} from "../dist/index.js";
import { deferred } from "./fixtures.mjs";

const corpus = JSON.parse(
  readFileSync(new URL("./data/molsysmt-interactions.json", import.meta.url)),
);
const fixture = (id = "observed") =>
  structuredClone(corpus.cases.find((c) => c.id === id).projection);

test("receives all seven real MolSysMT pages with exact parents and original native declarations", () => {
  for (const { projection } of corpus.cases) {
    const accepted = prepareInteractionPage(projection);
    assert.deepEqual(accepted, projection);
    assert.ok(Object.isFrozen(accepted.native.page.parameters));
    assert.notEqual(accepted, projection);
  }
  const inspection = inspectInteractionPage(fixture());
  assert.equal(inspection.coverage, "evaluated");
  assert.equal(inspection.partial, false);
  assert.equal(inspection.observations.length, 2);
  assert.deepEqual(
    inspection.observations[0].participants.map((p) => p.role),
    ["positive", "negative"],
  );
  assert.deepEqual(
    inspection.observations[1].participants.flatMap((p) =>
      p.atoms.map((a) => a.atomId),
    ),
    ["K", "Cl"],
  );
  assert.deepEqual(inspection.observations[0].analysis, fixture().analysis);
});

test("distinguishes evaluated empty, unevaluated and partial pages including the last and zero-limit pages", () => {
  assert.equal(
    inspectInteractionPage(fixture("evaluated-empty")).coverage,
    "evaluated-empty",
  );
  assert.equal(
    inspectInteractionPage(fixture("unevaluated")).coverage,
    "unevaluated",
  );
  for (const id of ["first-page", "last-page", "zero-limit"]) {
    const inspection = inspectInteractionPage(fixture(id));
    assert.equal(inspection.coverage, "evaluated");
    assert.equal(inspection.partial, true);
  }
  assert.equal(
    inspectInteractionPage(fixture("last-page")).observations[0]
      .occurrenceIndex,
    1,
  );
  const pbc = prepareInteractionPage(fixture("periodic")).native.page;
  assert.deepEqual(pbc.image_vectors, [
    [0, 0, 0],
    [-1, 0, 0],
  ]);
});

test("retains producer attribution separately from the current reader and opaque quantity records", () => {
  const input = fixture();
  input.native.page.software.molsysmt = "historical-producer-version";
  input.reader.version = "different-reader-version";
  const inspection = inspectInteractionPage(input);
  assert.equal(
    inspection.projection.native.page.software.molsysmt,
    "historical-producer-version",
  );
  assert.equal(
    inspection.projection.reader.version,
    "different-reader-version",
  );
  assert.equal(inspection.quantities, "opaque");
  assert.deepEqual(
    inspection.projection.native.quantityRecords,
    input.native.quantityRecords,
  );
  assert.equal("distance" in inspection.observations[0], false);
  // No browser seal verification is claimed: this opaque mutation is retained.
  input.native.quantityRecords.distance.digest = "unverified-in-this-runtime";
  assert.equal(
    prepareInteractionPage(input).native.quantityRecords.distance.digest,
    "unverified-in-this-runtime",
  );
});

test("rejects stale internal context, ambiguous atoms, missing bindings and native map disagreements", () => {
  const mutations = [
    (x) => (x.analysis.generation = "old"),
    (x) => (x.document.analyses[0].parents[0].structure = "old-frame"),
    (x) => (x.correspondence.frames[0].structure = "old-frame"),
    (x) => x.correspondence.atoms.pop(),
    (x) => (x.correspondence.atoms[0].sourceIndex = 999),
    (x) => (x.correspondence.atoms[2].atomId = "Na"),
    (x) => (x.correspondence.authority = "guessed-from-indices"),
  ];
  for (const mutate of mutations) {
    const x = fixture();
    mutate(x);
    assert.throws(() => prepareInteractionPage(x));
  }
});

test("rejects corrupted CSR/page/coverage/unit shapes before exposing an inspection", () => {
  const mutations = [
    (x) => (x.native.page.relation_participant_offsets[1] = 0),
    (x) => x.native.page.participant_atom_offsets.pop(),
    (x) => (x.native.page.relation_indices[0] = 99),
    (x) => (x.native.page.occurrence_indices[1] = 0),
    (x) => (x.native.page.evaluated_structure_indices = []),
    (x) => (x.native.page.next_offset = 2),
    (x) => x.native.page.measurements.distance.pop(),
    (x) => delete x.native.page.measure_units.distance,
    (x) => (x.native.quantityRecords.distance.manifest.field = "wrong-field"),
    (x) => (x.native.page.image_offsets = [0, 1, 2]),
    (x) => (x.native.page.limit = 257),
  ];
  for (const mutate of mutations) {
    const x = fixture();
    mutate(x);
    assert.throws(() => prepareInteractionPage(x));
  }
});

test("native participants remain variable-size role-bearing groups in a synthetic compound contract control", () => {
  const input = fixture("first-page");
  // Synthetic receiving control, not a claim of native compound detection.
  input.native.page.participant_atoms = [0, 2, 1];
  input.native.page.participant_atom_offsets = [0, 2, 3];
  const participants =
    inspectInteractionPage(input).observations[0].participants;
  assert.deepEqual(
    participants[0].atoms.map((a) => a.atomId),
    ["Na", "K"],
  );
  assert.equal(participants[1].role, "negative");
});

test("owns JSON without executing accessors or accepting nonfinite quantities", () => {
  let calls = 0;
  const unsafe = fixture();
  Object.defineProperty(unsafe, "reader", {
    get() {
      calls++;
      return {};
    },
    enumerable: true,
  });
  assert.throws(() => prepareInteractionPage(unsafe));
  assert.equal(calls, 0);
  const input = fixture();
  const accepted = prepareInteractionPage(input);
  input.correspondence.atoms[0].atomId = "changed";
  assert.equal(accepted.correspondence.atoms[0].atomId, "Na");
  input.native.page.measurements.distance[0] = Infinity;
  assert.throws(() => prepareInteractionPage(input));
});

test("interaction-page replacements preserve accepted data across failure and retire stale native pages", async () => {
  const gate = deferred();
  let slow = false;
  const controller = createInteractionPageController({
    instanceId: "native-page",
    prepare(input) {
      return slow ? gate.promise : input;
    },
  });
  const initial = await controller.replace(fixture());
  assert.equal(initial.status, "accepted");
  assert.equal((await controller.replace({})).status, "failed");
  assert.equal(controller.state.accepted, initial.snapshot);
  slow = true;
  const old = controller.replace(fixture("first-page"));
  const latest = controller.replace(fixture("evaluated-empty"));
  slow = false;
  gate.resolve(fixture("first-page"));
  assert.equal((await old).status, "superseded");
  const accepted = await latest;
  assert.equal(
    inspectInteractionPage(accepted.snapshot.document).coverage,
    "evaluated-empty",
  );
  assert.equal(accepted.snapshot.generation, 2);
  controller.dispose();
});
