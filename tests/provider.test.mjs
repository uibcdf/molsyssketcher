import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createMolecularController,
  prepareSuppliedMolecule,
} from "../dist/index.js";

const corpus = JSON.parse(
  readFileSync(new URL("./data/rdkit-prepared.json", import.meta.url), "utf8"),
);

test("receives every real RDKit preparation through the built public molecular contract", async () => {
  assert.equal(corpus.cases.length, 12);
  const controller = createMolecularController({ instanceId: "rdkit-corpus" });
  for (const entry of corpus.cases) {
    const document = prepareSuppliedMolecule(entry.document);
    assert.equal(document.provider.name, "RDKit");
    assert.equal(document.provider.version, "2026.09.2");
    assert.equal(document.provider.options.parser.removeHs, false);
    assert.equal(document.provider.options.preparation.addChiralHs, false);
    assert.equal(document.provider.options.drawingCoordinates, "nonphysical");
    assert.match(entry.reference.svg, /<svg/);
    const result = await controller.replace(entry.document);
    assert.equal(result.status, "accepted");
    assert.equal(
      result.snapshot.document.original.data,
      entry.document.original.data,
    );
    assert.deepEqual(result.snapshot.document.context, entry.document.context);
  }
  const accepted = controller.state.accepted;
  const broken = structuredClone(corpus.cases[0].document);
  broken.depiction.atoms[0].atomId = "not-a-provider-atom";
  assert.equal((await controller.replace(broken)).status, "failed");
  assert.equal(controller.state.accepted, accepted);
  controller.dispose();
});

test("retains real charges, isotope, explicit H, aromatic strokes and distinct directed stereo", () => {
  const cases = Object.fromEntries(
    corpus.cases.map((entry) => [entry.id, entry]),
  );
  assert.deepEqual(
    cases.salt.document.atoms.map((atom) => atom.formalCharge).sort(),
    [-1, 1],
  );
  assert.equal(cases.isotope.document.atoms[0].isotope, 13);
  assert.equal(
    cases["explicit-hydrogen"].document.atoms.filter(
      (atom) => atom.element === "H",
    ).length,
    1,
  );
  assert.equal(
    cases.benzene.document.depiction.bonds.filter(
      (bond) => bond.style === "double",
    ).length,
    3,
  );
  const wedges = (entry) =>
    entry.document.depiction.bonds.filter((bond) =>
      bond.style.endsWith("wedge"),
    );
  const first = wedges(cases["tetra-a"]),
    second = wedges(cases["tetra-b"]);
  assert.ok(first.length > 0 && second.length > 0);
  assert.notDeepEqual(first, second);
  for (const bond of [...first, ...second])
    assert.ok(bond.atoms.includes(bond.from));
  assert.notEqual(
    cases["alkene-a"].reference.isomericSmiles,
    cases["alkene-b"].reference.isomericSmiles,
  );
  assert.notDeepEqual(
    cases["alkene-a"].document.depiction.atoms,
    cases["alkene-b"].document.depiction.atoms,
  );
});
