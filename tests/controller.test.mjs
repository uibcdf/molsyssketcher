import assert from "node:assert/strict";
import test from "node:test";
import {
  createMolecularController,
  createInteractionController,
  DocumentController,
} from "../dist/index.js";
import { deferred, interaction, molecule } from "./fixtures.mjs";

test("commits immutable accepted snapshots and advances generations across equivalent replacements", async () => {
  const controller = createMolecularController({ instanceId: "view-1" });
  const input = molecule();
  const promise = controller.replace(input);
  input.original.data = "changed-after-submission";
  const first = await promise;
  assert.equal(first.status, "accepted");
  assert.equal(first.snapshot.generation, 1);
  assert.equal(first.snapshot.document.original.data, "CO\n");
  const second = await controller.replace(molecule());
  assert.equal(second.snapshot.generation, 2);
  assert.equal(first.snapshot.generation, 1);
  assert.throws(() => {
    controller.state.accepted = null;
  }, TypeError);
});

test("preserves the valid accepted document after schema, input and provider failures", async () => {
  const controller = createMolecularController({
    instanceId: "view-1",
    prepare(input) {
      if (input.fail) throw new Error("private provider payload");
      return input;
    },
  });
  const first = await controller.replace(molecule());
  for (const input of [{}, { fail: true }, undefined]) {
    const result = await controller.replace(input);
    assert.equal(result.status, "failed");
    assert.equal(controller.state.accepted, first.snapshot);
    assert.equal(controller.state.lifecycle, "ready");
    assert.equal(controller.state.operation.status, "failed");
    assert.doesNotMatch(result.error.message, /private provider payload/);
    assert.throws(() => {
      result.error.code = "other";
    }, TypeError);
  }
});

test("a burst keeps one execution plus the newest queued input and retires older results", async () => {
  const gates = [],
    calls = [];
  const controller = createMolecularController({
    instanceId: "view-1",
    prepare(input, ctx) {
      const gate = deferred();
      gates.push(gate);
      calls.push({ input, ctx });
      return gate.promise;
    },
  });
  const first = controller.replace(molecule("first"));
  const skipped = [];
  for (let i = 0; i < 100; i++)
    skipped.push(controller.replace(molecule(`queued-${i}`)));
  const latest = skipped.pop();
  assert.deepEqual(controller.state.work, { running: 1, queued: 1 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].ctx.signal.aborted, true);
  assert.throws(() => {
    calls[0].input.id = "mutated";
  }, TypeError);
  assert.ok(
    (await Promise.all(skipped)).every(
      (result) => result.status === "superseded",
    ),
  );
  gates[0].resolve(molecule("first"));
  assert.equal((await first).status, "superseded");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].input.id, "queued-99");
  assert.equal(controller.state.accepted, null);
  gates[1].resolve(calls[1].input);
  assert.equal((await latest).snapshot.document.id, "queued-99");
  assert.deepEqual(controller.state.work, { running: 0, queued: 0 });
});

test("old failure cannot overwrite a newer queued operation's status", async () => {
  const firstGate = deferred();
  let calls = 0;
  const controller = createMolecularController({
    instanceId: "view-1",
    prepare(input) {
      return ++calls === 1 ? firstGate.promise : input;
    },
  });
  const old = controller.replace(molecule("old"));
  const next = controller.replace(molecule("new"));
  firstGate.reject(new Error("old failure"));
  assert.equal((await old).status, "superseded");
  assert.equal((await next).status, "accepted");
  assert.equal(controller.state.operation.status, "accepted");
});

test("a rejected newest input retires pending work and leaves accepted data intact", async () => {
  const gate = deferred();
  let slow = false;
  const controller = createMolecularController({
    instanceId: "view-1",
    prepare(input) {
      return slow ? gate.promise : input;
    },
  });
  const original = await controller.replace(molecule());
  slow = true;
  const old = controller.replace(molecule("old"));
  const queued = controller.replace(molecule("queued"));
  assert.equal((await controller.replace(undefined)).status, "failed");
  assert.equal((await queued).status, "superseded");
  assert.deepEqual(controller.state.work, { running: 1, queued: 0 });
  gate.resolve(molecule("old"));
  assert.equal((await old).status, "superseded");
  assert.equal(controller.state.accepted, original.snapshot);
  assert.equal(controller.state.operation.status, "failed");
});

test("disposal retires work without falsely freeing an uncancellable running slot", async () => {
  const gate = deferred();
  const controller = createMolecularController({
    instanceId: "view-1",
    prepare() {
      return gate.promise;
    },
  });
  const running = controller.replace(molecule());
  const queued = controller.replace(molecule("queued"));
  controller.dispose();
  controller.dispose();
  assert.equal((await queued).status, "disposed");
  assert.equal((await controller.replace(molecule())).status, "disposed");
  assert.deepEqual(controller.state.work, { running: 1, queued: 0 });
  gate.resolve(molecule());
  assert.equal((await running).status, "disposed");
  assert.equal(controller.state.accepted, null);
  assert.deepEqual(controller.state.work, { running: 0, queued: 0 });
});

test("abort callback re-entry observes coherent queue state and preserves the newest intent", async () => {
  const gate = deferred();
  let reentered,
    calls = 0;
  const controller = createMolecularController({
    instanceId: "view-1",
    prepare(input, { signal }) {
      if (++calls !== 1) return input;
      signal.addEventListener(
        "abort",
        () => {
          reentered = controller.replace(molecule("from-abort"));
        },
        { once: true },
      );
      return gate.promise;
    },
  });
  const old = controller.replace(molecule("old"));
  const middle = controller.replace(molecule("middle"));
  assert.equal((await middle).status, "superseded");
  gate.resolve(molecule("old"));
  await old;
  assert.equal((await reentered).snapshot.document.id, "from-abort");
});

test("a validator cannot publish after reentrant disposal or leak mutable candidate state", async () => {
  let controller;
  controller = new DocumentController({ instanceId: "custom" }, (value) => {
    controller.dispose();
    return value;
  });
  assert.equal((await controller.replace({ value: 1 })).status, "disposed");
  assert.equal(controller.state.accepted, null);
  const external = { value: [1] };
  const other = new DocumentController({ instanceId: "other" }, () => external);
  const result = await other.replace({});
  external.value.push(2);
  assert.deepEqual(result.snapshot.document.value, [1]);
});

test("independent molecular and interaction controllers share no accepted state or disposal", async () => {
  const molecular = createMolecularController({ instanceId: "molecular" });
  const diagram = createInteractionController({ instanceId: "diagram" });
  await molecular.replace(molecule());
  const accepted = await diagram.replace(interaction());
  molecular.dispose();
  assert.equal(diagram.state.accepted, accepted.snapshot);
  const invalid = interaction();
  invalid.analyses[0].parents[0].structure = "stale";
  assert.equal((await diagram.replace(invalid)).status, "failed");
  assert.equal(diagram.state.accepted, accepted.snapshot);
});
