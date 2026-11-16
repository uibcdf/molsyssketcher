import { DocumentController } from "./controller.js";
import type { ControllerOptions } from "./controller.js";
import { SketcherError } from "./diagnostics.js";
import { prepareSuppliedMolecule, sameMolecularContext } from "./documents.js";
import { prepareInteractionPage } from "./interaction-page.js";
import type { InteractionPage } from "./interaction-page.js";
import { buildInteractionTopology } from "./interaction-topology.js";
import type { InteractionPresentationGroup } from "./interaction-topology.js";
import { snapshotJson } from "./json.js";
import type { PreparedMolecule } from "./types.js";

export interface InteractionDiagramParent {
  readonly parentIndex: number;
  readonly label: string;
  readonly molecule: PreparedMolecule;
}
export type InteractionComposition =
  | { readonly mode: "ligand-centered"; readonly focusParentIndex: number }
  | {
      readonly mode: "interface-centered";
      readonly left: readonly number[];
      readonly right: readonly number[];
      readonly mediators: readonly number[];
    };
/** One atomically supplied visual bundle; scientific results remain owner-native. */
export interface InteractionDiagram {
  readonly schemaVersion: 1;
  readonly kind: "interaction-diagram";
  readonly id: string;
  readonly page: InteractionPage;
  readonly parents: readonly InteractionDiagramParent[];
  readonly composition: InteractionComposition;
  readonly groups: readonly InteractionPresentationGroup[];
}
export const INTERACTION_DIAGRAM_LIMITS = Object.freeze({
  maxParents: 8,
  maxAtoms: 128,
  maxObservations: 8,
  maxParticipants: 48,
});

function fail(message: string): never {
  throw new SketcherError("invalid-input", message);
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Expected a supplied diagram object.");
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
    fail("Unsupported supplied diagram fields.");
}
function index(value: unknown, n: number): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 0 ||
    (value as number) >= n
  )
    return fail("Unknown diagram parent index.");
  return value as number;
}

export function prepareInteractionDiagram(input: unknown): InteractionDiagram {
  const owned = snapshotJson(input),
    root = object(owned);
  keys(root, [
    "schemaVersion",
    "kind",
    "id",
    "page",
    "parents",
    "composition",
    "groups",
  ]);
  if (root.schemaVersion !== 1 || root.kind !== "interaction-diagram")
    throw new SketcherError(
      "unsupported-schema",
      "Unsupported interaction diagram schema.",
    );
  if (typeof root.id !== "string" || !root.id.trim() || root.id.length > 256)
    fail("Invalid diagram identity.");
  const page = prepareInteractionPage(root.page),
    count = page.document.parents.length;
  if (
    count > INTERACTION_DIAGRAM_LIMITS.maxParents ||
    !Array.isArray(root.parents) ||
    root.parents.length !== count
  )
    fail("Supply every exact diagram parent once.");
  const seen = new Set<number>();
  let atoms = 0;
  for (const value of root.parents) {
    const parent = object(value);
    keys(parent, ["parentIndex", "label", "molecule"]);
    const i = index(parent.parentIndex, count);
    if (
      seen.has(i) ||
      typeof parent.label !== "string" ||
      !parent.label.trim() ||
      parent.label.length > 128
    )
      fail("Ambiguous or unsupported diagram parent label.");
    seen.add(i);
    const molecule = prepareSuppliedMolecule(parent.molecule);
    if (!sameMolecularContext(molecule.context, page.document.parents[i]!))
      fail("Prepared parent and native analysis contexts differ.");
    const binding = page.correspondence.atoms.filter(
      (a) => a.parentIndex === i,
    );
    if (
      binding.length !== molecule.atoms.length ||
      binding.some((b) => !molecule.atoms.some((a) => a.id === b.atomId))
    )
      fail("Every depicted parent atom needs its exact native binding.");
    atoms += molecule.atoms.length;
  }
  const composition = object(root.composition);
  if (composition.mode !== page.document.mode)
    fail("Diagram mode and reference document differ.");
  if (composition.mode === "ligand-centered") {
    keys(composition, ["mode", "focusParentIndex"]);
    index(composition.focusParentIndex, count);
  } else if (composition.mode === "interface-centered") {
    keys(composition, ["mode", "left", "right", "mediators"]);
    const partition: number[] = [];
    for (const side of ["left", "right", "mediators"]) {
      const rows = composition[side];
      if (!Array.isArray(rows) || (side !== "mediators" && rows.length === 0))
        fail("Declare nonempty interface sides and explicit mediators.");
      for (const row of rows) partition.push(index(row, count));
    }
    if (partition.length !== count || new Set(partition).size !== count)
      fail("Interface sides/mediators must partition every parent exactly.");
  } else fail("Unknown interaction composition mode.");
  const topology = buildInteractionTopology(page, {
    instanceId: "diagram-validation",
    generation: 1,
    groups: root.groups as unknown as readonly InteractionPresentationGroup[],
  });
  const participants = topology.observations.reduce(
    (sum, o) => sum + o.participants.length,
    0,
  );
  if (
    atoms > INTERACTION_DIAGRAM_LIMITS.maxAtoms ||
    topology.observations.length > INTERACTION_DIAGRAM_LIMITS.maxObservations ||
    participants > INTERACTION_DIAGRAM_LIMITS.maxParticipants
  )
    throw new SketcherError(
      "input-limit",
      "This first diagram exceeds its finite drawing budget; query a smaller native page explicitly.",
    );
  return owned as unknown as InteractionDiagram;
}

export function createInteractionDiagramController(
  options: ControllerOptions,
): DocumentController<InteractionDiagram> {
  return new DocumentController(options, prepareInteractionDiagram);
}
