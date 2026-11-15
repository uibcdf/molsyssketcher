import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { chromium } from "playwright";
import { startBrowserServer } from "../../devtools/browser-server.mjs";

const evidence = resolve(
  process.env.MOLSYSSKETCHER_BROWSER_EVIDENCE_DIR ??
    "/tmp/molsyssketcher-svg-review",
);
mkdirSync(evidence, { recursive: true });
let server, browser;
const drawings = [];
before(async () => {
  server = await startBrowserServer();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.MOLSYSSKETCHER_BROWSER_EXECUTABLE
      ? { executablePath: process.env.MOLSYSSKETCHER_BROWSER_EXECUTABLE }
      : {}),
  });
  console.log(`Browser: ${browser.version()}`);
});
after(async () => {
  writeFileSync(
    join(evidence, "drawings.json"),
    JSON.stringify(drawings, null, 2),
  );
  writeFileSync(
    join(evidence, "browser.json"),
    JSON.stringify(
      {
        browser: browser?.version(),
        molecularCases: drawings.length,
        scope:
          "actual SVG metrics, native prepared corpus and finite molecular browser controls",
      },
      null,
      2,
    ),
  );
  await browser?.close();
  await server?.close();
  console.log(`Browser evidence: ${evidence}`);
});

async function withPage(work, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    ...options,
  });
  const errors = [];
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === server.url
      ? route.continue()
      : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${server.url}/tests/browser/harness.html`);
    await page.waitForFunction(() => window.ready);
    await work(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

test("twelve real preparations have coherent rendered glyph/mask bounds and original semantic geometry", async () =>
  withPage(async (page) => {
    const received = await page.evaluate(async () => {
      const view = api.createMolecularSvgView(document.querySelector("#a"), {
        instanceId: "corpus-view",
      });
      await view.ready;
      const results = [];
      for (const item of corpus) {
        const outcome = await view.replace(item.document);
        if (outcome.status !== "accepted")
          throw new Error(`Refused ${item.id}`);
        const scene = view.state.accepted.scene,
          root = document.querySelector("#a svg");
        const texts = [
          ...root.querySelectorAll('[data-layer="chemical-labels"] text'),
        ];
        let maxError = 0;
        texts.forEach((text, i) => {
          const box = text.getBBox(),
            expected = scene.glyphs[i].box;
          for (const key of ["x", "y", "width", "height"])
            maxError = Math.max(maxError, Math.abs(box[key] - expected[key]));
        });
        for (const width of [220, 760]) {
          view.resize(width, 280);
          texts.forEach((text, i) => {
            const box = text.getBBox(),
              expected = scene.glyphs[i].box;
            for (const key of ["x", "y", "width", "height"])
              maxError = Math.max(maxError, Math.abs(box[key] - expected[key]));
          });
        }
        view.resize(440, 300);
        for (const zoom of [0.25, 1.75, 8]) {
          view.fit();
          view.zoomBy(zoom);
          texts.forEach((text, i) => {
            const box = text.getBBox(),
              expected = scene.glyphs[i].box;
            for (const key of ["x", "y", "width", "height"])
              maxError = Math.max(maxError, Math.abs(box[key] - expected[key]));
          });
        }
        view.fit();
        view.zoomBy(1.4);
        view.panBy(12, -8);
        const project = (x, y, element = root) => {
          const point = new DOMPoint(x, y).matrixTransform(
            element.getScreenCTM(),
          );
          return { x: point.x, y: point.y };
        };
        const bonds = [...root.querySelectorAll("[data-bond-id]")].map(
          (group) => ({
            semanticId: group.getAttribute("data-bond-id"),
            shapes: [...group.children].map((shape) => ({
              tag: shape.localName,
              ...(shape.localName === "line"
                ? {
                    points: [
                      project(
                        +shape.getAttribute("x1"),
                        +shape.getAttribute("y1"),
                        shape,
                      ),
                      project(
                        +shape.getAttribute("x2"),
                        +shape.getAttribute("y2"),
                        shape,
                      ),
                    ],
                  }
                : {
                    points: [...shape.points].map((p) =>
                      project(p.x, p.y, shape),
                    ),
                  }),
            })),
          }),
        );
        results.push({
          id: item.id,
          document: item.document,
          referenceSmiles: item.reference.isomericSmiles,
          sceneAtoms: scene.atoms.map((atom) => ({
            ...atom,
            position: project(atom.position.x, atom.position.y),
          })),
          drawingCoordinates: "client-css-pixels",
          viewport: view.state.viewport,
          bonds,
          maxError,
          glyphCount: scene.glyphs.length,
          maskCount: root.querySelectorAll("[data-label-mask]").length,
          svg: view.exportSvg(),
        });
      }
      view.dispose();
      return results;
    });
    assert.equal(received.length, 12);
    for (const item of received) {
      assert.ok(
        item.maxError < 0.05,
        `${item.id} glyph discrepancy: ${item.maxError}`,
      );
      assert.equal(item.glyphCount, item.maskCount);
      assert.match(item.svg, /molsyssketcher-figure-context/);
    }
    drawings.push(...received);
  }));

test("pointer picks remain CSS-pixel scoped after resizing and return exact IDs/context", async () =>
  withPage(async (page) => {
    await page.evaluate(async () => {
      window.view = api.createMolecularSvgView(document.querySelector("#a"), {
        instanceId: "pick-view",
      });
      window.events = [];
      view.subscribeSelection((hit) => events.push(hit));
      await view.replace(corpus.find((x) => x.id === "methanol").document);
    });
    for (const width of [220, 440, 760]) {
      const point = await page.evaluate((width) => {
        document.querySelector("#a").style.width = `${width}px`;
        view.resize(width, 280);
        const scene = view.state.accepted.scene,
          atom = scene.atoms[0];
        const p = new DOMPoint(
          atom.position.x,
          atom.position.y,
        ).matrixTransform(document.querySelector("#a svg").getScreenCTM());
        return { x: p.x, y: p.y, semanticId: atom.semanticId };
      }, width);
      await page.mouse.click(point.x, point.y);
      const event = await page.evaluate(() => events.at(-1));
      assert.equal(event.kind, "atom");
      assert.equal(event.semanticId, point.semanticId);
      assert.equal(event.instanceId, "pick-view");
      assert.equal(event.context.molecule.id, "methanol");
      const labelPoint = await page.evaluate(() => {
        const glyph = view.state.accepted.scene.glyphs.at(-1);
        const p = new DOMPoint(
          glyph.box.x + glyph.box.width / 2,
          glyph.box.y + glyph.box.height / 2,
        ).matrixTransform(document.querySelector("#a svg").getScreenCTM());
        return { x: p.x, y: p.y, semanticId: glyph.semanticId };
      });
      await page.mouse.click(labelPoint.x, labelPoint.y);
      assert.equal(
        await page.evaluate(() => events.at(-1).semanticId),
        labelPoint.semanticId,
      );
    }
    const center = await page.evaluate(() => {
      const points = view.state.accepted.scene.atoms.map((a) => a.position);
      const p = new DOMPoint(
        (points[0].x + points[1].x) / 2,
        (points[0].y + points[1].y) / 2,
      ).matrixTransform(document.querySelector("#a svg").getScreenCTM());
      return { x: p.x, y: p.y };
    });
    await page.mouse.click(center.x, center.y);
    assert.equal(await page.evaluate(() => events.at(-1).kind), "bond");
  }));

test("keyboard navigation selects read-only semantic targets and respects modified shortcuts", async () =>
  withPage(async (page) => {
    await page.evaluate(async () => {
      window.view = api.createMolecularSvgView(document.querySelector("#a"), {
        instanceId: "keyboard",
      });
      window.events = [];
      view.subscribeSelection((hit) => events.push(hit));
      await view.replace(corpus[0].document);
      document.querySelector("#a svg").focus();
    });
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => view.state.selection), null);
    assert.equal(
      await page.locator('#a [data-layer="selection"] circle').count(),
      0,
    );
    assert.equal(
      await page.locator('#a [data-layer="focus"] circle').count(),
      1,
    );
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => events.at(-1).kind), "atom");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => events.at(-1).kind), "bond");
    await page.keyboard.press("Control+ArrowRight");
    assert.equal(await page.evaluate(() => events.length), 2);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => events.at(-1)), null);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => events.at(-1).kind), "bond");
    assert.equal(
      await page.evaluate(() => view.state.accepted.document.original.data),
      "CO\n",
    );
  }));

test("failed and superseded replacements preserve coherent accepted DOM and retire old events", async () =>
  withPage(async (page) => {
    const result = await page.evaluate(async () => {
      window.view = api.createMolecularSvgView(document.querySelector("#a"), {
        instanceId: "replace-view",
      });
      const burst = await Promise.all([
        view.replace(corpus[0].document),
        view.replace(corpus[1].document),
        view.replace(corpus[2].document),
      ]);
      const old = document.querySelector("#a svg"),
        accepted = view.state.accepted;
      const failed = await view.replace({ schemaVersion: 999 });
      const preserved =
        old === document.querySelector("#a svg") &&
        view.state.accepted === accepted;
      window.events = [];
      view.subscribeSelection((hit) => events.push(hit));
      view.resize(240, 200);
      await view.replace(corpus[0].document);
      old.dispatchEvent(
        new MouseEvent("click", { clientX: 100, clientY: 100 }),
      );
      return {
        statuses: burst.map((x) => x.status),
        failed: failed.status,
        preserved,
        staleEvents: events.length,
        width: document.querySelector("#a svg").getBoundingClientRect().width,
        original: view.state.accepted.document.original.data,
      };
    });
    assert.deepEqual(result.statuses, ["superseded", "superseded", "accepted"]);
    assert.equal(result.failed, "failed");
    assert.equal(result.preserved, true);
    assert.equal(result.staleEvents, 0);
    assert.equal(result.width, 240);
  }));

test("instances own masks, measurement resources and teardown without removing host content", async () =>
  withPage(async (page) => {
    const result = await page.evaluate(async () => {
      const host = document.querySelector("#a"),
        sibling = document.createElement("span");
      sibling.textContent = "host-owned";
      host.append(sibling);
      const a = api.createMolecularSvgView(host, { instanceId: "one" }),
        b = api.createMolecularSvgView(document.querySelector("#b"), {
          instanceId: "two",
          theme: "dark",
        });
      await Promise.all([
        a.replace(corpus[0].document),
        b.replace(corpus[0].document),
      ]);
      let calls = 0,
        otherCalls = 0,
        bounded = false;
      const unsubscribe = a.subscribeSelection(() => calls++);
      unsubscribe();
      unsubscribe();
      for (let index = 0; index < 32; index++)
        a.subscribeSelection(() => calls++);
      try {
        a.subscribeSelection(() => calls++);
      } catch {
        bounded = true;
      }
      b.subscribeSelection(() => otherCalls++);
      const clickFirst = (view, host) => {
        const svg = host.querySelector("svg"),
          atom = view.state.accepted.scene.atoms[0];
        const point = new DOMPoint(
          atom.position.x,
          atom.position.y,
        ).matrixTransform(svg.getScreenCTM());
        svg.dispatchEvent(
          new MouseEvent("click", { clientX: point.x, clientY: point.y }),
        );
      };
      clickFirst(a, host);
      const ids = [...document.querySelectorAll("[id]")].map((x) => x.id);
      const unique = new Set(ids).size === ids.length;
      const background = document
        .querySelector('#b svg [data-layer="background"]')
        .getAttribute("fill");
      a.dispose();
      a.dispose();
      const bLives =
        !!document.querySelector("#b svg") && b.state.accepted !== null;
      clickFirst(b, document.querySelector("#b"));
      b.dispose();
      const measurements = document.querySelectorAll(
        "[data-molsyssketcher-measurement]",
      ).length;
      let rejected = false;
      try {
        api.createMolecularSvgView(host, { instanceId: "" });
      } catch {
        rejected = true;
      }
      return {
        unique,
        calls,
        otherCalls,
        bounded,
        background,
        bLives,
        measurements,
        hostText: sibling.textContent,
        rejected,
        afterInvalid: document.querySelectorAll(
          "[data-molsyssketcher-measurement]",
        ).length,
      };
    });
    assert.equal(result.unique, true);
    assert.equal(result.calls, 32);
    assert.equal(result.otherCalls, 1);
    assert.equal(result.bounded, true);
    assert.equal(result.background, "#15202b");
    assert.equal(result.bLives, true);
    assert.equal(result.measurements, 0);
    assert.equal(result.afterInvalid, 0);
    assert.equal(result.hostText, "host-owned");
    assert.equal(result.rejected, true);
  }));

test("measured labels resist host typography overrides; export is safe and retains scientific context", async () =>
  withPage(async (page) => {
    const result = await page.evaluate(async () => {
      const style = document.createElement("style");
      style.textContent =
        "text {font-size:90px!important;font-family:serif!important;letter-spacing:10px!important}";
      document.head.append(style);
      const view = api.createMolecularSvgView(document.querySelector("#a"), {
        instanceId: "export",
      });
      const input = structuredClone(corpus[0].document);
      input.depiction.atoms[1].label = "<script>window.injected=1</script>";
      input.depiction.coverage = {
        status: "partial",
        missing: ["example missing stereo"],
      };
      await view.replace(input);
      const scene = view.state.accepted.scene,
        text = document.querySelector('#a [data-layer="chemical-labels"] text'),
        bbox = text.getBBox();
      const exported = new DOMParser().parseFromString(
        view.exportSvg(),
        "image/svg+xml",
      );
      const metadata = JSON.parse(
        exported.querySelector("metadata").textContent,
      );
      return {
        injected: !!window.injected,
        scripts: exported.querySelectorAll("script,foreignObject").length,
        errors: exported.querySelectorAll("parsererror").length,
        text: text.textContent,
        widthError: Math.abs(bbox.width - scene.glyphs[0].box.width),
        context: metadata.context,
        provider: metadata.provider.name,
        coverage: metadata.coverage.status,
        description: exported.querySelector("desc").textContent,
        selection: exported.querySelector('[data-layer="selection"]').children
          .length,
      };
    });
    assert.equal(result.injected, false);
    assert.equal(result.scripts, 0);
    assert.equal(result.errors, 0);
    assert.ok(result.widthError < 0.05);
    assert.match(result.text, /<script>/);
    assert.equal(result.provider, "RDKit");
    assert.equal(result.context.molecule.id, "methanol");
    assert.equal(result.coverage, "partial");
    assert.match(result.description, /example missing stereo/);
    assert.equal(result.selection, 0);
  }));

test("actual SVG preserves directed stereo under declared axis conversion and endpoint reordering", async () =>
  withPage(async (page) => {
    const comparison = await page.evaluate(async () => {
      const view = api.createMolecularSvgView(document.querySelector("#a"), {
        instanceId: "axes",
      });
      const source = corpus.find((x) => x.id === "tetra-b").document;
      const geometry = () =>
        [...document.querySelectorAll("#a [data-bond-id]")].map((group) =>
          [...group.children].map((shape) =>
            shape.localName === "line"
              ? [
                  "line",
                  ...["x1", "y1", "x2", "y2"].map(
                    (key) => +shape.getAttribute(key),
                  ),
                ]
              : [
                  shape.localName,
                  ...[...shape.points].flatMap((p) => [p.x, p.y]),
                ],
          ),
        );
      await view.replace(source);
      const original = geometry();
      const converted = structuredClone(source);
      converted.depiction.axes = "x-right-y-down";
      converted.depiction.atoms.forEach((atom) => (atom.y *= -1));
      // Reorder only directed wedge tuples; preserve their explicit origin.
      converted.depiction.bonds
        .filter((bond) => bond.from)
        .forEach((bond) => bond.atoms.reverse());
      await view.replace(converted);
      const result = { original, converted: geometry() };
      view.dispose();
      return result;
    });
    assert.deepEqual(comparison.converted, comparison.original);
  }));

async function mountNavigation(page, id = "methanol") {
  await page.evaluate(async (id) => {
    window.view = api.createMolecularSvgView(document.querySelector("#a"), {
      instanceId: "navigation",
    });
    window.events = [];
    view.subscribeSelection((pick) => events.push(pick));
    await view.replace(corpus.find((item) => item.id === id).document);
    window.originalAccepted = view.state.accepted;
    window.originalScene = JSON.stringify(view.state.accepted.scene);
  }, id);
}

async function atomPosition(page, id = "atom:0", host = "#a") {
  return page.evaluate(
    ({ id, host }) => {
      const current = host === "#a" ? view : window.other;
      const atom = current.state.accepted.scene.atoms.find(
        (atom) => atom.semanticId === id,
      );
      const point = new DOMPoint(
        atom.position.x,
        atom.position.y,
      ).matrixTransform(document.querySelector(`${host} svg`).getScreenCTM());
      return { x: point.x, y: point.y };
    },
    { id, host },
  );
}

test("wheel zoom anchors the cursor, clamps positive scale and preserves modified host shortcuts", async () =>
  withPage(async (page) => {
    await mountNavigation(page, "tetra-b");
    const atom = await atomPosition(page, "atom:1"),
      cursor = { x: Math.round(atom.x), y: Math.round(atom.y) };
    const anchor = await page.evaluate((cursor) => {
      const p = new DOMPoint(cursor.x, cursor.y).matrixTransform(
        document.querySelector("#a svg").getScreenCTM().inverse(),
      );
      return { x: p.x, y: p.y };
    }, cursor);
    await page.mouse.move(cursor.x, cursor.y);
    await page.mouse.wheel(0, -120);
    await page.waitForFunction(() => view.state.viewport.zoom > 1);
    const result = await page.evaluate((anchor) => {
      const root = document.querySelector("#a svg");
      const point = new DOMPoint(anchor.x, anchor.y).matrixTransform(
        root.getScreenCTM(),
      );
      const previous = view.state.viewport;
      const modified = new WheelEvent("wheel", {
        deltaY: -100,
        ctrlKey: true,
        cancelable: true,
      });
      root.dispatchEvent(modified);
      let invalid = 0;
      for (const factor of [0, -1, NaN, Infinity]) {
        try {
          view.zoomBy(factor);
        } catch {
          invalid++;
        }
      }
      const preserved = previous === view.state.viewport;
      view.zoomBy(1e100);
      const maximum = view.state.viewport.zoom;
      view.zoomBy(1e-100);
      const minimum = view.state.viewport.zoom;
      return {
        point,
        modified: modified.defaultPrevented,
        invalid,
        preserved,
        maximum,
        minimum,
        sameDocument: view.state.accepted === originalAccepted,
        sameScene: JSON.stringify(view.state.accepted.scene) === originalScene,
      };
    }, anchor);
    assert.ok(Math.abs(result.point.x - cursor.x) < 0.05);
    assert.ok(Math.abs(result.point.y - cursor.y) < 0.05);
    assert.equal(result.modified, false);
    assert.equal(result.invalid, 4);
    assert.equal(result.preserved, true);
    assert.equal(result.maximum, 8);
    assert.equal(result.minimum, 0.25);
    assert.equal(result.sameDocument, true);
    assert.equal(result.sameScene, true);
    const normalized = await page.evaluate(() => {
      const root = document.querySelector("#a svg"),
        box = root.getBoundingClientRect();
      return [1, 2].map((deltaMode) => {
        view.fit();
        const e = new WheelEvent("wheel", {
          deltaY: -1,
          deltaMode,
          clientX: box.x + box.width / 2,
          clientY: box.y + box.height / 2,
          cancelable: true,
        });
        root.dispatchEvent(e);
        return { handled: e.defaultPrevented, zoom: view.state.viewport.zoom };
      });
    });
    for (const item of normalized) {
      assert.equal(item.handled, true);
      assert.ok(item.zoom > 1);
    }
  }));

test("primary-pointer pan follows CSS displacement, captures outside the surface and distinguishes a click", async () =>
  withPage(async (page) => {
    await mountNavigation(page);
    const start = await atomPosition(page);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 45, start.y + 28, { steps: 5 });
    await page.mouse.up();
    const moved = await atomPosition(page);
    assert.ok(Math.abs(moved.x - start.x - 45) < 0.1);
    assert.ok(Math.abs(moved.y - start.y - 28) < 0.1);
    assert.equal(await page.evaluate(() => events.length), 0);
    await page.mouse.click(moved.x, moved.y);
    assert.equal(await page.evaluate(() => events.at(-1).semanticId), "atom:0");
    await page.evaluate(() => view.fit());
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 2, start.y + 1);
    await page.mouse.up();
    assert.equal(await page.evaluate(() => events.length), 2);
    const before = await page.evaluate(() =>
      JSON.stringify(view.state.viewport),
    );
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(700, start.y, { steps: 6 });
    await page.mouse.up();
    assert.notEqual(
      await page.evaluate(() => JSON.stringify(view.state.viewport)),
      before,
    );
    assert.equal(await page.evaluate(() => events.length), 2);
    await page.evaluate(() => view.fit());
    assert.equal(await page.evaluate(() => view.state.viewport.zoom), 1);
  }));

test("keyboard navigation, resized picking and export preserve camera/context while excluding transient indicators", async () =>
  withPage(async (page) => {
    await mountNavigation(page, "tetra-a");
    await page.evaluate(() => {
      view.zoomBy(1.4);
      view.panBy(25, -8);
    });
    const position = await atomPosition(page, "atom:1");
    await page.mouse.click(position.x, position.y);
    await page.keyboard.press("ArrowRight");
    const result = await page.evaluate(() => {
      const camera = view.state.viewport;
      const root = document.querySelector("#a svg"),
        viewBox = root.getAttribute("viewBox");
      const exported = new DOMParser().parseFromString(
        view.exportSvg(),
        "image/svg+xml",
      );
      const metadata = JSON.parse(
        exported.querySelector("metadata").textContent,
      );
      const overlays = ["selection", "focus", "hover"].map(
        (role) =>
          exported.querySelector(`[data-layer="${role}"]`).children.length,
      );
      view.resize(320, 200);
      return {
        camera,
        retained: camera === view.state.viewport,
        viewBox,
        exportBox: exported.documentElement.getAttribute("viewBox"),
        metadata,
        overlays,
        selected: view.state.selection.semanticId,
      };
    });
    assert.equal(result.retained, true);
    assert.equal(result.exportBox, result.viewBox);
    assert.equal(result.selected, "atom:1");
    assert.equal(result.metadata.viewport.camera.zoom, 1.4);
    assert.equal(result.metadata.context.molecule.id, "tetra-a");
    assert.deepEqual(result.overlays, [0, 0, 0]);
    const resized = await atomPosition(page, "atom:1");
    await page.mouse.click(resized.x, resized.y);
    assert.equal(await page.evaluate(() => events.at(-1).semanticId), "atom:1");
    await page.keyboard.press("Home");
    await page.keyboard.press("=");
    const before = await atomPosition(page, "atom:1");
    await page.keyboard.press("d");
    await page.keyboard.press("w");
    const after = await atomPosition(page, "atom:1");
    assert.ok(Math.abs(after.x - before.x - 40) < 0.1);
    assert.ok(Math.abs(after.y - before.y + 40) < 0.1);
    await page.keyboard.press("-");
    assert.equal(await page.evaluate(() => view.state.viewport.zoom), 1);
    await page.keyboard.press("Home");
    assert.equal(
      await page.evaluate(() => view.state.accepted === originalAccepted),
      true,
    );
    await page.evaluate(() => {
      view.zoomBy(1.75);
      view.panBy(18, -8);
    });
    await page.screenshot({ path: join(evidence, "navigation.png") });
  }));

test("contextual hover is deduplicated, bounded and cleared on navigation/replacement with no retired DOM events", async () =>
  withPage(async (page) => {
    await mountNavigation(page);
    const registration = await page.evaluate(() => {
      window.hovers = [];
      window.staleCalls = 0;
      view.subscribeHover((pick) => hovers.push(pick));
      const off = view.subscribeHover(() => staleCalls++);
      off();
      off();
      const removers = Array.from({ length: 31 }, () =>
        view.subscribeHover(() => {}),
      );
      let bounded = false;
      try {
        view.subscribeHover(() => {});
      } catch {
        bounded = true;
      }
      removers.forEach((remove) => remove());
      return bounded;
    });
    assert.equal(registration, true);
    await page.mouse.move(1100, 800);
    const carbon = await atomPosition(page);
    await page.mouse.move(carbon.x, carbon.y);
    await page.mouse.move(carbon.x + 1, carbon.y);
    assert.equal(await page.evaluate(() => hovers.length), 1);
    assert.equal(
      await page.evaluate(() => hovers[0].context.molecule.id),
      "methanol",
    );
    const bond = await page.evaluate(() => {
      const [a, b] = view.state.accepted.scene.atoms.map((a) => a.position);
      const p = new DOMPoint((a.x + b.x) / 2, (a.y + b.y) / 2).matrixTransform(
        document.querySelector("#a svg").getScreenCTM(),
      );
      return { x: p.x, y: p.y };
    });
    await page.mouse.move(bond.x, bond.y);
    assert.equal(await page.evaluate(() => hovers.at(-1).kind), "bond");
    await page.mouse.move(1100, 800);
    assert.equal(await page.evaluate(() => view.state.hover), null);
    await page.mouse.move(carbon.x, carbon.y);
    await page.evaluate(() => view.zoomBy(1.25));
    assert.equal(await page.evaluate(() => hovers.at(-1)), null);
    const next = await atomPosition(page);
    await page.mouse.move(next.x, next.y);
    await page.evaluate(
      () => (document.querySelector("#a").style.width = "400px"),
    );
    await page.waitForFunction(() => view.state.hover === null);
    const afterResize = await atomPosition(page);
    await page.mouse.move(afterResize.x, afterResize.y);
    const replacement = await page.evaluate(async () => {
      const hover = view.state.hover,
        old = document.querySelector("#a svg"),
        camera = view.state.viewport;
      await view.replace({ schemaVersion: 999 });
      const preserved =
        hover === view.state.hover && camera === view.state.viewport;
      await view.replace(corpus[1].document);
      const count = hovers.length,
        state = JSON.stringify(view.state);
      old.dispatchEvent(
        new PointerEvent("pointermove", {
          isPrimary: true,
          pointerType: "mouse",
          clientX: 100,
          clientY: 100,
        }),
      );
      old.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -120, clientX: 100, clientY: 100 }),
      );
      return {
        preserved,
        stale: state === JSON.stringify(view.state) && count === hovers.length,
        hover: view.state.hover,
        zoom: view.state.viewport.zoom,
        staleCalls,
      };
    });
    assert.equal(replacement.preserved, true);
    assert.equal(replacement.stale, true);
    assert.equal(replacement.hover, null);
    assert.equal(replacement.zoom, 1);
    assert.equal(replacement.staleCalls, 0);
  }));

test("canceled and replaced pointer gestures retire cleanly and another instance survives disposal", async () =>
  withPage(async (page) => {
    await mountNavigation(page);
    await page.evaluate(async () => {
      document
        .querySelector("#a svg")
        .addEventListener(
          "pointerdown",
          (e) => (window.pointerId = e.pointerId),
        );
      window.other = api.createMolecularSvgView(document.querySelector("#b"), {
        instanceId: "independent-navigation",
      });
      window.otherHovers = [];
      other.subscribeHover((pick) => otherHovers.push(pick));
      await other.replace(corpus[0].document);
    });
    const start = await atomPosition(page);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const before = await page.evaluate(() => {
      const previous = JSON.stringify(view.state.viewport);
      document
        .querySelector("#a svg")
        .dispatchEvent(
          new PointerEvent("pointercancel", { pointerId, isPrimary: true }),
        );
      return previous;
    });
    await page.mouse.move(start.x + 30, start.y);
    await page.mouse.up();
    assert.equal(
      await page.evaluate(() => JSON.stringify(view.state.viewport)),
      before,
    );
    assert.equal(await page.evaluate(() => events.length), 0);
    for (const reason of ["capture", "blur"]) {
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.evaluate((reason) => {
        if (reason === "capture")
          document.querySelector("#a svg").releasePointerCapture(pointerId);
        else {
          const host = document.querySelector("#b");
          host.tabIndex = 0;
          host.focus();
        }
      }, reason);
      await page.mouse.move(start.x + 25, start.y);
      await page.mouse.up();
      assert.equal(
        await page.evaluate(() => JSON.stringify(view.state.viewport)),
        before,
      );
      assert.equal(await page.evaluate(() => events.length), 0);
    }
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.evaluate(async () => view.replace(corpus[1].document));
    const accepted = await page.evaluate(() =>
      JSON.stringify(view.state.viewport),
    );
    await page.mouse.move(start.x + 30, start.y + 10);
    await page.mouse.up();
    assert.equal(
      await page.evaluate(() => JSON.stringify(view.state.viewport)),
      accepted,
    );
    assert.equal(await page.evaluate(() => events.length), 0);
    const atom = await atomPosition(page);
    await page.mouse.move(atom.x, atom.y);
    await page.mouse.down();
    await page.evaluate(() => view.dispose());
    await page.mouse.up();
    const disposed = await page.evaluate(() => {
      let rejected = 0;
      for (const operation of [
        () => view.fit(),
        () => view.zoomBy(2),
        () => view.panBy(1, 1),
        () => view.subscribeHover(() => {}),
      ]) {
        try {
          operation();
        } catch (error) {
          if (error.code === "disposed") rejected++;
        }
      }
      return {
        rejected,
        hover: view.state.hover,
        viewport: view.state.viewport,
      };
    });
    assert.deepEqual(disposed, { rejected: 4, hover: null, viewport: null });
    const other = await atomPosition(page, "atom:0", "#b");
    await page.mouse.move(other.x, other.y);
    assert.equal(
      await page.evaluate(() => otherHovers.at(-1).instanceId),
      "independent-navigation",
    );
    await page.evaluate(() => other.zoomBy(2));
    assert.equal(await page.evaluate(() => other.state.viewport.zoom), 2);
  }));

test("painted bond edges keep a six CSS-pixel hit tolerance at different camera zooms", async () =>
  withPage(
    async (page) => {
      await mountNavigation(page);
      for (const zoom of [0.5, 1, 8]) {
        const target = await page.evaluate((zoom) => {
          view.fit();
          view.zoomBy(zoom);
          const root = document.querySelector("#a svg"),
            box = root.getBoundingClientRect();
          const [a, b] = view.state.accepted.scene.atoms.map(
            (atom) => atom.position,
          );
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          let point = new DOMPoint(mid.x, mid.y).matrixTransform(
            root.getScreenCTM(),
          );
          view.panBy(
            box.x + box.width / 2 - point.x,
            box.y + box.height / 2 - point.y,
          );
          const matrix = root.getScreenCTM();
          point = new DOMPoint(mid.x, mid.y).matrixTransform(matrix);
          return {
            x: point.x,
            y: point.y,
            radius: (view.state.accepted.scene.strokeWidth * matrix.a) / 2,
          };
        }, zoom);
        await page.mouse.move(target.x, target.y + target.radius + 5);
        assert.equal(await page.evaluate(() => view.state.hover?.kind), "bond");
        await page.mouse.move(target.x, target.y + target.radius + 8);
        assert.equal(await page.evaluate(() => view.state.hover), null);
      }
    },
    { deviceScaleFactor: 2 },
  ));

test("hover callback reentry cannot deliver a retired pick or keep resources after disposal", async () =>
  withPage(async (page) => {
    await mountNavigation(page);
    await page.evaluate(() => {
      window.received = [];
      window.offFirst = view.subscribeHover((pick) => {
        if (pick) view.fit();
      });
      window.offSecond = view.subscribeHover((pick) => received.push(pick));
    });
    const atom = await atomPosition(page);
    await page.mouse.move(atom.x, atom.y);
    assert.deepEqual(await page.evaluate(() => received), [null]);
    await page.evaluate(() => {
      offFirst();
      offSecond();
      view.subscribeHover((pick) => {
        if (pick) view.dispose();
      });
    });
    await page.mouse.move(1100, 800);
    await page.mouse.move(atom.x, atom.y);
    assert.equal(await page.evaluate(() => view.state.lifecycle), "disposed");
    assert.equal(
      await page.locator("[data-molsyssketcher-measurement]").count(),
      0,
    );
  }));

test("native-reference gallery renders all twelve controls in both themes for visual review", async () => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  try {
    for (const theme of ["light", "dark"]) {
      await page.goto(`${server.url}/?theme=${theme}`);
      await page.waitForFunction(() => window.galleryReady);
      assert.equal(await page.locator("article").count(), 12);
      await page.waitForFunction(() =>
        [...document.images].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      await page.screenshot({
        path: join(evidence, `gallery-${theme}.png`),
        fullPage: true,
      });
    }
  } finally {
    await context.close();
  }
});
