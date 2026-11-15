import { readFileSync } from "node:fs";
import { matchingVersions } from "./version.mjs";

const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);
const version = matchingVersions(manifest.version, lock.version);
matchingVersions(version, lock.packages[""].version);
if (process.env.GITHUB_REF_TYPE === "tag")
  matchingVersions(version, process.env.GITHUB_REF_NAME);
console.log(`Canonical package/lock version passed: ${version}`);
