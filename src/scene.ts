import { SketcherError } from "./diagnostics.js";
import { prepareSuppliedMolecule } from "./documents.js";
import { snapshotJson } from "./json.js";
import {
  distanceToPolygon,
  distanceToSegment,
  expandRect,
  IDENTITY_TRANSFORM,
  rectPoints,
  transformPoint,
  unionRects,
  validateViewportTransform,
} from "./geometry.js";
import type { AffineTransform, Point, Rect } from "./geometry.js";
import type {
  DepictionAtom,
  DepictionBond,
  MolecularContext,
  PreparedMolecule,
  ResourceReference,
  SemanticAtom,
} from "./types.js";

export type TextMeasurer = (text: string, fontSize: number) => Rect;
export type Theme = "light" | "dark";
export interface SceneOptions {
  readonly instanceId: string;
  readonly generation: number;
  readonly theme?: Theme;
  readonly fontSize?: number;
}
export interface SceneAtom {
  readonly semanticId: string;
  readonly displayId: string;
  readonly position: Point;
}
export interface SceneGlyph {
  readonly semanticId: string;
  readonly displayId: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly box: Rect;
  readonly mask: Rect;
}
export interface BondPrimitive {
  readonly kind: "line" | "polygon" | "polyline";
  readonly points: readonly Point[];
}
export interface SceneBond {
  readonly semanticId: string;
  readonly displayId: string;
  readonly style: DepictionBond["style"];
  readonly atoms: readonly [string, string];
  readonly primitives: readonly BondPrimitive[];
}
export interface MolecularScene {
  readonly schemaVersion: 1;
  readonly kind: "molecular-scene";
  readonly instanceId: string;
  readonly generation: number;
  readonly documentId: string;
  readonly depictionGeneration: string;
  readonly context: MolecularContext;
  readonly source: ResourceReference;
  readonly provider: PreparedMolecule["provider"];
  readonly coverage: PreparedMolecule["depiction"]["coverage"];
  readonly theme: Theme;
  readonly font: {
    readonly family: "sans-serif";
    readonly size: number;
    readonly policy: "browser-generic-sans";
  };
  readonly strokeWidth: number;
  readonly bounds: Rect;
  readonly atoms: readonly SceneAtom[];
  readonly bonds: readonly SceneBond[];
  readonly glyphs: readonly SceneGlyph[];
  readonly warnings: readonly string[];
}
export interface ScenePick {
  readonly kind: "atom" | "bond";
  readonly semanticId: string;
  readonly displayId: string;
  readonly instanceId: string;
  readonly documentId: string;
  readonly sceneGeneration: number;
  readonly depictionGeneration: string;
  readonly context: MolecularContext;
}

export function validateSceneOptions(options: SceneOptions): void {
  const size = options.fontSize ?? 18,
    theme = options.theme ?? "light";
  if (
    typeof options.instanceId !== "string" ||
    !options.instanceId.trim() ||
    options.instanceId.length > 256 ||
    !Number.isSafeInteger(options.generation) ||
    options.generation < 1 ||
    !Number.isFinite(size) ||
    size < 10 ||
    size > 32 ||
    !["light", "dark"].includes(theme)
  )
    throw new SketcherError(
      "invalid-input",
      "Invalid scene identity, generation, typography or theme.",
    );
}

function chemicalLabel(atom: SemanticAtom): string | null {
  if (atom.hydrogenCount === null) return null;
  return (
    (atom.isotope === null ? "" : String(atom.isotope)) +
    atom.element +
    (atom.hydrogenCount
      ? "H" + (atom.hydrogenCount === 1 ? "" : atom.hydrogenCount)
      : "") +
    (atom.formalCharge
      ? (Math.abs(atom.formalCharge) === 1 ? "" : Math.abs(atom.formalCharge)) +
        (atom.formalCharge > 0 ? "+" : "-")
      : "")
  );
}

function labelRuns(
  atom: SemanticAtom,
  display: DepictionAtom,
  position: Point,
  leftHydrogens: boolean,
  size: number,
  measure: TextMeasurer,
): SceneGlyph[] {
  if (!display.label) return [];
  if (display.label.length > 128)
    throw new SketcherError(
      "input-limit",
      "The initial scene supports labels of at most 128 characters.",
    );
  const measured = (text: string, fontSize: number): Rect => {
    const box = measure(text, fontSize);
    if (
      ![box.x, box.y, box.width, box.height].every(Number.isFinite) ||
      box.width < 0 ||
      box.height <= 0 ||
      box.width > 4096 ||
      box.height > 4096
    ) {
      throw new SketcherError(
        "invalid-input",
        "The text measurer returned unsupported geometry.",
      );
    }
    return box;
  };
  const glyphs: SceneGlyph[] = [];
  const add = (text: string, x: number, y: number, fontSize: number): Rect => {
    const box = measured(text, fontSize);
    const placed = {
      x: x + box.x,
      y: y + box.y,
      width: box.width,
      height: box.height,
    };
    glyphs.push({
      semanticId: atom.id,
      displayId: display.id,
      text,
      x,
      y,
      fontSize,
      box: placed,
      mask: expandRect(placed, 2),
    });
    return placed;
  };
  if (chemicalLabel(atom) !== display.label) {
    const raw = measured(display.label, size);
    add(
      display.label,
      position.x - raw.x - raw.width / 2,
      position.y - raw.y - raw.height / 2,
      size,
    );
    return glyphs;
  }
  const element = measured(atom.element, size);
  const x = position.x - element.x - element.width / 2;
  const baseline = position.y - element.y - element.height / 2;
  const elementBox = add(atom.element, x, baseline, size);
  const script = size * 0.65;
  let left = elementBox.x,
    right = elementBox.x + elementBox.width;
  if (atom.isotope !== null) {
    const text = String(atom.isotope),
      box = measured(text, script);
    const placed = add(
      text,
      left - box.width - box.x - 1,
      baseline - size * 0.4,
      script,
    );
    left = placed.x;
  }
  if (atom.hydrogenCount) {
    const hydrogen = measured("H", size);
    const count = atom.hydrogenCount === 1 ? "" : String(atom.hydrogenCount);
    const countBox = count ? measured(count, script) : null;
    const total = hydrogen.width + (countBox?.width ?? 0);
    const start = leftHydrogens ? left - total - 1 : right + 1;
    const placed = add("H", start - hydrogen.x, baseline, size);
    if (count && countBox)
      add(
        count,
        placed.x + placed.width - countBox.x,
        baseline + size * 0.25,
        script,
      );
    if (!leftHydrogens) right = start + total;
  }
  if (atom.formalCharge) {
    const charge =
      (Math.abs(atom.formalCharge) === 1
        ? ""
        : String(Math.abs(atom.formalCharge))) +
      (atom.formalCharge > 0 ? "+" : "-");
    const box = measured(charge, script);
    add(charge, right - box.x + 1, baseline - size * 0.4, script);
  }
  return glyphs;
}

function bondPrimitives(
  bond: DepictionBond,
  points: ReadonlyMap<string, Point>,
): BondPrimitive[] {
  let first = points.get(bond.atoms[0])!,
    second = points.get(bond.atoms[1])!;
  if (
    (bond.style === "solid-wedge" || bond.style === "hashed-wedge") &&
    bond.from === bond.atoms[1]
  )
    [first, second] = [second, first];
  const dx = second.x - first.x,
    dy = second.y - first.y,
    length = Math.hypot(dx, dy);
  if (length < 0.01)
    throw new SketcherError(
      "unsupported-feature",
      "Coincident bonded drawing positions cannot be rendered.",
    );
  const normal = { x: -dy / length, y: dx / length };
  const offset = (point: Point, amount: number): Point => ({
    x: point.x + amount * normal.x,
    y: point.y + amount * normal.y,
  });
  const line = (amount: number): BondPrimitive => ({
    kind: "line",
    points: [offset(first, amount), offset(second, amount)],
  });
  if (bond.style === "double") return [line(-2.5), line(2.5)];
  if (bond.style === "triple") return [line(-4), line(0), line(4)];
  if (bond.style === "solid-wedge")
    return [
      {
        kind: "polygon",
        points: [first, offset(second, 4.5), offset(second, -4.5)],
      },
    ];
  if (bond.style === "hashed-wedge")
    return Array.from({ length: 8 }, (_, i) => {
      const t = (i + 0.5) / 8,
        center = { x: first.x + dx * t, y: first.y + dy * t };
      return {
        kind: "line",
        points: [offset(center, 4.5 * t), offset(center, -4.5 * t)],
      };
    });
  if (bond.style === "wavy")
    return [
      {
        kind: "polyline",
        points: Array.from({ length: 25 }, (_, i) => {
          const t = i / 24;
          return offset(
            { x: first.x + t * dx, y: first.y + t * dy },
            i === 0 || i === 24 ? 0 : Math.sin((i * Math.PI) / 2) * 2,
          );
        }),
      },
    ];
  return [line(0)];
}

/** Geometry only: supplied chemical meaning is never perceived from the picture. */
export function buildMolecularScene(
  input: unknown,
  measureText: TextMeasurer,
  options: SceneOptions,
): MolecularScene {
  const document = prepareSuppliedMolecule(input);
  const size = options.fontSize ?? 18,
    theme = options.theme ?? "light";
  validateSceneOptions(options);
  if (document.atoms.length > 256 || document.bonds.length > 512)
    throw new SketcherError(
      "input-limit",
      "The initial scene supports at most 256 atoms and 512 bonds.",
    );
  const display = document.depiction.atoms;
  if (
    display.some((a) => Math.abs(a.x) > 1_000_000 || Math.abs(a.y) > 1_000_000)
  )
    throw new SketcherError(
      "input-limit",
      "Drawing coordinate extent exceeds the scene profile.",
    );
  const sourcePoints = new Map(display.map((a) => [a.id, a]));
  const lengths = document.depiction.bonds
    .map((b) => {
      const a = sourcePoints.get(b.atoms[0])!,
        c = sourcePoints.get(b.atoms[1])!;
      return Math.hypot(a.x - c.x, a.y - c.y);
    })
    .sort((a, b) => a - b);
  const median = lengths.length
    ? lengths[Math.floor(lengths.length / 2)]!
    : 1.5;
  if (median < 1e-6)
    throw new SketcherError(
      "unsupported-feature",
      "Drawing bonds are too short for this scene profile.",
    );
  const scale = 48 / median,
    ySign = document.depiction.axes === "x-right-y-up" ? -1 : 1;
  const points = new Map(
    display.map((a) => [
      a.id,
      { x: a.x * scale || 0, y: a.y * scale * ySign || 0 },
    ]),
  );
  const semanticAtoms = new Map(document.atoms.map((a) => [a.id, a]));
  const atoms = display.map((a) => ({
    semanticId: a.atomId,
    displayId: a.id,
    position: points.get(a.id)!,
  }));
  const glyphs = display.flatMap((a) => {
    const neighbors = document.depiction.bonds
      .filter((b) => b.atoms.includes(a.id))
      .map((b) => points.get(b.atoms[0] === a.id ? b.atoms[1] : b.atoms[0])!);
    const position = points.get(a.id)!;
    const leading =
      neighbors.length > 0 &&
      neighbors.reduce((sum, p) => sum + p.x - position.x, 0) > 1;
    return labelRuns(
      semanticAtoms.get(a.atomId)!,
      a,
      position,
      leading,
      size,
      measureText,
    );
  });
  const bonds = document.depiction.bonds.map((b) => ({
    semanticId: b.bondId,
    displayId: b.id,
    style: b.style,
    atoms: b.atoms,
    primitives: bondPrimitives(b, points),
  }));
  const warnings: string[] = [];
  for (let i = 0; i < glyphs.length; i++)
    for (let j = i + 1; j < glyphs.length; j++) {
      const a = glyphs[i]!,
        b = glyphs[j]!;
      if (
        a.semanticId !== b.semanticId &&
        a.box.x < b.box.x + b.box.width &&
        b.box.x < a.box.x + a.box.width &&
        a.box.y < b.box.y + b.box.height &&
        b.box.y < a.box.y + a.box.height
      ) {
        if (!warnings.includes("overlapping-labels"))
          warnings.push("overlapping-labels");
      }
    }
  const bounds = expandRect(
    unionRects([
      ...atoms.map((a) =>
        expandRect({ ...a.position, width: 0, height: 0 }, 6),
      ),
      ...glyphs.map((g) => g.mask),
      ...bonds.flatMap((b) =>
        b.primitives.flatMap((p) =>
          p.points.map((point) =>
            expandRect({ ...point, width: 0, height: 0 }, 2),
          ),
        ),
      ),
    ]),
    12,
  );
  return snapshotJson({
    schemaVersion: 1,
    kind: "molecular-scene",
    instanceId: options.instanceId,
    generation: options.generation,
    documentId: document.id,
    depictionGeneration: document.depiction.generation,
    context: document.context,
    source: document.original.source,
    provider: document.provider,
    coverage: document.depiction.coverage,
    theme,
    font: { family: "sans-serif", size, policy: "browser-generic-sans" },
    strokeWidth: 1.8,
    bounds,
    atoms,
    bonds,
    glyphs,
    warnings,
  }) as unknown as MolecularScene;
}

/** Pick in viewport CSS pixels using the same glyph masks and bond primitives. */
export function hitTestMolecularScene(
  scene: MolecularScene,
  point: Point,
  transform: AffineTransform = IDENTITY_TRANSFORM,
  tolerance = 6,
): ScenePick | null {
  validateViewportTransform(transform);
  if (
    ![point.x, point.y, tolerance].every(Number.isFinite) ||
    tolerance < 0 ||
    tolerance > 32
  )
    throw new SketcherError(
      "invalid-input",
      "Invalid viewport point or hit tolerance.",
    );
  const pick = (
    kind: "atom" | "bond",
    target: { semanticId: string; displayId: string },
  ): ScenePick =>
    Object.freeze({
      kind,
      ...target,
      instanceId: scene.instanceId,
      documentId: scene.documentId,
      sceneGeneration: scene.generation,
      depictionGeneration: scene.depictionGeneration,
      context: scene.context,
    });
  const atomScores = scene.atoms
    .map((atom) => {
      const position = transformPoint(atom.position, transform);
      let distance = Math.hypot(position.x - point.x, position.y - point.y);
      for (const glyph of scene.glyphs.filter(
        (g) => g.semanticId === atom.semanticId,
      ))
        distance = Math.min(
          distance,
          distanceToPolygon(
            point,
            rectPoints(glyph.mask).map((p) => transformPoint(p, transform)),
          ),
        );
      return { atom, distance };
    })
    .sort((a, b) => a.distance - b.distance);
  if (atomScores[0] && atomScores[0].distance <= tolerance)
    return pick("atom", atomScores[0].atom);
  let best: { bond: SceneBond; distance: number } | null = null;
  // Largest singular value: exact painted round-stroke radius for the view's
  // uniform camera, conservative under an externally supplied shear/stretch.
  const strokeRadius =
    (scene.strokeWidth / 4) *
    (Math.hypot(transform.a + transform.d, transform.b - transform.c) +
      Math.hypot(transform.a - transform.d, transform.b + transform.c));
  for (const bond of scene.bonds)
    for (const primitive of bond.primitives) {
      const points = primitive.points.map((p) => transformPoint(p, transform));
      const distance =
        primitive.kind === "polygon"
          ? distanceToPolygon(point, points)
          : Math.max(
              0,
              Math.min(
                ...points
                  .slice(1)
                  .map((p, i) => distanceToSegment(point, points[i]!, p)),
              ) - strokeRadius,
            );
      if (distance <= tolerance && (!best || distance < best.distance))
        best = { bond, distance };
    }
  return best ? pick("bond", best.bond) : null;
}
