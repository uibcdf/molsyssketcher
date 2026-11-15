import assert from "node:assert/strict";
import test from "node:test";
import {
  INPUT_LIMITS,
  SketcherError,
  prepareSuppliedMolecule,
  prepareSuppliedInteractionDocument,
  sameMolecularContext,
} from "../dist/index.js";
import { context, interaction, molecule } from "./fixtures.mjs";

function refuses(
  input,
  code = "invalid-input",
  prepare = prepareSuppliedMolecule,
) {
  assert.throws(
    () => prepare(input),
    (error) => error instanceof SketcherError && error.code === code,
  );
}

test("retains original bytes and explicit provider/semantic/display maps independently of ordering", () => {
  const input = molecule();
  const accepted = prepareSuppliedMolecule(input);
  assert.equal(accepted.original.data, "CO\n");
  assert.equal(accepted.atoms[0].id, "oxygen");
  assert.equal(accepted.depiction.atoms[0].atomId, "carbon");
  input.original.data = "changed";
  input.atoms.reverse();
  assert.equal(accepted.original.data, "CO\n");
  assert.equal(accepted.atoms[0].id, "oxygen");
  assert.throws(() => {
    accepted.depiction.atoms[0].x = 10;
  }, TypeError);
  assert.throws(() => {
    accepted.provider.options.changed = true;
  }, TypeError);
});

test("rejects broken identities, mappings and bond correspondence", () => {
  for (const mutate of [
    (x) => {
      x.atoms[1].id = x.atoms[0].id;
    },
    (x) => {
      x.atoms[1].providerIndex = x.atoms[0].providerIndex;
    },
    (x) => {
      x.bonds[0].atoms[0] = "absent";
    },
    (x) => {
      x.bonds[0].atoms[0] = "oxygen";
    },
    (x) => {
      x.depiction.atoms[0].atomId = "absent";
    },
    (x) => {
      x.depiction.atoms[0].atomId = "oxygen";
    },
    (x) => {
      x.depiction.atoms.pop();
    },
    (x) => {
      x.depiction.bonds.length = 0;
    },
    (x) => {
      x.depiction.bonds[0].bondId = "absent";
    },
    (x) => {
      x.depiction.bonds[0].atoms[0] = "oxygen";
    },
  ]) {
    const input = molecule();
    mutate(input);
    refuses(input);
  }
  const input = molecule();
  input.atoms.push({ ...input.atoms[0], id: "third", providerIndex: 2 });
  input.depiction.atoms.push({
    ...input.depiction.atoms[0],
    id: "display-third",
    atomId: "third",
  });
  input.depiction.bonds[0].atoms[1] = "display-third";
  refuses(input);
});

test("preserves explicit wedge origin across endpoint order and rejects missing direction", () => {
  const input = molecule();
  input.depiction.bonds[0].style = "solid-wedge";
  input.depiction.bonds[0].from = "display-o";
  const first = prepareSuppliedMolecule(input);
  input.depiction.bonds[0].atoms.reverse();
  assert.equal(
    prepareSuppliedMolecule(input).depiction.bonds[0].from,
    first.depiction.bonds[0].from,
  );
  delete input.depiction.bonds[0].from;
  refuses(input);
  input.depiction.bonds[0].from = "oxygen";
  refuses(input);
});

test("reports unsupported schema, generated mappings and axis conventions explicitly", () => {
  let input = molecule();
  input.schemaVersion = 2;
  refuses(input, "unsupported-schema");
  input = molecule();
  input.depiction.atoms[0].origin = "generated";
  refuses(input, "unsupported-feature");
  input = molecule();
  input.depiction.axes = "reflected";
  refuses(input, "unsupported-feature");
  input = molecule();
  input.extraChemistry = {};
  refuses(input, "unsupported-feature");
});

test("keeps partial coverage distinct from complete preparation", () => {
  const input = molecule();
  input.depiction.coverage = {
    status: "partial",
    missing: ["stereo assignment"],
  };
  assert.deepEqual(
    prepareSuppliedMolecule(input).depiction.coverage,
    input.depiction.coverage,
  );
  input.depiction.coverage.missing = [];
  refuses(input);
  input.depiction.coverage = { status: "complete", missing: ["stereo"] };
  refuses(input);
});

test("bounds input and refuses cyclic, nonfinite, sparse, executable or accessor data", () => {
  let input = molecule();
  input.provider.options.cycle = input;
  refuses(input);
  input = molecule();
  input.depiction.atoms[0].x = NaN;
  refuses(input);
  input = molecule();
  input.atoms[0].formalCharge = 0.5;
  refuses(input);
  input = molecule();
  input.provider.options.callback = () => {};
  refuses(input);
  input = molecule();
  input.provider.options.array = new Array(1);
  refuses(input);
  input = molecule();
  input.provider.options.date = new Date();
  refuses(input);
  input = molecule();
  let called = false;
  Object.defineProperty(input.provider.options, "secret", {
    enumerable: true,
    get() {
      called = true;
      return "x";
    },
  });
  refuses(input);
  assert.equal(called, false);
  input = molecule();
  input.original.data = "x".repeat(INPUT_LIMITS.maxTextLength + 1);
  refuses(input, "input-limit");
  input = molecule();
  let nested = input.provider.options;
  for (let i = 0; i < 40; i++) {
    nested.next = {};
    nested = nested.next;
  }
  refuses(input, "input-limit");
});

test("does not change prototypes when copying a JSON __proto__ key", () => {
  const input = molecule();
  input.provider.options = JSON.parse('{"__proto__":{"polluted":true}}');
  const prepared = prepareSuppliedMolecule(input);
  assert.equal(
    Object.getPrototypeOf(prepared.provider.options),
    Object.prototype,
  );
  assert.equal(prepared.provider.options.polluted, undefined);
  assert.equal(prepared.provider.options.__proto__.polluted, true);
});

test("accepts independently referenced molecular parents and native analyses in both modes", () => {
  for (const mode of ["ligand-centered", "interface-centered"]) {
    const input = interaction(mode);
    const prepared = prepareSuppliedInteractionDocument(input);
    assert.deepEqual(prepared.analyses, input.analyses);
    assert.equal(prepared.parents.length, 2);
    input.parents[0].structure = "changed";
    assert.equal(prepared.parents[0].structure, "0");
    assert.throws(() => {
      prepared.analyses[0].result.generation = "4";
    }, TypeError);
  }
});

test("refuses duplicate, missing and stale analysis parents without matching labels", () => {
  for (const mutate of [
    (x) => {
      x.parents.push(structuredClone(x.parents[0]));
    },
    (x) => {
      x.analyses[0].parents[0].structure = "1";
    },
    (x) => {
      x.analyses[0].parents[0].preparation.generation = "2";
    },
    (x) => {
      x.analyses[0].parents[0].molecule.owner = "another-source";
    },
    (x) => {
      x.analyses[0].parents.push(structuredClone(x.analyses[0].parents[0]));
    },
    (x) => {
      x.analyses.push(structuredClone(x.analyses[0]));
    },
  ]) {
    const input = interaction();
    mutate(input);
    refuses(input, "invalid-input", prepareSuppliedInteractionDocument);
  }
});

test("molecular context equality includes owner, generation, state, structure and preparation", () => {
  const original = context();
  assert.equal(sameMolecularContext(original, structuredClone(original)), true);
  for (const mutate of [
    (x) => {
      x.molecule.owner = "other";
    },
    (x) => {
      x.molecule.generation = "2";
    },
    (x) => {
      x.chemicalState = "other";
    },
    (x) => {
      x.structure = "1";
    },
    (x) => {
      x.preparation.generation = "2";
    },
  ]) {
    const next = structuredClone(original);
    mutate(next);
    assert.equal(sameMolecularContext(original, next), false);
  }
});
