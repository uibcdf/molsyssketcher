import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { molecule, interaction } from "../tests/fixtures.mjs";

const root = resolve(import.meta.dirname, "..");
const temporary = mkdtempSync(join(tmpdir(), "molsyssketcher-consumer-"));
try {
  const [artifact] = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        temporary,
        "--cache",
        join(temporary, "cache"),
      ],
      { cwd: root, encoding: "utf8" },
    ),
  );
  const files = artifact.files.map((item) => item.path);
  assert.ok(files.includes("dist/index.js"));
  assert.ok(files.includes("dist/index.d.ts"));
  assert.ok(files.includes("LICENSE"));
  assert.ok(
    files.every(
      (path) =>
        path.startsWith("dist/") ||
        ["LICENSE", "README.md", "package.json"].includes(path),
    ),
  );
  writeFileSync(
    join(temporary, "package.json"),
    JSON.stringify({ type: "module", private: true }),
  );
  execFileSync(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-package-lock",
      "--cache",
      join(temporary, "cache"),
      join(temporary, artifact.filename),
    ],
    { cwd: temporary, stdio: "pipe" },
  );
  writeFileSync(
    join(temporary, "consumer.mjs"),
    `
import assert from 'node:assert/strict';
import { createMolecularController, createInteractionController, createMolecularSvgView, buildMolecularScene, hitTestMolecularScene } from '@uibcdf/molsyssketcher';
assert.equal(typeof createMolecularSvgView, 'function');
const molecular = createMolecularController({ instanceId: 'clean-molecule' });
const diagram = createInteractionController({ instanceId: 'clean-diagram' });
const moleculeResult = await molecular.replace(${JSON.stringify(molecule())});
const diagramResult = await diagram.replace(${JSON.stringify(interaction())});
assert.equal(moleculeResult.status, 'accepted');
assert.equal(moleculeResult.snapshot.document.original.data, 'CO\\n');
const scene = buildMolecularScene(moleculeResult.snapshot.document,
  (text, size) => ({x:0, y:-size, width:text.length * size / 2, height:size}),
  {instanceId:'clean-scene', generation:1});
assert.equal(hitTestMolecularScene(scene, scene.atoms[0].position).semanticId, scene.atoms[0].semanticId);
assert.equal(diagramResult.status, 'accepted');
assert.equal(diagramResult.snapshot.document.parents.length, 2);
molecular.dispose(); diagram.dispose();
assert.equal(molecular.state.accepted, null);
`,
  );
  execFileSync(process.execPath, ["consumer.mjs"], {
    cwd: temporary,
    stdio: "inherit",
  });
  writeFileSync(
    join(temporary, "consumer.ts"),
    `
import { createMolecularController, createMolecularSvgView, type PreparedMolecule, type ScenePick } from '@uibcdf/molsyssketcher';
const mount = document.createElement('div');
const surface = createMolecularSvgView(mount, {instanceId:'typed-surface'});
surface.subscribeSelection((pick: ScenePick | null) => console.log(pick?.context));
if (surface.state.accepted) {
  // @ts-expect-error Accepted scene geometry is read-only.
  surface.state.accepted.scene.atoms[0].position.x = 7;
}
const controller = createMolecularController({ instanceId: 'typed-consumer' });
const result = await controller.replace({});
if (result.status === 'accepted') {
  const document: PreparedMolecule = result.snapshot.document;
  const original: string = document.original.data;
  console.log(original);
  // @ts-expect-error Accepted source data is read-only.
  document.original.data = 'mutated';
}
`,
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "--strict",
      "--noEmit",
      "--module",
      "NodeNext",
      "--target",
      "ES2022",
      "consumer.ts",
    ],
    { cwd: temporary, stdio: "inherit" },
  );
  console.log(
    `Clean consumer passed: ${artifact.filename}; ${files.length} files; integrity ${artifact.integrity}`,
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
