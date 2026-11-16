import { SketcherError } from "./diagnostics.js";
import type { Rect } from "./geometry.js";
import type { MolecularScene, TextMeasurer } from "./scene.js";

const SVG_NS = "http://www.w3.org/2000/svg";
let serial = 0;
export const SVG_COLORS = Object.freeze({
  light: Object.freeze({
    background: "#ffffff",
    foreground: "#17212b",
    selection: "#0868c9",
  }),
  dark: Object.freeze({
    background: "#15202b",
    foreground: "#f1f5f9",
    selection: "#78bfff",
  }),
});

export function textStyle(text: SVGTextElement, size: number): void {
  for (const [name, value] of Object.entries({
    "font-family": "sans-serif",
    "font-size": `${size}px`,
    "font-weight": "400",
    "font-style": "normal",
    "font-kerning": "normal",
    "text-rendering": "geometricPrecision",
    "letter-spacing": "0px",
    "word-spacing": "0px",
    "text-transform": "none",
    "text-anchor": "start",
    "dominant-baseline": "alphabetic",
    stroke: "none",
  }))
    text.style.setProperty(name, value, "important");
}

export interface BrowserTextMeasurer {
  readonly ready: Promise<void>;
  readonly measure: TextMeasurer;
  dispose(): void;
}

/** Actual SVG glyph bounds in the browser; no estimated character widths. */
export function createBrowserTextMeasurer(
  document: Document,
): BrowserTextMeasurer {
  if (!document.fonts?.load || !document.documentElement)
    throw new SketcherError(
      "unsupported-feature",
      "This browser lacks the required SVG/font surface.",
    );
  const root = document.createElementNS(SVG_NS, "svg");
  root.dataset.molsyssketcherMeasurement = "true";
  root.setAttribute("aria-hidden", "true");
  root.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";
  const node = document.createElementNS(SVG_NS, "text");
  node.setAttribute("x", "0");
  node.setAttribute("y", "0");
  root.append(node);
  (document.body ?? document.documentElement).append(root);
  const cache = new Map<string, Rect>();
  let disposed = false;
  const ready = document.fonts
    .load("18px sans-serif", "CHNO0123456789+-")
    .then(() => undefined);
  void ready.catch(() => undefined);
  return {
    ready,
    measure(text, size) {
      if (disposed)
        throw new SketcherError(
          "disposed",
          "The text measurer has been disposed.",
        );
      const key = `${size}:${text}`;
      const cached = cache.get(key);
      if (cached) return cached;
      textStyle(node, size);
      node.textContent = text;
      const box = node.getBBox();
      const result = Object.freeze({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      });
      if (cache.size >= 512) cache.delete(cache.keys().next().value!);
      cache.set(key, result);
      return result;
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        cache.clear();
        root.remove();
      }
    },
  };
}

/** Project a complete immutable scene; text is always inserted as text nodes. */
export function renderMolecularSvg(
  scene: MolecularScene,
  document: Document,
): SVGSVGElement {
  const colors = SVG_COLORS[scene.theme],
    prefix = `mss-svg-${++serial}`;
  const create = <K extends keyof SVGElementTagNameMap>(
    tag: K,
    attributes: Record<string, string> = {},
  ): SVGElementTagNameMap[K] => {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes))
      element.setAttribute(key, value);
    return element;
  };
  const bounds = scene.bounds;
  const root = create("svg", {
    viewBox: `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`,
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
    role: "group",
    tabindex: "0",
    "aria-labelledby": `${prefix}-title`,
    "aria-describedby": `${prefix}-description`,
    "data-molsyssketcher-view": "molecular",
    "data-scene-generation": String(scene.generation),
  });
  root.style.display = "block";
  root.style.background = colors.background;
  root.style.overflow = "hidden";
  const title = create("title", { id: `${prefix}-title` });
  title.textContent = `Molecule ${scene.documentId}: ${scene.atoms.length} atoms, ${scene.bonds.length} bonds.`;
  const description = create("desc", { id: `${prefix}-description` });
  description.textContent = `Read-only molecular drawing. Drag to pan; wheel to zoom at the cursor. Arrow keys move between atoms and bonds; Enter selects; Escape clears selection. W/A/S/D pan; +/- zoom; Home fits the molecule. Preparation: ${scene.coverage.status}. ${scene.coverage.missing.join("; ")}`;
  const metadata = create("metadata");
  metadata.textContent = JSON.stringify({
    schemaVersion: 1,
    kind: "molsyssketcher-figure-context",
    documentId: scene.documentId,
    source: scene.source,
    context: scene.context,
    provider: scene.provider,
    depictionGeneration: scene.depictionGeneration,
    sceneGeneration: scene.generation,
    coordinates: "nonphysical-drawing",
    coverage: scene.coverage,
    font: scene.font,
    theme: scene.theme,
    warnings: scene.warnings,
  });
  root.append(title, description, metadata);
  const definitions = create("defs"),
    mask = create("mask", {
      id: `${prefix}-labels`,
      maskUnits: "userSpaceOnUse",
      maskContentUnits: "userSpaceOnUse",
      x: String(bounds.x),
      y: String(bounds.y),
      width: String(bounds.width),
      height: String(bounds.height),
    });
  mask.style.maskType = "luminance";
  mask.append(
    create("rect", {
      x: String(bounds.x),
      y: String(bounds.y),
      width: String(bounds.width),
      height: String(bounds.height),
      fill: "white",
    }),
  );
  for (const glyph of scene.glyphs)
    mask.append(
      create("rect", {
        x: String(glyph.mask.x),
        y: String(glyph.mask.y),
        width: String(glyph.mask.width),
        height: String(glyph.mask.height),
        fill: "black",
        "data-label-mask": glyph.displayId,
      }),
    );
  definitions.append(mask);
  root.append(definitions);
  const background = create("rect", {
    x: String(bounds.x),
    y: String(bounds.y),
    width: String(bounds.width),
    height: String(bounds.height),
    fill: colors.background,
    "data-layer": "background",
  });
  background.style.pointerEvents = "none";
  root.append(background);
  const chemical = create("g", {
    mask: `url(#${prefix}-labels)`,
    "data-layer": "chemical-bonds",
  });
  chemical.style.pointerEvents = "none";
  for (const bond of scene.bonds) {
    const group = create("g", {
      "data-bond-id": bond.semanticId,
      "data-display-id": bond.displayId,
      "data-bond-style": bond.style,
    });
    for (const primitive of bond.primitives) {
      let element: SVGElement;
      if (primitive.kind === "line") {
        const [a, b] = primitive.points;
        element = create("line", {
          x1: String(a!.x),
          y1: String(a!.y),
          x2: String(b!.x),
          y2: String(b!.y),
        });
      } else
        element = create(primitive.kind, {
          points: primitive.points.map((p) => `${p.x},${p.y}`).join(" "),
        });
      element.setAttribute("stroke", colors.foreground);
      element.setAttribute(
        "fill",
        primitive.kind === "polygon" ? colors.foreground : "none",
      );
      element.setAttribute(
        "stroke-width",
        primitive.kind === "polygon" ? "0" : String(scene.strokeWidth),
      );
      element.setAttribute("stroke-linecap", "round");
      element.setAttribute("stroke-linejoin", "round");
      group.append(element);
    }
    chemical.append(group);
  }
  root.append(chemical);
  const labels = create("g", { "data-layer": "chemical-labels" });
  labels.style.pointerEvents = "none";
  for (const glyph of scene.glyphs) {
    const text = create("text", {
      x: String(glyph.x),
      y: String(glyph.y),
      fill: colors.foreground,
      "data-atom-id": glyph.semanticId,
      "data-display-id": glyph.displayId,
    });
    textStyle(text, glyph.fontSize);
    text.textContent = glyph.text;
    labels.append(text);
  }
  root.append(
    labels,
    create("g", {
      "data-layer": "selection",
      "aria-hidden": "true",
      "pointer-events": "none",
    }),
    create("g", {
      "data-layer": "focus",
      "aria-hidden": "true",
      "pointer-events": "none",
    }),
    create("g", {
      "data-layer": "hover",
      "aria-hidden": "true",
      "pointer-events": "none",
    }),
  );
  return root;
}
