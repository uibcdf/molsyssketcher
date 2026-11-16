import { SketcherError } from "./diagnostics.js";
import { inspectInteractionPage } from "./interaction-page.js";
import type {
  InteractionAtomBinding,
  InteractionPage,
} from "./interaction-page.js";
import { snapshotJson } from "./json.js";
import type { MolecularContext, ResourceReference } from "./types.js";

/** Local to one exact analysis and queried frame, never a global identity. */
export interface InteractionParticipantKey {
  readonly occurrenceIndex: number;
  /** Position in the relation's ordered participants, not compact catalog row. */
  readonly participantIndex: number;
}
export interface InteractionPresentationGroup {
  readonly id: string;
  readonly label: string;
  readonly members: readonly InteractionParticipantKey[];
}
export interface InteractionTopologyOptions {
  readonly instanceId: string;
  readonly generation: number;
  /** Explicit whole-participant grouping; unlisted participants stay separate. */
  readonly groups?: readonly InteractionPresentationGroup[];
}
export interface InteractionMembership extends InteractionParticipantKey {
  readonly relationIndex: number;
  readonly role: string;
  readonly atoms: readonly InteractionAtomBinding[];
  /** Native participant lattice vector; no physical reconstruction is implied. */
  readonly image: readonly number[] | null;
}
export interface InteractionTopologyNode {
  readonly id: string;
  readonly groupId: string | null;
  readonly label: string | null;
  readonly memberships: readonly InteractionMembership[];
}
export interface InteractionTopologyObservation {
  readonly id: string;
  readonly occurrenceIndex: number;
  readonly relationIndex: number;
  readonly interactionType: string;
  readonly evidence: string;
  /** Ordered incidences of a hyperedge; repeated node IDs/atoms retain roles. */
  readonly participants: readonly (InteractionMembership & {
    readonly nodeId: string;
  })[];
}
export interface InteractionTopology {
  readonly schemaVersion: 1;
  readonly kind: "interaction-topology";
  readonly instanceId: string;
  readonly generation: number;
  readonly projection: InteractionPage;
  readonly coverage: ReturnType<typeof inspectInteractionPage>["coverage"];
  readonly partial: boolean;
  readonly groups: readonly InteractionPresentationGroup[];
  readonly nodes: readonly InteractionTopologyNode[];
  readonly observations: readonly InteractionTopologyObservation[];
}
export interface InteractionTopologyPick {
  readonly kind: "participant-group" | "observation";
  readonly visualId: string;
  readonly instanceId: string;
  readonly generation: number;
  readonly analysis: ResourceReference;
  readonly parents: readonly MolecularContext[];
  readonly structureIndex: number;
  readonly memberships: readonly InteractionMembership[];
}

function fail(): never {
  throw new SketcherError(
    "invalid-input",
    "Invalid interaction presentation grouping or identity.",
  );
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail();
  return value as Record<string, unknown>;
}
function exact(
  value: Record<string, unknown>,
  fields: readonly string[],
): void {
  if (
    Object.keys(value).length !== fields.length ||
    fields.some((f) => !(f in value))
  )
    fail();
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 256)
    return fail();
  return value;
}
function index(value: unknown, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum)
    return fail();
  return value as number;
}
function participantKey(value: unknown): InteractionParticipantKey {
  const key = object(value);
  exact(key, ["occurrenceIndex", "participantIndex"]);
  return Object.freeze({
    occurrenceIndex: index(key.occurrenceIndex),
    participantIndex: index(key.participantIndex),
  });
}
const keyOf = (key: InteractionParticipantKey) =>
  JSON.stringify([key.occurrenceIndex, key.participantIndex]);

/** Build presentation membership only. No layout, detector, inferred grouping or pair flattening. */
export function buildInteractionTopology(
  input: unknown,
  options: InteractionTopologyOptions,
): InteractionTopology {
  const inspection = inspectInteractionPage(input);
  const projection = inspection.projection,
    page = projection.native.page;
  const owned = object(snapshotJson(options));
  exact(
    owned,
    "groups" in owned
      ? ["instanceId", "generation", "groups"]
      : ["instanceId", "generation"],
  );
  const instanceId = text(owned.instanceId),
    generation = index(owned.generation, 1);
  const scope = [
    instanceId,
    generation,
    projection.analysis.owner,
    projection.analysis.id,
    projection.analysis.generation,
    projection.structureIndex,
  ];
  const visualId = (...suffix: readonly (string | number)[]) =>
    JSON.stringify([...scope, ...suffix]);
  const memberships = new Map<string, InteractionMembership>();
  inspection.observations.forEach((observation, row) => {
    observation.participants.forEach((participant, participantIndex) => {
      const key = {
        occurrenceIndex: observation.occurrenceIndex,
        participantIndex,
      };
      memberships.set(
        keyOf(key),
        Object.freeze({
          ...key,
          relationIndex: observation.relationIndex,
          role: participant.role,
          atoms: participant.atoms,
          image:
            page.image_vectors === null
              ? null
              : page.image_vectors[
                  page.image_offsets![row]! + participantIndex
                ]!,
        }),
      );
    });
  });
  const declared = "groups" in owned ? owned.groups : [];
  if (!Array.isArray(declared) || declared.length > 2048) fail();
  const assigned = new Map<string, string>(),
    groupIds = new Set<string>();
  const nodes: InteractionTopologyNode[] = [];
  let memberCount = 0;
  const groups = declared.map((value) => {
    const group = object(value);
    exact(group, ["id", "label", "members"]);
    const id = text(group.id),
      label = text(group.label);
    if (
      groupIds.has(id) ||
      !Array.isArray(group.members) ||
      group.members.length === 0 ||
      (memberCount += group.members.length) > 2048
    )
      fail();
    groupIds.add(id);
    const members = group.members.map(participantKey);
    const nodeId = visualId("group", id);
    const selected = members.map((key) => {
      const identity = keyOf(key),
        membership = memberships.get(identity);
      if (!membership || assigned.has(identity)) return fail();
      assigned.set(identity, nodeId);
      return membership;
    });
    nodes.push(
      Object.freeze({
        id: nodeId,
        groupId: id,
        label,
        memberships: Object.freeze(selected),
      }),
    );
    return Object.freeze({ id, label, members: Object.freeze(members) });
  });
  for (const [key, member] of memberships) {
    if (assigned.has(key)) continue;
    const id = visualId(
      "participant",
      member.occurrenceIndex,
      member.participantIndex,
    );
    assigned.set(key, id);
    nodes.push(
      Object.freeze({
        id,
        groupId: null,
        label: null,
        memberships: Object.freeze([member]),
      }),
    );
  }
  const observations = inspection.observations.map((observation) =>
    Object.freeze({
      id: visualId("observation", observation.occurrenceIndex),
      occurrenceIndex: observation.occurrenceIndex,
      relationIndex: observation.relationIndex,
      interactionType: observation.interactionType,
      evidence: observation.evidence,
      participants: Object.freeze(
        observation.participants.map((_, participantIndex) => {
          const key = keyOf({
            occurrenceIndex: observation.occurrenceIndex,
            participantIndex,
          });
          return Object.freeze({
            ...memberships.get(key)!,
            nodeId: assigned.get(key)!,
          });
        }),
      ),
    }),
  );
  return Object.freeze({
    schemaVersion: 1,
    kind: "interaction-topology",
    instanceId,
    generation,
    projection,
    coverage: inspection.coverage,
    partial: inspection.partial,
    groups: Object.freeze(groups),
    nodes: Object.freeze(nodes),
    observations: Object.freeze(observations),
  });
}

/** Find a whole native participant in this topology's explicitly scoped mapping. */
export function findInteractionParticipantNode(
  topology: InteractionTopology,
  key: InteractionParticipantKey,
): InteractionTopologyNode | null {
  const accepted = participantKey(snapshotJson(key));
  return (
    topology.nodes.find((node) =>
      node.memberships.some((member) => keyOf(member) === keyOf(accepted)),
    ) ?? null
  );
}

/** Reverse visual membership, returning exact native source context and roles. */
export function inspectInteractionTopology(
  topology: InteractionTopology,
  visualId: string,
): InteractionTopologyPick | null {
  if (typeof visualId !== "string") return fail();
  const node = topology.nodes.find((candidate) => candidate.id === visualId);
  const observation = topology.observations.find(
    (candidate) => candidate.id === visualId,
  );
  if (!node && !observation) return null;
  return Object.freeze({
    kind: node ? "participant-group" : "observation",
    visualId,
    instanceId: topology.instanceId,
    generation: topology.generation,
    analysis: topology.projection.analysis,
    parents: topology.projection.document.parents,
    structureIndex: topology.projection.structureIndex,
    memberships: node?.memberships ?? observation!.participants,
  });
}
