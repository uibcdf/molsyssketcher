import assert from "node:assert/strict";
import { test } from "node:test";
import fixture from "../../tests/data/editor-experiment.json" with { type: "json" };
import { EditExperiment } from "../../.experiment/editor_experiment/session.js";

const create = (editable = true) =>
  new EditExperiment({
    instanceId: "editor-control",
    editable,
    source: fixture.source,
    graph: fixture.initialGraph,
  });
const change = { kind: "set-bond-order", bondId: "bond:0", order: 2 };
const layout = (name, index = 0) => ({
  graph: fixture.cases[name].graph,
  document: fixture.cases[name].layouts[index].document,
});
function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

test("typed edit, undo and redo preserve source/IDs/selection and advance generations without reviving observations", () => {
  const session = create(),
    original = JSON.stringify(session.source);
  session.select({ kind: "bond", id: "bond:0" });
  const initial = session.state;
  session.apply(change);
  assert.equal(session.state.generation, 2);
  assert.equal(session.state.graph.bonds[0].order, 2);
  assert.equal(session.state.layout, null);
  assert.equal(session.state.attachedObservation.current, false);
  assert.equal(
    session.receiveValidation(
      session.request("validation"),
      fixture.cases.double.validation,
    ),
    "accepted",
  );
  assert.equal(session.state.validation.status, "valid");
  assert.equal(
    session.receiveLayout(session.request("layout"), layout("double")),
    "accepted",
  );
  assert.equal(session.state.layout.document.original.data, "C=CO");
  session.undo();
  assert.equal(session.state.generation, 3);
  assert.deepEqual(session.state.graph, initial.graph);
  assert.deepEqual(session.state.selection, initial.selection);
  assert.deepEqual(session.state.layout.document, initial.layout.document);
  assert.equal(session.state.layout.generation, 3);
  assert.equal(session.state.layout.basisGeneration, 1);
  assert.equal(session.state.validation.status, "unvalidated");
  assert.equal(session.state.attachedObservation.current, false);
  session.redo();
  assert.equal(session.state.generation, 4);
  assert.equal(session.state.graph.bonds[0].order, 2);
  assert.equal(session.state.layout.document.original.data, "C=CO");
  assert.equal(JSON.stringify(session.source), original);
  assert.equal(Object.isFrozen(session.state.graph.bonds[0]), true);
});

test("validation delivered after edit/undo cannot become current, even when graph content matches again", async () => {
  const session = create(),
    ticket = session.request("validation"),
    delivery = deferred();
  const completion = delivery.promise.then((report) =>
    session.receiveValidation(ticket, report),
  );
  session.apply(change);
  session.undo();
  delivery.resolve(fixture.cases.single.validation);
  assert.equal(await completion, "stale");
  assert.equal(session.state.validation.status, "unvalidated");
  assert.equal(session.state.generation, 3);
  assert.equal(
    session.receiveValidation(
      session.request("validation"),
      fixture.cases.single.validation,
    ),
    "accepted",
  );
  assert.equal(session.state.validation.status, "valid");
});

test("same-graph layout destinations receive newest intent in reverse delivery order independently of validation", async () => {
  const session = create(),
    old = session.request("layout"),
    next = session.request("layout");
  const validation = session.request("validation");
  const a = deferred(),
    b = deferred();
  const oldCompletion = a.promise.then((report) =>
    session.receiveLayout(old, report),
  );
  const newCompletion = b.promise.then((report) =>
    session.receiveLayout(next, report),
  );
  b.resolve(layout("single", 1));
  assert.equal(await newCompletion, "accepted");
  const accepted = session.state.layout;
  a.resolve(layout("single", 0));
  assert.equal(await oldCompletion, "stale");
  assert.equal(session.state.layout, accepted);
  assert.equal(
    session.receiveValidation(validation, fixture.cases.single.validation),
    "accepted",
  );
  assert.equal(
    session.receiveLayout(session.request("layout"), layout("double")),
    "rejected",
  );
  assert.equal(session.state.layout, accepted);
});

test("read-only capability rejects chemical writes and foreign tickets without changing state", () => {
  const session = create(false),
    before = JSON.stringify(session.state);
  for (const action of [
    () => session.apply(change),
    () => session.undo(),
    () => session.redo(),
  ])
    assert.throws(action, (error) => error.code === "unsupported-feature");
  assert.equal(JSON.stringify(session.state), before);
  const other = create();
  const ticket = other.request("validation");
  assert.equal(
    session.receiveValidation(ticket, fixture.cases.single.validation),
    "stale",
  );
  assert.equal(other.state.outstanding, 1);
  session.select({ kind: "atom", id: "atom:0" });
  assert.equal(session.state.generation, 1);
  assert.throws(
    () => other.apply({ ...change, bondId: "absent" }),
    (error) => error.code === "invalid-input",
  );
});

test("invalid drafts and unsupported/execution-failed validation stay distinct without dropping graph or source", () => {
  const session = create();
  session.apply({ kind: "set-bond-order", bondId: "bond:1", order: 3 });
  const graph = session.state.graph;
  assert.equal(
    session.receiveValidation(
      session.request("validation"),
      fixture.cases["invalid-oxygen"].validation,
    ),
    "accepted",
  );
  assert.equal(session.state.validation.status, "invalid");
  assert.equal(session.state.graph, graph);
  assert.equal(session.state.layout, null);
  for (const status of ["unsupported", "failed"]) {
    const report = {
      status,
      graph,
      provider: {
        name: "controlled-negative-provider",
        version: "1",
        operation: "receipt-contract",
      },
      reason: "synthetic contract control",
    };
    assert.equal(
      session.receiveValidation(session.request("validation"), report),
      "accepted",
    );
    assert.equal(session.state.validation.status, status);
    assert.equal(session.state.graph, graph);
  }
  assert.equal(
    session.receiveValidation(
      session.request("validation"),
      fixture.cases.single.validation,
    ),
    "rejected",
  );
  assert.equal(session.state.validation.status, "failed");
  assert.equal(session.state.graph, graph);
  session.undo();
  assert.equal(session.state.layout.document.original.data, "CCO\n");
});

test("bounded history, honest outstanding receipts, branching and disposal retain no live late result", () => {
  const session = create(),
    a = session.request("validation"),
    b = session.request("validation");
  session.apply(change);
  session.undo();
  assert.throws(
    () => session.request("validation"),
    (error) => error.code === "input-limit",
  );
  assert.equal(
    session.receiveValidation(a, fixture.cases.single.validation),
    "stale",
  );
  assert.equal(
    session.receiveValidation(b, fixture.cases.single.validation),
    "stale",
  );
  for (let index = 0; index < 12; index++)
    session.apply({ ...change, order: index % 2 ? 1 : 2 });
  assert.equal(session.state.undo, 8);
  session.undo();
  assert.equal(session.state.redo, 1);
  session.apply({ ...change, order: 3 });
  assert.equal(session.state.redo, 0);
  const ticket = session.request("layout");
  session.dispose();
  session.dispose();
  assert.equal(session.receiveLayout(ticket, layout("single")), "disposed");
  assert.equal(session.state.layout, null);
  assert.equal(session.state.outstanding, 0);
  assert.throws(
    () => session.request("validation"),
    (error) => error.code === "disposed",
  );
});
