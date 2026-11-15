import { rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Only generated output is removed; deleted modules must not survive in a package.
rmSync(new URL("../dist/", import.meta.url), { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/typescript/bin/tsc", import.meta.url),
    ),
    "-p",
    "tsconfig.json",
  ],
  { stdio: "inherit" },
);
