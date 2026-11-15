import { SketcherError } from "./diagnostics.js";
import { INPUT_LIMITS, snapshotJson } from "./json.js";
import type {
  InteractionDocument,
  JsonValue,
  MolecularContext,
  PreparedMolecule,
  ResourceReference,
} from "./types.js";

type RecordValue = { readonly [key: string]: JsonValue };

function fail(path: string, message: string): never {
  throw new SketcherError("invalid-input", message, path);
}

function record(value: JsonValue | undefined, path: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(path, "Expected an object.");
  }
  return value as RecordValue;
}

function fields(
  value: RecordValue,
  required: string[],
  optional: string[],
  path: string,
): void {
  for (const key of required) {
    if (!Object.hasOwn(value, key))
      fail(`${path}.${key}`, "Required field is missing.");
  }
  for (const key of Object.keys(value)) {
    if (!required.includes(key) && !optional.includes(key)) {
      throw new SketcherError(
        "unsupported-feature",
        "Unknown field in this profile.",
        `${path}.${key}`,
      );
    }
  }
}

function string(
  value: JsonValue | undefined,
  path: string,
  allowEmpty = false,
): string {
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) {
    fail(path, "Expected a nonempty string.");
  }
  return value;
}

function integer(
  value: JsonValue | undefined,
  path: string,
  minimum = Number.MIN_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum
  ) {
    fail(path, "Expected an integer in the admitted range.");
  }
  return value;
}

function choice(
  value: JsonValue | undefined,
  options: readonly string[],
  path: string,
): string {
  const selected = string(value, path);
  if (!options.includes(selected)) {
    throw new SketcherError(
      "unsupported-feature",
      "Unsupported value in this profile.",
      path,
    );
  }
  return selected;
}

function array(
  value: JsonValue | undefined,
  path: string,
  max: number,
  min = 0,
): readonly JsonValue[] {
  if (!Array.isArray(value) || value.length < min)
    fail(path, "Expected an array with admitted size.");
  if (value.length > max)
    throw new SketcherError(
      "input-limit",
      "Collection size limit exceeded.",
      path,
    );
  return value as readonly JsonValue[];
}

function reference(
  value: JsonValue | undefined,
  path: string,
): ResourceReference {
  const item = record(value, path);
  fields(item, ["owner", "id", "generation"], [], path);
  for (const key of ["owner", "id", "generation"])
    string(item[key], `${path}.${key}`);
  return item as unknown as ResourceReference;
}

function context(value: JsonValue | undefined, path: string): MolecularContext {
  const item = record(value, path);
  fields(
    item,
    ["molecule", "chemicalState", "structure", "preparation"],
    [],
    path,
  );
  reference(item.molecule, `${path}.molecule`);
  reference(item.preparation, `${path}.preparation`);
  string(item.chemicalState, `${path}.chemicalState`);
  string(item.structure, `${path}.structure`);
  return item as unknown as MolecularContext;
}

function referenceKey(value: ResourceReference): readonly string[] {
  return [value.owner, value.id, value.generation];
}

function contextKey(value: MolecularContext): string {
  return JSON.stringify([
    referenceKey(value.molecule),
    value.chemicalState,
    value.structure,
    referenceKey(value.preparation),
  ]);
}

export function sameMolecularContext(
  left: MolecularContext,
  right: MolecularContext,
): boolean {
  return contextKey(left) === contextKey(right);
}

function header(input: unknown, kind: string): RecordValue {
  const value = record(snapshotJson(input), "$");
  if (value.schemaVersion !== 1) {
    throw new SketcherError(
      "unsupported-schema",
      "Only schemaVersion 1 is supported.",
      "$.schemaVersion",
    );
  }
  if (value.kind !== kind) fail("$.kind", "Unexpected document kind.");
  string(value.id, "$.id");
  return value;
}

function unique(
  set: Set<string | number>,
  value: string | number,
  path: string,
): void {
  if (set.has(value)) fail(path, "Duplicate local identity or provider index.");
  set.add(value);
}

function endpoints(
  value: JsonValue | undefined,
  valid: ReadonlySet<string | number>,
  path: string,
): readonly [string, string] {
  const pair = array(value, path, 2, 2);
  const first = string(pair[0], `${path}[0]`);
  const second = string(pair[1], `${path}[1]`);
  if (first === second || !valid.has(first) || !valid.has(second))
    fail(path, "Invalid bond endpoints.");
  return [first, second];
}

/** Validate structure and correspondence, not chemical perception or correctness. */
export function prepareSuppliedMolecule(input: unknown): PreparedMolecule {
  const value = header(input, "prepared-molecule");
  fields(
    value,
    [
      "schemaVersion",
      "kind",
      "id",
      "original",
      "context",
      "provider",
      "atoms",
      "bonds",
      "depiction",
    ],
    [],
    "$",
  );
  const original = record(value.original, "$.original");
  fields(original, ["format", "data", "source"], [], "$.original");
  string(original.format, "$.original.format");
  string(original.data, "$.original.data");
  reference(original.source, "$.original.source");
  context(value.context, "$.context");
  const provider = record(value.provider, "$.provider");
  fields(
    provider,
    ["name", "version", "route", "options"],
    ["build"],
    "$.provider",
  );
  if (Object.hasOwn(provider, "build"))
    string(provider.build, "$.provider.build");
  for (const key of ["name", "version", "route"])
    string(provider[key], `$.provider.${key}`);
  record(provider.options, "$.provider.options");

  const atomIds = new Set<string | number>();
  const atomIndices = new Set<string | number>();
  array(value.atoms, "$.atoms", INPUT_LIMITS.maxAtoms, 1).forEach(
    (entry, i) => {
      const path = `$.atoms[${i}]`;
      const atom = record(entry, path);
      fields(
        atom,
        [
          "id",
          "providerIndex",
          "element",
          "isotope",
          "formalCharge",
          "hydrogenCount",
        ],
        [],
        path,
      );
      unique(atomIds, string(atom.id, `${path}.id`), `${path}.id`);
      unique(
        atomIndices,
        integer(atom.providerIndex, `${path}.providerIndex`, 0),
        `${path}.providerIndex`,
      );
      string(atom.element, `${path}.element`);
      integer(atom.formalCharge, `${path}.formalCharge`);
      if (atom.isotope !== null) integer(atom.isotope, `${path}.isotope`, 1);
      if (atom.hydrogenCount !== null)
        integer(atom.hydrogenCount, `${path}.hydrogenCount`, 0);
    },
  );
  const bondIds = new Set<string | number>();
  const bondIndices = new Set<string | number>();
  const bonds = new Map<string, readonly [string, string]>();
  array(value.bonds, "$.bonds", INPUT_LIMITS.maxBonds).forEach((entry, i) => {
    const path = `$.bonds[${i}]`;
    const bond = record(entry, path);
    fields(bond, ["id", "providerIndex", "atoms"], [], path);
    const id = string(bond.id, `${path}.id`);
    unique(bondIds, id, `${path}.id`);
    unique(
      bondIndices,
      integer(bond.providerIndex, `${path}.providerIndex`, 0),
      `${path}.providerIndex`,
    );
    bonds.set(id, endpoints(bond.atoms, atomIds, `${path}.atoms`));
  });

  const depiction = record(value.depiction, "$.depiction");
  fields(
    depiction,
    [
      "generation",
      "profile",
      "coordinates",
      "axes",
      "atoms",
      "bonds",
      "coverage",
    ],
    [],
    "$.depiction",
  );
  string(depiction.generation, "$.depiction.generation");
  choice(depiction.profile, ["supplied-bijective@1"], "$.depiction.profile");
  choice(depiction.coordinates, ["drawing"], "$.depiction.coordinates");
  choice(
    depiction.axes,
    ["x-right-y-up", "x-right-y-down"],
    "$.depiction.axes",
  );
  const displayIds = new Set<string | number>();
  const mappedAtoms = new Set<string | number>();
  const displayToAtom = new Map<string, string>();
  array(depiction.atoms, "$.depiction.atoms", INPUT_LIMITS.maxAtoms, 1).forEach(
    (entry, i) => {
      const path = `$.depiction.atoms[${i}]`;
      const atom = record(entry, path);
      fields(atom, ["id", "atomId", "origin", "x", "y", "label"], [], path);
      const id = string(atom.id, `${path}.id`);
      const atomId = string(atom.atomId, `${path}.atomId`);
      unique(displayIds, id, `${path}.id`);
      unique(mappedAtoms, atomId, `${path}.atomId`);
      if (!atomIds.has(atomId))
        fail(`${path}.atomId`, "Unknown semantic atom.");
      choice(atom.origin, ["mapped"], `${path}.origin`);
      if (typeof atom.x !== "number" || typeof atom.y !== "number")
        fail(path, "Expected finite drawing coordinates.");
      string(atom.label, `${path}.label`, true);
      displayToAtom.set(id, atomId);
    },
  );
  if (mappedAtoms.size !== atomIds.size)
    fail(
      "$.depiction.atoms",
      "This profile requires a complete atom bijection.",
    );
  const displayBondIds = new Set<string | number>();
  const mappedBonds = new Set<string | number>();
  array(depiction.bonds, "$.depiction.bonds", INPUT_LIMITS.maxBonds).forEach(
    (entry, i) => {
      const path = `$.depiction.bonds[${i}]`;
      const bond = record(entry, path);
      fields(bond, ["id", "bondId", "atoms", "style"], ["from"], path);
      unique(displayBondIds, string(bond.id, `${path}.id`), `${path}.id`);
      const bondId = string(bond.bondId, `${path}.bondId`);
      unique(mappedBonds, bondId, `${path}.bondId`);
      const semantic = bonds.get(bondId);
      if (!semantic) fail(`${path}.bondId`, "Unknown semantic bond.");
      const pair = endpoints(bond.atoms, displayIds, `${path}.atoms`);
      if (
        !semantic.includes(displayToAtom.get(pair[0]) ?? "") ||
        !semantic.includes(displayToAtom.get(pair[1]) ?? "")
      ) {
        fail(
          `${path}.atoms`,
          "Depiction endpoints disagree with the semantic bond.",
        );
      }
      const style = choice(
        bond.style,
        ["single", "double", "triple", "solid-wedge", "hashed-wedge", "wavy"],
        `${path}.style`,
      );
      if (style === "solid-wedge" || style === "hashed-wedge") {
        if (!pair.includes(string(bond.from, `${path}.from`)))
          fail(`${path}.from`, "Wedge origin must be a depiction endpoint.");
      } else if (Object.hasOwn(bond, "from"))
        fail(
          `${path}.from`,
          "Only a directed wedge has an origin in this profile.",
        );
    },
  );
  if (mappedBonds.size !== bondIds.size)
    fail(
      "$.depiction.bonds",
      "This profile requires a complete bond bijection.",
    );
  const coverage = record(depiction.coverage, "$.depiction.coverage");
  fields(coverage, ["status", "missing"], [], "$.depiction.coverage");
  const status = choice(
    coverage.status,
    ["complete", "partial"],
    "$.depiction.coverage.status",
  );
  const missing = array(coverage.missing, "$.depiction.coverage.missing", 256);
  missing.forEach((item, i) =>
    string(item, `$.depiction.coverage.missing[${i}]`),
  );
  if ((status === "complete") !== (missing.length === 0))
    fail(
      "$.depiction.coverage",
      "Coverage must identify missing preparation information.",
    );
  return value as unknown as PreparedMolecule;
}

/** Accept exact multi-parent/native-result references without scientific inference. */
export function prepareSuppliedInteractionDocument(
  input: unknown,
): InteractionDocument {
  const value = header(input, "interaction-document");
  fields(
    value,
    ["schemaVersion", "kind", "id", "mode", "parents", "analyses"],
    [],
    "$",
  );
  choice(value.mode, ["ligand-centered", "interface-centered"], "$.mode");
  const parents = new Set<string | number>();
  array(value.parents, "$.parents", INPUT_LIMITS.maxParents, 1).forEach(
    (item, i) => {
      unique(
        parents,
        contextKey(context(item, `$.parents[${i}]`)),
        `$.parents[${i}]`,
      );
    },
  );
  const results = new Set<string | number>();
  array(value.analyses, "$.analyses", INPUT_LIMITS.maxAnalyses, 1).forEach(
    (entry, i) => {
      const path = `$.analyses[${i}]`;
      const analysis = record(entry, path);
      fields(analysis, ["result", "parents"], [], path);
      unique(
        results,
        JSON.stringify(
          referenceKey(reference(analysis.result, `${path}.result`)),
        ),
        `${path}.result`,
      );
      const localParents = new Set<string | number>();
      array(
        analysis.parents,
        `${path}.parents`,
        INPUT_LIMITS.maxParents,
        1,
      ).forEach((item, j) => {
        const parentPath = `${path}.parents[${j}]`;
        const key = contextKey(context(item, parentPath));
        if (!parents.has(key))
          fail(
            parentPath,
            "Analysis refers to an undeclared molecular context.",
          );
        unique(localParents, key, parentPath);
      });
    },
  );
  return value as unknown as InteractionDocument;
}
