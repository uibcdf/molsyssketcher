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

async function withPage(work) {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
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
        const bonds = [...root.querySelectorAll("[data-bond-id]")].map(
          (group) => ({
            semanticId: group.getAttribute("data-bond-id"),
            shapes: [...group.children].map((shape) => ({
              tag: shape.localName,
              ...(shape.localName === "line"
                ? {
                    points: [
                      {
                        x: +shape.getAttribute("x1"),
                        y: +shape.getAttribute("y1"),
                      },
                      {
                        x: +shape.getAttribute("x2"),
                        y: +shape.getAttribute("y2"),
                      },
                    ],
                  }
                : {
                    points: [...shape.points].map((p) => ({ x: p.x, y: p.y })),
                  }),
            })),
          }),
        );
        results.push({
          id: item.id,
          document: item.document,
          referenceSmiles: item.reference.isomericSmiles,
          sceneAtoms: scene.atoms,
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
