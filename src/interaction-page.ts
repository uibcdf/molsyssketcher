import { DocumentController } from "./controller.js";
import type { ControllerOptions } from "./controller.js";
import { SketcherError } from "./diagnostics.js";
import {
  prepareSuppliedInteractionDocument,
  sameMolecularContext,
} from "./documents.js";
import { snapshotJson } from "./json.js";
import type {
  InteractionDocument,
  JsonValue,
  ResourceReference,
} from "./types.js";

export interface InteractionAtomBinding {
  readonly index: number;
  readonly sourceIndex: number;
  readonly parentIndex: number;
  readonly atomId: string;
}
export interface NativeInteractionPage {
  readonly schema: "molsysmt.interactions.page@1";
  readonly n_atoms: number;
  readonly n_structures: number;
  readonly source_n_atoms: number;
  readonly source_n_structures: number;
  readonly source_id: string | null;
  readonly software: Readonly<Record<string, string>>;
  readonly method: string;
  readonly parameters: JsonValue;
  readonly execution_records: readonly JsonValue[];
  readonly evaluated_structure_indices: readonly number[];
  readonly atom_source_indices: readonly number[];
  readonly structure_source_indices: readonly number[];
  readonly occurrence_indices: readonly number[];
  readonly structure_indices: readonly number[];
  readonly relation_indices: readonly number[];
  readonly evidence: readonly string[];
  readonly measurements: Readonly<Record<string, readonly number[]>>;
  readonly measure_units: Readonly<Record<string, string>>;
  readonly image_offsets: readonly number[] | null;
  readonly image_vectors: readonly (readonly number[])[] | null;
  readonly relation_catalog_indices: readonly number[];
  readonly relation_types: readonly string[];
  readonly relation_participant_offsets: readonly number[];
  readonly participant_roles: readonly string[];
  readonly participant_atom_offsets: readonly number[];
  readonly participant_atoms: readonly number[];
  readonly total_count: number;
  readonly offset: number;
  readonly limit: number;
  readonly next_offset: number | null;
}
/** Inspection envelope around an unchanged owner-native page, not persistence. */
export interface InteractionPage {
  readonly schemaVersion: 1;
  readonly kind: "interaction-page";
  readonly document: InteractionDocument;
  readonly analysis: ResourceReference;
  readonly structureIndex: number;
  readonly correspondence: {
    readonly authority: "caller-declared@1";
    readonly atoms: readonly InteractionAtomBinding[];
    readonly frames: readonly {
      readonly parentIndex: number;
      readonly index: number;
      readonly sourceIndex: number;
      readonly structure: string;
    }[];
  };
  readonly native: {
    readonly page: NativeInteractionPage;
    readonly evaluationScope: JsonValue;
    readonly quantityRecords: Readonly<Record<string, JsonValue>>;
  };
  readonly reader: {
    readonly name: "MolSysMT";
    readonly version: string;
    readonly quantityVerification: "python-only";
  };
}

const fail = (message: string): never => {
  throw new SketcherError("invalid-input", message);
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Expected an interaction-page object.");
  return value as Record<string, unknown>;
}
function keys(
  value: Record<string, unknown>,
  expected: readonly string[],
): void {
  if (
    Object.keys(value).length !== expected.length ||
    expected.some((k) => !(k in value))
  )
    fail("Unsupported interaction-page fields.");
}
function number(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  )
    return fail("Invalid interaction index or extent.");
  return value as number;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 4096)
    return fail("Invalid native interaction label.");
  return value;
}
function array(value: unknown, max = 4096): readonly unknown[] {
  if (!Array.isArray(value) || value.length > max)
    return fail("Interaction array exceeds the admitted extent.");
  return value;
}
function indices(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): readonly number[] {
  return array(value).map((v) => number(v, min, max));
}
function unique(values: readonly unknown[]): void {
  if (new Set(values).size !== values.length)
    fail("Duplicate native interaction identities.");
}
function offsets(value: unknown, size: number, end: number): readonly number[] {
  const values = indices(value);
  if (
    values.length !== size + 1 ||
    values[0] !== 0 ||
    values.at(-1) !== end ||
    values.some((v, i) => i > 0 && v < values[i - 1]!)
  )
    fail("Invalid native participant/image offsets.");
  return values;
}
const referenceKey = (value: ResourceReference) =>
  JSON.stringify([value.owner, value.id, value.generation]);

export function prepareInteractionPage(input: unknown): InteractionPage {
  const owned = snapshotJson(input),
    root = object(owned);
  keys(root, [
    "schemaVersion",
    "kind",
    "document",
    "analysis",
    "structureIndex",
    "correspondence",
    "native",
    "reader",
  ]);
  if (root.schemaVersion !== 1 || root.kind !== "interaction-page")
    throw new SketcherError(
      "unsupported-schema",
      "Unsupported interaction inspection envelope.",
    );
  const document = prepareSuppliedInteractionDocument(root.document);
  const analysis = object(root.analysis);
  keys(analysis, ["owner", "id", "generation"]);
  Object.values(analysis).forEach(text);
  const dependency = document.analyses.find(
    (a) =>
      referenceKey(a.result) ===
      referenceKey(analysis as unknown as ResourceReference),
  );
  if (
    !dependency ||
    dependency.parents.length !== document.parents.length ||
    dependency.parents.some(
      (parent, index) =>
        !sameMolecularContext(parent, document.parents[index]!),
    )
  )
    fail("The page analysis does not bind every exact parent context.");
  if (document.parents.length > 8)
    fail("The first interaction page admits at most eight parents.");
  const native = object(root.native);
  keys(native, ["page", "evaluationScope", "quantityRecords"]);
  const page = object(native.page);
  keys(page, [
    "schema",
    "n_atoms",
    "n_structures",
    "source_n_atoms",
    "source_n_structures",
    "source_id",
    "software",
    "method",
    "parameters",
    "execution_records",
    "evaluated_structure_indices",
    "atom_source_indices",
    "structure_source_indices",
    "occurrence_indices",
    "structure_indices",
    "relation_indices",
    "evidence",
    "measurements",
    "measure_units",
    "image_offsets",
    "image_vectors",
    "relation_catalog_indices",
    "relation_types",
    "relation_participant_offsets",
    "participant_roles",
    "participant_atom_offsets",
    "participant_atoms",
    "total_count",
    "offset",
    "limit",
    "next_offset",
  ]);
  if (page.schema !== "molsysmt.interactions.page@1")
    throw new SketcherError(
      "unsupported-schema",
      "Unsupported native interaction page schema.",
    );
  const nAtoms = number(page.n_atoms, 1, 4096),
    nFrames = number(page.n_structures, 1, 4096);
  const sourceAtoms = number(page.source_n_atoms, 1),
    sourceFrames = number(page.source_n_structures, 1);
  const frame = number(root.structureIndex, 0, nFrames - 1);
  const atomMap = indices(page.atom_source_indices, -1, sourceAtoms - 1),
    frameMap = indices(page.structure_source_indices, -1, sourceFrames - 1);
  if (atomMap.length !== nAtoms || frameMap.length !== nFrames)
    fail("Native source-map dimensions differ.");
  if (page.source_id !== null) text(page.source_id);
  text(page.method);
  Object.values(object(page.software)).forEach(text);
  object(page.parameters);
  const scope = object(native.evaluationScope);
  keys(scope, ["mode", "atom_indices", "atom_indices_b", "universe_indices"]);
  if (
    typeof scope.mode !== "string" ||
    !["internal", "incident", "between"].includes(scope.mode)
  )
    fail("Unknown native evaluation scope.");
  for (const name of ["atom_indices", "atom_indices_b", "universe_indices"]) {
    if (scope[name] !== null) {
      const rows = indices(scope[name], 0, nAtoms - 1);
      unique(rows);
    }
  }
  array(page.execution_records).forEach((record) => {
    const r = object(record);
    keys(r, ["structure_indices", "details"]);
    indices(r.structure_indices, 0, nFrames - 1);
    object(r.details);
  });
  const coverage = indices(page.evaluated_structure_indices, 0, nFrames - 1);
  unique(coverage);
  if (coverage.some((f) => f !== frame))
    fail("The first profile receives exactly one queried frame.");
  const occurrences = indices(page.occurrence_indices),
    structures = indices(page.structure_indices, 0, nFrames - 1),
    relations = indices(page.relation_indices);
  unique(occurrences);
  const count = occurrences.length,
    total = number(page.total_count),
    offset = number(page.offset),
    limit = number(page.limit, 0, 256);
  if (
    count > limit ||
    count > 256 ||
    count !== Math.min(limit, Math.max(0, total - offset)) ||
    structures.length !== count ||
    relations.length !== count ||
    structures.some((f) => f !== frame)
  )
    fail("Native occurrence columns or pagination disagree.");
  const next = count > 0 && offset + count < total ? offset + count : null;
  if (page.next_offset !== next) fail("Native next-page offset disagrees.");
  if (!coverage.includes(frame) && (count !== 0 || total !== 0))
    fail("Unevaluated scope contains observations.");
  if (array(page.evidence).length !== count)
    fail("Native evidence is unaligned.");
  array(page.evidence).forEach(text);
  const catalog = indices(page.relation_catalog_indices);
  unique(catalog);
  const types = array(page.relation_types);
  types.forEach(text);
  if (
    types.length !== catalog.length ||
    relations.some((r) => !catalog.includes(r))
  )
    fail("Native relation catalog correspondence differs.");
  const roles = array(page.participant_roles);
  roles.forEach(text);
  const atoms = indices(page.participant_atoms, 0, nAtoms - 1);
  const relationOffsets = offsets(
    page.relation_participant_offsets,
    catalog.length,
    roles.length,
  );
  const atomOffsets = offsets(
    page.participant_atom_offsets,
    roles.length,
    atoms.length,
  );
  if (
    relationOffsets.some((v, i) => i > 0 && v === relationOffsets[i - 1]) ||
    atomOffsets.some((v, i) => i > 0 && v === atomOffsets[i - 1])
  )
    fail("Empty native participant definitions are not admitted.");
  let memberships = 0;
  for (const relation of relations) {
    const i = catalog.indexOf(relation);
    memberships +=
      atomOffsets[relationOffsets[i + 1]!]! - atomOffsets[relationOffsets[i]!]!;
  }
  if (memberships > 2048)
    fail("Native participant membership exceeds the page budget.");
  if (page.image_offsets === null || page.image_vectors === null) {
    if (page.image_offsets !== null || page.image_vectors !== null)
      fail("Partial PBC image columns.");
  } else {
    const vectors = array(page.image_vectors);
    vectors.forEach((v) => {
      const xyz = indices(v, -2147483648, 2147483647);
      if (xyz.length !== 3) fail("Invalid PBC vector.");
    });
    const images = offsets(page.image_offsets, count, vectors.length);
    relations.forEach((r, row) => {
      const i = catalog.indexOf(r);
      if (
        images[row + 1]! - images[row]! !==
        relationOffsets[i + 1]! - relationOffsets[i]!
      )
        fail("PBC participant images are unaligned.");
    });
  }
  const measurements = object(page.measurements),
    units = object(page.measure_units),
    records = object(native.quantityRecords);
  if (
    JSON.stringify(Object.keys(measurements).sort()) !==
      JSON.stringify(Object.keys(units).sort()) ||
    JSON.stringify(Object.keys(units).sort()) !==
      JSON.stringify(Object.keys(records).sort())
  )
    fail("Native quantities lack explicit units or retained records.");
  for (const name of Object.keys(measurements)) {
    const values = array(measurements[name]);
    if (
      values.length !== count ||
      values.some((v) => typeof v !== "number" || !Number.isFinite(v))
    )
      fail("Invalid native quantity values.");
    text(units[name]);
    const record = object(records[name]),
      manifest = object(record.manifest);
    if (manifest.format !== "qrec/0.3" || manifest.field !== name)
      fail("Wrong retained quantity-record field or format.");
    // Opaque retention only: the Python adapter owns seal/unit handshakes. No
    // browser decoder, unit conversion or independent seal verification is claimed.
  }
  const binding = object(root.correspondence);
  keys(binding, ["authority", "atoms", "frames"]);
  if (binding.authority !== "caller-declared@1")
    fail("Explicit caller correspondence authority is required.");
  const bindings = array(binding.atoms),
    seen: number[] = [],
    semantic: string[] = [];
  bindings.forEach((value) => {
    const b = object(value);
    keys(b, ["index", "sourceIndex", "parentIndex", "atomId"]);
    const index = number(b.index, 0, nAtoms - 1),
      parent = number(b.parentIndex, 0, document.parents.length - 1);
    if (number(b.sourceIndex) !== atomMap[index])
      fail("Declared native atom source correspondence differs.");
    seen.push(index);
    semantic.push(JSON.stringify([parent, text(b.atomId)]));
  });
  unique(seen);
  unique(semantic);
  if (atoms.some((a) => !seen.includes(a)))
    fail("An observed constituent atom has no exact parent binding.");
  const frames = array(binding.frames, 8),
    parents: number[] = [];
  frames.forEach((value) => {
    const f = object(value);
    keys(f, ["parentIndex", "index", "sourceIndex", "structure"]);
    const parent = number(f.parentIndex, 0, document.parents.length - 1);
    parents.push(parent);
    if (
      f.index !== frame ||
      number(f.sourceIndex) !== frameMap[frame] ||
      f.structure !== document.parents[parent]!.structure
    )
      fail("Declared native frame/parent context differs.");
  });
  unique(parents);
  if (parents.length !== document.parents.length)
    fail("Every parent needs an explicit frame binding.");
  const reader = object(root.reader);
  keys(reader, ["name", "version", "quantityVerification"]);
  if (
    reader.name !== "MolSysMT" ||
    reader.quantityVerification !== "python-only"
  )
    fail("Unsupported native reader verification profile.");
  text(reader.version);
  return owned as unknown as InteractionPage;
}

export function inspectInteractionPage(input: unknown) {
  const projection = prepareInteractionPage(input),
    page = projection.native.page;
  const observations = page.occurrence_indices.map((occurrence, row) => {
    const relation = page.relation_indices[row]!,
      catalog = page.relation_catalog_indices.indexOf(relation);
    const participants = [];
    for (
      let p = page.relation_participant_offsets[catalog]!;
      p < page.relation_participant_offsets[catalog + 1]!;
      p++
    ) {
      const atoms = page.participant_atoms.slice(
        page.participant_atom_offsets[p],
        page.participant_atom_offsets[p + 1],
      );
      participants.push(
        Object.freeze({
          role: page.participant_roles[p]!,
          atoms: Object.freeze(
            atoms.map(
              (index) =>
                projection.correspondence.atoms.find((a) => a.index === index)!,
            ),
          ),
        }),
      );
    }
    return Object.freeze({
      analysis: projection.analysis,
      occurrenceIndex: occurrence,
      relationIndex: relation,
      structureIndex: projection.structureIndex,
      interactionType: page.relation_types[catalog]!,
      evidence: page.evidence[row]!,
      participants: Object.freeze(participants),
      quantityFields: Object.freeze(
        Object.keys(projection.native.quantityRecords),
      ),
    });
  });
  return Object.freeze({
    projection,
    observations: Object.freeze(observations),
    coverage: page.evaluated_structure_indices.includes(
      projection.structureIndex,
    )
      ? page.total_count === 0
        ? "evaluated-empty"
        : "evaluated"
      : "unevaluated",
    partial:
      page.offset > 0 || page.occurrence_indices.length < page.total_count,
    quantities: "opaque" as const,
  });
}

export function createInteractionPageController(
  options: ControllerOptions,
): DocumentController<InteractionPage> {
  return new DocumentController(options, prepareInteractionPage);
}
