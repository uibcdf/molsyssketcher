import { execFileSync } from "node:child_process";
import { mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readFileSync } from "node:fs";

const root = resolve(import.meta.dirname, "..");
const temporary = mkdtempSync(join(tmpdir(), "molsyssketcher-conda-layout-"));
const version = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
).version;
try {
  const prefix = join(temporary, "prefix");
  execFileSync(
    process.execPath,
    [join(root, "devtools/stage-conda-assets.mjs"), prefix, version],
    { stdio: "inherit" },
  );
  const relocated = join(temporary, "relocated-prefix");
  renameSync(prefix, relocated);
  execFileSync(
    process.execPath,
    [join(root, "devtools/conda-build/run_test.mjs"), relocated, version],
    { cwd: temporary, stdio: "inherit" },
  );
  console.log(
    "Conda prefix-layout/relocation checks passed; no Conda archive was built or installed.",
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
