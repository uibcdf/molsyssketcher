import assert from "node:assert/strict";
import test from "node:test";
import { canonicalVersion, matchingVersions } from "../devtools/version.mjs";

test("development/artifact versions use the same canonical X.Y.Z representation", () => {
  for (const version of ["0.0.0", "0.1.0", "1.0.0", "12.34.567"]) {
    assert.equal(canonicalVersion(version), version);
    assert.equal(matchingVersions(version, version), version);
  }
});

test("rejects prefixed, suffixed, ambiguous and mismatched package/tag versions", () => {
  for (const version of [
    "v1.2.3",
    "1.2.3-dev",
    "1.2.3+build",
    "1.2",
    "1.2.3.4",
    "01.2.3",
    "1.02.3",
    "1.2.03",
    " 1.2.3",
    "1.2.3\n",
    null,
    1,
  ]) {
    assert.throws(() => canonicalVersion(version));
  }
  assert.throws(() => matchingVersions("1.2.3", "1.2.4"));
});
