import { SketcherError } from "./diagnostics.js";
import { prepareInteractionDiagram } from "./interaction-diagram.js";
import type { InteractionDiagram } from "./interaction-diagram.js";
import {
  buildInteractionTopology,
  inspectInteractionTopology,
} from "./interaction-topology.js";
import type {
  InteractionMembership,
  InteractionTopology,
  InteractionTopologyPick,
} from "./interaction-topology.js";
import {
  buildMolecularScene,
  hitTestMolecularScene,
  validateSceneOptions,
} from "./scene.js";
import type {
  MolecularScene,
  SceneOptions,
  ScenePick,
  TextMeasurer,
  Theme,
} from "./scene.js";
import {
  distanceToSegment,
  expandRect,
  transformPoint,
  unionRects,
  validateViewportTransform,
} from "./geometry.js";
import type { AffineTransform, Point, Rect } from "./geometry.js";
import { snapshotJson } from "./json.js";

export interface DiagramText {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly box: Rect;
}
export interface DiagramFragment {
  readonly parentIndex: number;
  readonly scene: MolecularScene;
  readonly offset: Point;
  readonly box: Rect;
  readonly title: DiagramText;
}
export interface DiagramIncidence {
  readonly id: string;
  readonly observationId: string;
  readonly nodeId: string;
  readonly member: InteractionMembership;
  readonly atoms: readonly Point[];
  readonly anchor: Point;
  readonly route: readonly Point[];
  readonly label: DiagramText;
  readonly row: Rect;
}
export interface DiagramObservation {
  readonly id: string;
  readonly occurrenceIndex: number;
  readonly box: Rect;
  readonly title: DiagramText;
  readonly known: boolean;
}
export interface DiagramGroup {
  readonly id: string;
  readonly box: Rect;
  readonly title: DiagramText;
}
export interface InteractionDiagramScene {
  readonly schemaVersion: 1;
  readonly kind: "interaction-diagram-scene";
  readonly instanceId: string;
  readonly generation: number;
  readonly theme: Theme;
  readonly document: InteractionDiagram;
  readonly topology: InteractionTopology;
  readonly fragments: readonly DiagramFragment[];
  readonly incidences: readonly DiagramIncidence[];
  readonly observations: readonly DiagramObservation[];
  readonly groups: readonly DiagramGroup[];
  readonly header: readonly DiagramText[];
  readonly bounds: Rect;
  readonly layout: "fixed-fragments-lanes@1";
}
export type InteractionDiagramPick =
  | {
      readonly kind: "molecular";
      readonly sceneGeneration: number;
      readonly parentIndex: number;
      readonly molecular: ScenePick;
      readonly context: InteractionTopologyPick["parents"];
      readonly memberships: readonly InteractionMembership[];
    }
  | {
      readonly kind: "participant" | "observation" | "group";
      readonly sceneGeneration: number;
      readonly visualId: string;
      readonly native: InteractionTopologyPick;
      readonly member: InteractionMembership | null;
    };

const NAMES: Readonly<Record<string, string>> = {
  ionic_contact: "Ionic contact",
  pi_pi: "Pi–pi observation",
  hbond: "Hydrogen bond",
  water_bridge: "Water-mediated path",
};
function roleLabel(role: string): string {
  const leg = /^leg_(\d+)_(donor|hydrogen|acceptor)$/.exec(role);
  const labels: Record<string, string> = {
    donor: "Donor",
    hydrogen: "Hydrogen",
    acceptor: "Acceptor",
    ring_a: "Ring A",
    ring_b: "Ring B",
    positive: "Positive participant",
    negative: "Negative participant",
  };
  return leg
    ? `Leg ${leg[1]} · ${labels[leg[2]!]}`
    : Object.hasOwn(labels, role)
      ? labels[role]!
      : role;
}
const inside = (p: Point, r: Rect) =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
const centroid = (points: readonly Point[]): Point => ({
  x: points.reduce((s, p) => s + p.x, 0) / points.length,
  y: points.reduce((s, p) => s + p.y, 0) / points.length,
});

/** A bounded reproducible schematic. Fragment coordinates are translated only. */
export function buildInteractionDiagramScene(
  input: unknown,
  measure: TextMeasurer,
  options: SceneOptions,
): InteractionDiagramScene {
  const settings = snapshotJson(options) as unknown as SceneOptions;
  validateSceneOptions(settings);
  const document = prepareInteractionDiagram(input),
    theme = settings.theme ?? "light";
  const topology = buildInteractionTopology(document.page, {
    instanceId: settings.instanceId,
    generation: settings.generation,
    groups: document.groups,
  });
  function text(value: string, x: number, y: number, size = 14): DiagramText {
    const m = measure(value, size);
    if (
      ![m.x, m.y, m.width, m.height].every(Number.isFinite) ||
      m.width < 0 ||
      m.width > 4096 ||
      m.height <= 0 ||
      m.height > 256
    )
      throw new SketcherError(
        "invalid-input",
        "Unsupported diagram text metrics.",
      );
    return {
      text: value,
      x: x - m.x,
      y: y - m.y,
      fontSize: size,
      box: { x, y, width: m.width, height: m.height },
    };
  }
  const originals = document.parents.map((p) => {
    const scene = buildMolecularScene(p.molecule, measure, {
      ...settings,
      instanceId: `${settings.instanceId.slice(0, 220)}:parent:${p.parentIndex}`,
    });
    const title = text(p.label, 0, 0);
    return {
      parentIndex: p.parentIndex,
      scene,
      width: Math.max(150, scene.bounds.width + 32, title.box.width + 32),
      height: scene.bounds.height + title.box.height + 48,
      title,
    };
  });
  const fragments: DiagramFragment[] = [];
  function place(
    parent: number,
    x: number,
    y: number,
    fixed = false,
  ): DiagramFragment {
    const item = originals.find((f) => f.parentIndex === parent)!;
    const box = { x, y, width: item.width, height: item.height };
    const title = text(
      item.title.text,
      x + (box.width - item.title.box.width) / 2,
      y + 12,
    );
    const offset = fixed
      ? { x: 0, y: 0 }
      : {
          x:
            x + (box.width - item.scene.bounds.width) / 2 - item.scene.bounds.x,
          y: y + item.title.box.height + 32 - item.scene.bounds.y,
        };
    const fragment = {
      parentIndex: parent,
      scene: item.scene,
      box,
      title,
      offset,
    };
    fragments.push(fragment);
    return fragment;
  }
  const composition = document.composition;
  const lanes: number[][] =
    composition.mode === "interface-centered"
      ? [
          Array.from(composition.left),
          Array.from(composition.mediators),
          Array.from(composition.right),
        ]
      : [[], [composition.focusParentIndex], []];
  if (composition.mode === "ligand-centered")
    document.parents
      .filter((p) => p.parentIndex !== composition.focusParentIndex)
      .forEach((p, i) => lanes[i % 2 === 0 ? 2 : 0]!.push(p.parentIndex));
  const widths = lanes.map((rows) =>
    Math.max(
      150,
      ...rows.map((i) => originals.find((f) => f.parentIndex === i)!.width),
    ),
  );
  let xs = [-widths[0]! - 100, 0, widths[1]! + 100];
  let centerY = 0;
  if (composition.mode === "ligand-centered") {
    const focus = originals.find(
      (f) => f.parentIndex === composition.focusParentIndex,
    )!;
    const x =
        focus.scene.bounds.x - (focus.width - focus.scene.bounds.width) / 2,
      y = focus.scene.bounds.y - focus.title.box.height - 32;
    const fixed = place(composition.focusParentIndex, x, y, true);
    centerY = fixed.box.y + fixed.box.height / 2;
    xs = [x - 100 - widths[0]!, x, x + focus.width + 100];
  }
  lanes.forEach((rows, lane) => {
    if (composition.mode === "ligand-centered" && lane === 1) return;
    const height =
      rows.reduce(
        (sum, i) => sum + originals.find((f) => f.parentIndex === i)!.height,
        0,
      ) +
      Math.max(0, rows.length - 1) * 40;
    let y = centerY - height / 2;
    for (const i of rows) {
      const item = originals.find((f) => f.parentIndex === i)!;
      place(i, xs[lane]! + (widths[lane]! - item.width) / 2, y);
      y += item.height + 40;
    }
  });
  fragments.sort((a, b) => a.parentIndex - b.parentIndex);
  const parentBounds = unionRects(fragments.map((f) => f.box));
  const railY = parentBounds.y + parentBounds.height + 100;
  const sizes = topology.observations.map((o) => {
    const title = text(
      `${Object.hasOwn(NAMES, o.interactionType) ? NAMES[o.interactionType] : "Unknown interaction"} · ${o.occurrenceIndex}`,
      0,
      0,
    );
    const labels = o.participants.map((m) =>
      text(
        `${roleLabel(m.role)} · ${m.atoms.length} ${m.atoms.length === 1 ? "atom" : "atoms"}`,
        0,
        0,
        12,
      ),
    );
    return {
      title,
      labels,
      width: Math.max(
        190,
        title.box.width + 32,
        ...labels.map((l) => l.box.width + 40),
      ),
      height: 44 + o.participants.length * 24,
    };
  });
  const totalWidth =
    sizes.reduce((s, v) => s + v.width, 0) + Math.max(0, sizes.length - 1) * 48;
  let railX = parentBounds.x + (parentBounds.width - totalWidth) / 2;
  const observations: DiagramObservation[] = [],
    incidences: DiagramIncidence[] = [];
  topology.observations.forEach((observation, i) => {
    const s = sizes[i]!,
      box = { x: railX, y: railY, width: s.width, height: s.height };
    observations.push({
      id: observation.id,
      occurrenceIndex: observation.occurrenceIndex,
      box,
      title: text(s.title.text, railX + 16, railY + 12),
      known: Object.hasOwn(NAMES, observation.interactionType),
    });
    observation.participants.forEach((member, j) => {
      const atoms = member.atoms.map((binding) => {
        const f = fragments.find((f) => f.parentIndex === binding.parentIndex)!,
          a = f.scene.atoms.find((a) => a.semanticId === binding.atomId)!;
        return { x: a.position.x + f.offset.x, y: a.position.y + f.offset.y };
      });
      const anchor = centroid(atoms),
        row = {
          x: railX + 4,
          y: railY + 38 + j * 24,
          width: box.width - 8,
          height: 24,
        };
      const start = { x: railX + 12, y: row.y + 12 },
        elbow = railX - 18 - j * 4;
      incidences.push({
        id: `${observation.id}:participant:${member.participantIndex}`,
        observationId: observation.id,
        nodeId: member.nodeId,
        member,
        atoms,
        anchor,
        row,
        label: text(s.labels[j]!.text, railX + 25, row.y + 5, 12),
        route: [
          start,
          { x: elbow, y: start.y },
          { x: elbow, y: railY - 20 - j * 5 },
          { x: anchor.x, y: railY - 20 - j * 5 },
          anchor,
        ],
      });
    });
    railX += s.width + 48;
  });
  const groups: DiagramGroup[] = [];
  const groupY =
    Math.max(railY, ...observations.map((o) => o.box.y + o.box.height)) + 36;
  let groupX = parentBounds.x;
  for (const node of topology.nodes.filter((n) => n.groupId !== null)) {
    const label = `${node.label} · ${node.memberships.length} roles`,
      m = text(label, 0, 0, 12),
      box = { x: groupX, y: groupY, width: m.box.width + 28, height: 36 };
    groups.push({
      id: node.id,
      box,
      title: text(label, groupX + 14, groupY + 10, 12),
    });
    groupX += box.width + 16;
  }
  const coverage =
    topology.coverage === "evaluated-empty"
      ? "evaluated, no observations"
      : topology.coverage === "unevaluated"
        ? "not evaluated"
        : "evaluated";
  const heading =
    composition.mode === "ligand-centered"
      ? "Ligand-centered diagram"
      : "Interface-centered diagram";
  const header = [
    text(
      `${heading} · frame ${document.page.structureIndex} · ${coverage}${topology.partial ? " · partial page" : ""}`,
      parentBounds.x,
      parentBounds.y - 70,
      16,
    ),
    text(
      "Schematic layout: connection lengths are not physical distances.",
      parentBounds.x,
      parentBounds.y - 42,
      12,
    ),
  ];
  const routeBounds = incidences.flatMap((r) =>
    r.route.map((p) => ({ x: p.x, y: p.y, width: 1, height: 1 })),
  );
  const bounds = expandRect(
    unionRects([
      ...fragments.map((f) => f.box),
      ...observations.map((o) => o.box),
      ...groups.map((g) => g.box),
      ...header.map((h) => h.box),
      ...routeBounds,
    ]),
    24,
  );
  if (bounds.width > 16384 || bounds.height > 16384)
    throw new SketcherError(
      "input-limit",
      "The diagram layout exceeds the finite canvas extent.",
    );
  return snapshotJson({
    schemaVersion: 1,
    kind: "interaction-diagram-scene",
    instanceId: settings.instanceId,
    generation: settings.generation,
    theme,
    document,
    topology,
    fragments,
    observations,
    incidences,
    groups,
    header,
    bounds,
    layout: "fixed-fragments-lanes@1",
  }) as unknown as InteractionDiagramScene;
}

export function inspectDiagramTarget(
  scene: InteractionDiagramScene,
  id: string,
): InteractionDiagramPick | null {
  const incidence = scene.incidences.find((i) => i.id === id);
  const kind = incidence
    ? "participant"
    : scene.observations.some((o) => o.id === id)
      ? "observation"
      : scene.groups.some((g) => g.id === id)
        ? "group"
        : null;
  if (!kind) return null;
  const native = inspectInteractionTopology(
    scene.topology,
    incidence?.nodeId ?? id,
  )!;
  return Object.freeze({
    kind,
    sceneGeneration: scene.generation,
    visualId: id,
    native,
    member: incidence?.member ?? null,
  });
}

export function hitTestInteractionDiagramScene(
  scene: InteractionDiagramScene,
  point: Point,
  transform: AffineTransform,
): InteractionDiagramPick | null {
  validateViewportTransform(transform);
  if (![point.x, point.y].every(Number.isFinite))
    throw new SketcherError("invalid-input", "Invalid diagram hit position.");
  const local = {
    x: (point.x - transform.e) / transform.a,
    y: (point.y - transform.f) / transform.d,
  };
  for (const g of scene.groups)
    if (inside(local, g.box)) return inspectDiagramTarget(scene, g.id);
  for (const r of scene.incidences)
    if (inside(local, r.row)) return inspectDiagramTarget(scene, r.id);
  for (const o of scene.observations)
    if (inside(local, o.box)) return inspectDiagramTarget(scene, o.id);
  for (const f of scene.fragments) {
    if (!inside(local, f.box)) continue;
    const molecular = hitTestMolecularScene(f.scene, point, {
      a: transform.a,
      b: transform.b,
      c: transform.c,
      d: transform.d,
      e: transform.e + transform.a * f.offset.x,
      f: transform.f + transform.d * f.offset.y,
    });
    if (molecular) {
      const atomIds =
        molecular.kind === "atom"
          ? [molecular.semanticId]
          : f.scene.bonds
              .find((b) => b.semanticId === molecular.semanticId)!
              .atoms.map(
                (id) =>
                  f.scene.atoms.find((a) => a.displayId === id)!.semanticId,
              );
      const memberships = scene.incidences
        .filter((i) =>
          i.member.atoms.some(
            (a) =>
              a.parentIndex === f.parentIndex && atomIds.includes(a.atomId),
          ),
        )
        .map((i) => i.member);
      return Object.freeze({
        kind: "molecular",
        sceneGeneration: scene.generation,
        parentIndex: f.parentIndex,
        molecular,
        context: scene.document.page.document.parents,
        memberships: Object.freeze(memberships),
      });
    }
  }
  for (const r of scene.incidences)
    for (let i = 1; i < r.route.length; i++)
      if (
        distanceToSegment(
          point,
          transformPoint(r.route[i - 1]!, transform),
          transformPoint(r.route[i]!, transform),
        ) <= 6
      )
        return inspectDiagramTarget(scene, r.id);
  return null;
}
