import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { canonicalVersion, matchingVersions } from "./version.mjs";

const [prefix, expectedVersion] = process.argv.slice(2);
if (!prefix || !expectedVersion)
  throw new Error("Usage: stage-conda-assets.mjs PREFIX X.Y.Z");
const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = matchingVersions(
  manifest.version,
  canonicalVersion(expectedVersion),
);
const destination = join(resolve(prefix), "share", "molsyssketcher");
if (existsSync(destination))
  throw new Error(
    "Refusing to overwrite an existing MolSysSketcher asset directory.",
  );
const files = readdirSync(join(root, "dist"), { withFileTypes: true });
if (
  !files.length ||
  files.some((entry) => !entry.isFile() || !/\.(js|d\.ts)$/.test(entry.name))
) {
  throw new Error(
    "Build a clean ESM/declaration payload before staging Conda assets.",
  );
}
mkdirSync(destination, { recursive: true });
cpSync(join(root, "dist"), join(destination, "dist"), { recursive: true });
for (const file of ["LICENSE", "README.md"])
  cpSync(join(root, file), join(destination, file));
const installedMetadata = Object.fromEntries(
  ["name", "version", "description", "license", "type", "exports", "types"].map(
    (key) => [key, manifest[key]],
  ),
);
writeFileSync(
  join(destination, "package.json"),
  JSON.stringify({ ...installedMetadata, private: true }, null, 2) + "\n",
);
const payloadPaths = [
  "LICENSE",
  "README.md",
  "package.json",
  ...files.map((entry) => `dist/${entry.name}`),
].sort();
writeFileSync(
  join(destination, "asset-manifest.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      package: "molsyssketcher",
      version,
      files: payloadPaths.map((path) => ({
        path,
        sha256: createHash("sha256")
          .update(readFileSync(join(destination, path)))
          .digest("hex"),
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(`Staged MolSysSketcher ${version}: ${payloadPaths.length} files.`);
