import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Standalone installed-payload receiver: imports only files below the tested prefix.
const prefix = process.argv[2] ?? process.env.PREFIX;
const expectedVersion = process.argv[3] ?? process.env.PKG_VERSION;
assert.equal(expectedVersion?.trim(), expectedVersion);
assert.ok(prefix, "A test prefix is required.");
assert.match(
  expectedVersion ?? "",
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
);
const directory = join(resolve(prefix), "share", "molsyssketcher");
const metadata = JSON.parse(
  readFileSync(join(directory, "package.json"), "utf8"),
);
const manifest = JSON.parse(
  readFileSync(join(directory, "asset-manifest.json"), "utf8"),
);
assert.equal(metadata.version, expectedVersion);
assert.equal(metadata.license, "MIT");
assert.equal(metadata.type, "module");
assert.equal(metadata.devDependencies, undefined);
assert.equal(manifest.version, expectedVersion);
assert.equal(manifest.schemaVersion, 1);
for (const file of manifest.files) {
  assert.ok(
    /^(dist\/[a-z-]+\.(js|d\.ts)|LICENSE|README\.md|package\.json)$/.test(
      file.path,
    ),
  );
  assert.equal(
    createHash("sha256")
      .update(readFileSync(join(directory, file.path)))
      .digest("hex"),
    file.sha256,
  );
}
assert.ok(manifest.files.some(({ path }) => path === "dist/index.d.ts"));
const {
  createMolecularController,
  createInteractionController,
  createMolecularSvgView,
  buildMolecularScene,
} = await import(pathToFileURL(join(directory, "dist/index.js")).href);
assert.equal(typeof createMolecularSvgView, "function");
assert.equal(typeof buildMolecularScene, "function");
const molecular = createMolecularController({
  instanceId: "installed-molecular",
});
assert.equal((await molecular.replace({})).status, "failed");
const parent = {
  molecule: { owner: "synthetic", id: "molecule", generation: "1" },
  chemicalState: "0",
  structure: "0",
  preparation: { owner: "synthetic", id: "prep", generation: "1" },
};
for (const mode of ["ligand-centered", "interface-centered"]) {
  const diagram = createInteractionController({
    instanceId: `installed-${mode}`,
  });
  const result = await diagram.replace({
    schemaVersion: 1,
    kind: "interaction-document",
    id: "diagram",
    mode,
    parents: [parent],
    analyses: [
      {
        result: { owner: "synthetic", id: "analysis", generation: "1" },
        parents: [parent],
      },
    ],
  });
  assert.equal(result.status, "accepted");
  assert.equal(result.snapshot.document.mode, mode);
  diagram.dispose();
}
molecular.dispose();
console.log(
  `Installed asset identity/import checks passed: MolSysSketcher ${expectedVersion}`,
);
