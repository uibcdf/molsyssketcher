export function canonicalVersion(value) {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)
  ) {
    throw new Error(
      "Version must be canonical X.Y.Z, without prefixes, suffixes or leading zeroes.",
    );
  }
  return value;
}

export function matchingVersions(manifestVersion, otherVersion) {
  const version = canonicalVersion(manifestVersion);
  if (version !== canonicalVersion(otherVersion))
    throw new Error("Artifact/tag version disagrees with package.json.");
  return version;
}
