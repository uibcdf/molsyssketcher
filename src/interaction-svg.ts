import type {
  InteractionDiagramScene,
  DiagramText,
  InteractionDiagramPick,
} from "./interaction-scene.js";
import { renderMolecularSvg, SVG_COLORS, textStyle } from "./svg.js";

const NS = "http://www.w3.org/2000/svg";
let serial = 0;

/** Render the accepted scene; all source/user labels remain text nodes. */
export function renderInteractionDiagramSvg(
  scene: InteractionDiagramScene,
  document: Document,
): SVGSVGElement {
  const create = <K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs: Record<string, string> = {},
  ): SVGElementTagNameMap[K] => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs))
      node.setAttribute(key, value);
    return node;
  };
  const colors = SVG_COLORS[scene.theme],
    accent = scene.theme === "dark" ? "#79cdd7" : "#167a88",
    muted = scene.theme === "dark" ? "#b9cbd5" : "#516574";
  const prefix = `mss-interactions-${++serial}`,
    b = scene.bounds;
  const root = create("svg", {
    viewBox: `${b.x} ${b.y} ${b.width} ${b.height}`,
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
    role: "group",
    tabindex: "0",
    "aria-labelledby": `${prefix}-title`,
    "aria-describedby": `${prefix}-description`,
    "data-molsyssketcher-view": "interactions",
    "data-scene-generation": String(scene.generation),
  });
  root.style.display = "block";
  root.style.background = colors.background;
  root.style.touchAction = "none";
  const title = create("title", { id: `${prefix}-title` });
  title.textContent = `${scene.document.composition.mode}: ${scene.observations.length} native observations.`;
  const description = create("desc", { id: `${prefix}-description` });
  description.textContent = `Read-only schematic interaction diagram. Arrow keys choose native observations and roles; Enter selects, Escape clears. Connections retain every participant; lengths are nonphysical. Coverage: ${scene.topology.coverage}${scene.topology.partial ? ", partial page" : ""}. Measurements are retained without browser interpretation. Method: ${scene.document.page.native.page.method}.`;
  const metadata = create("metadata");
  metadata.textContent = JSON.stringify({
    schemaVersion: 1,
    kind: "molsyssketcher-interaction-figure-context",
    documentId: scene.document.id,
    sceneGeneration: scene.generation,
    analysis: scene.document.page.analysis,
    parents: scene.document.page.document.parents,
    composition: scene.document.composition,
    groups: scene.document.groups,
    method: scene.document.page.native.page.method,
    parameters: scene.document.page.native.page.parameters,
    producer: scene.document.page.native.page.software,
    reader: scene.document.page.reader,
    structureIndex: scene.document.page.structureIndex,
    coverage: scene.topology.coverage,
    evaluationScope: scene.document.page.native.evaluationScope,
    partial: scene.topology.partial,
    pagination: {
      offset: scene.document.page.native.page.offset,
      limit: scene.document.page.native.page.limit,
      total: scene.document.page.native.page.total_count,
    },
    measureUnits: scene.document.page.native.page.measure_units,
    quantities: "opaque",
    layout: scene.layout,
    coordinates: "nonphysical-drawing",
    theme: scene.theme,
    depictions: scene.document.parents.map((p) => ({
      parentIndex: p.parentIndex,
      provider: p.molecule.provider,
      generation: p.molecule.depiction.generation,
    })),
  });
  root.append(
    title,
    description,
    metadata,
    create("rect", {
      x: String(b.x),
      y: String(b.y),
      width: String(b.width),
      height: String(b.height),
      fill: colors.background,
      "data-layer": "background",
    }),
  );
  const text = (glyph: DiagramText, fill: string = colors.foreground) => {
    const element = create("text", {
      x: String(glyph.x),
      y: String(glyph.y),
      fill,
    });
    textStyle(element, glyph.fontSize);
    element.textContent = glyph.text;
    return element;
  };
  const frame = create("g", { "data-layer": "parent-frames" });
  for (const fragment of scene.fragments) {
    const box = fragment.box;
    const group = create("g", {
      "data-parent-index": String(fragment.parentIndex),
    });
    group.append(
      create("rect", {
        x: String(box.x),
        y: String(box.y),
        width: String(box.width),
        height: String(box.height),
        rx: "12",
        fill: colors.background,
        stroke: muted,
        "stroke-width": "1",
      }),
      text(fragment.title),
    );
    frame.append(group);
  }
  root.append(frame);
  const defs = create("defs"),
    mask = create("mask", {
      id: `${prefix}-chemical-labels`,
      maskUnits: "userSpaceOnUse",
      x: String(b.x),
      y: String(b.y),
      width: String(b.width),
      height: String(b.height),
    });
  mask.style.maskType = "luminance";
  mask.append(
    create("rect", {
      x: String(b.x),
      y: String(b.y),
      width: String(b.width),
      height: String(b.height),
      fill: "white",
    }),
  );
  for (const f of scene.fragments)
    for (const g of f.scene.glyphs)
      mask.append(
        create("rect", {
          x: String(g.mask.x + f.offset.x),
          y: String(g.mask.y + f.offset.y),
          width: String(g.mask.width),
          height: String(g.mask.height),
          fill: "black",
        }),
      );
  defs.append(mask);
  root.append(defs);
  const edges = create("g", {
    "data-layer": "native-connections",
    mask: `url(#${prefix}-chemical-labels)`,
  });
  edges.style.pointerEvents = "none";
  for (const incidence of scene.incidences) {
    const line = create("polyline", {
      points: incidence.route.map((p) => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: accent,
      "stroke-width": "1.5",
      "stroke-dasharray": "4 4",
      "data-incidence-id": incidence.id,
      "data-role": incidence.member.role,
      "data-constituents": String(incidence.member.atoms.length),
    });
    edges.append(line);
  }
  root.append(edges);
  const molecules = create("g", { "data-layer": "molecular-fragments" });
  for (const fragment of scene.fragments) {
    const nested = renderMolecularSvg(fragment.scene, document),
      box = fragment.scene.bounds;
    nested.dataset.parentIndex = String(fragment.parentIndex);
    nested.setAttribute("x", String(box.x + fragment.offset.x));
    nested.setAttribute("y", String(box.y + fragment.offset.y));
    nested.setAttribute("width", String(box.width));
    nested.setAttribute("height", String(box.height));
    nested.setAttribute("tabindex", "-1");
    nested.style.setProperty("width", `${box.width}px`, "important");
    nested.style.setProperty("height", `${box.height}px`, "important");
    nested.style.background = "transparent";
    nested
      .querySelector('[data-layer="background"]')!
      .setAttribute("fill", "none");
    molecules.append(nested);
  }
  root.append(molecules);
  const atoms = create("g", {
    "data-layer": "participant-anchors",
    "pointer-events": "none",
  });
  for (const incidence of scene.incidences) {
    const group = create("g", { "data-incidence-id": incidence.id });
    for (const atom of incidence.atoms)
      group.append(
        create("circle", {
          cx: String(atom.x),
          cy: String(atom.y),
          r: "7",
          fill: "none",
          stroke: accent,
          "stroke-width": "1",
          "stroke-dasharray": "2 2",
        }),
      );
    if (incidence.atoms.length > 1)
      group.append(
        create("circle", {
          cx: String(incidence.anchor.x),
          cy: String(incidence.anchor.y),
          r: "3",
          fill: accent,
        }),
      );
    atoms.append(group);
  }
  root.append(atoms);
  const cards = create("g", { "data-layer": "native-observations" });
  for (const observation of scene.observations) {
    const box = observation.box,
      group = create("g", { "data-observation-id": observation.id });
    const detail = create("title");
    const native = scene.topology.observations.find(
      (o) => o.id === observation.id,
    )!;
    detail.textContent = `${observation.title.text}. ${native.participants.length} roles. Evidence: ${native.evidence.replaceAll("_", " ")}. Original occurrence ${native.occurrenceIndex}, relation ${native.relationIndex}.`;
    group.append(
      create("rect", {
        x: String(box.x),
        y: String(box.y),
        width: String(box.width),
        height: String(box.height),
        rx: "10",
        fill: colors.background,
        stroke: observation.known ? accent : muted,
        "stroke-width": "1.5",
      }),
      text(observation.title),
      detail,
    );
    for (const incidence of scene.incidences.filter(
      (i) => i.observationId === observation.id,
    )) {
      const row = create("g", { "data-incidence-id": incidence.id });
      const info = create("title");
      info.textContent = `${incidence.member.role}: ${incidence.member.atoms.length} constituent atom(s); original relation ${incidence.member.relationIndex}.`;
      row.append(
        create("circle", {
          cx: String(incidence.route[0]!.x),
          cy: String(incidence.route[0]!.y),
          r: "3",
          fill: accent,
        }),
        text(incidence.label, muted),
        info,
      );
      group.append(row);
    }
    cards.append(group);
  }
  for (const group of scene.groups) {
    const box = group.box;
    const node = create("g", { "data-group-id": group.id });
    node.append(
      create("rect", {
        x: String(box.x),
        y: String(box.y),
        width: String(box.width),
        height: String(box.height),
        rx: "8",
        fill: colors.background,
        stroke: accent,
      }),
      text(group.title, accent),
    );
    cards.append(node);
  }
  root.append(cards);
  const header = create("g", { "data-layer": "diagram-header" });
  scene.header.forEach((t) => header.append(text(t, muted)));
  root.append(header);
  root.append(
    create("g", {
      "data-layer": "diagram-selection",
      "pointer-events": "none",
      "aria-hidden": "true",
    }),
    create("g", {
      "data-layer": "diagram-focus",
      "pointer-events": "none",
      "aria-hidden": "true",
    }),
  );
  return root;
}

export function drawDiagramIndicator(
  root: SVGSVGElement,
  scene: InteractionDiagramScene,
  pick: InteractionDiagramPick | null,
  role: "selection" | "focus",
): void {
  const layer = root.querySelector(`[data-layer="diagram-${role}"]`)!;
  layer.replaceChildren();
  if (!pick) return;
  const points =
    pick.kind === "molecular"
      ? scene.fragments
          .filter((f) => f.parentIndex === pick.parentIndex)
          .flatMap((f) =>
            f.scene.atoms
              .filter((a) =>
                pick.molecular.kind === "atom"
                  ? a.semanticId === pick.molecular.semanticId
                  : f.scene.bonds
                      .find((b) => b.semanticId === pick.molecular.semanticId)!
                      .atoms.includes(a.displayId),
              )
              .map((a) => ({
                x: a.position.x + f.offset.x,
                y: a.position.y + f.offset.y,
              })),
          )
      : scene.incidences
          .filter((i) =>
            pick.kind === "participant"
              ? i.id === pick.visualId
              : pick.kind === "observation"
                ? i.observationId === pick.visualId
                : i.nodeId === pick.visualId,
          )
          .flatMap((i) => i.atoms);
  for (const p of points) {
    const circle = root.ownerDocument.createElementNS(NS, "circle");
    for (const [k, v] of Object.entries({
      cx: p.x,
      cy: p.y,
      r: role === "focus" ? 11 : 9,
      fill: "none",
      stroke: SVG_COLORS[scene.theme].selection,
      "stroke-width": 2,
      "stroke-dasharray": role === "focus" ? "2 2" : "none",
    }))
      circle.setAttribute(k, String(v));
    layer.append(circle);
  }
}
