import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { startBrowserServer } from "../../devtools/browser-server.mjs";
const evidence = resolve(
  process.env.MOLSYSSKETCHER_INTERACTION_EVIDENCE_DIR ??
    "/tmp/molsyssketcher-interaction-review",
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
  console.log(`Interaction browser: ${browser.version()}`);
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
        fragments: drawings.length,
        scope: "finite native diagram SVG composition",
      },
      null,
      2,
    ),
  );
  await browser?.close();
  await server?.close();
});

test("the local diagram gallery switches modes/themes and toggles native group summaries", async () =>
  withPage(async (page) => {
    await page.goto(`${server.url}/examples/interaction-gallery.html`);
    await page.waitForFunction(() =>
      document
        .querySelector("#status")
        ?.textContent.includes("ligand-centered"),
    );
    await page.selectOption("#case", "one-water-interface-centered");
    await page.waitForFunction(() =>
      document
        .querySelector("#status")
        .textContent.includes("interface-centered"),
    );
    assert.equal(await page.locator("[data-group-id]").count(), 1);
    await page.click("#grouping");
    await page.waitForFunction(
      () =>
        document.querySelector("#grouping").textContent ===
        "Show group summaries",
    );
    assert.equal(await page.locator("[data-group-id]").count(), 0);
    await page.selectOption("#theme", "dark");
    await page.waitForFunction(
      () =>
        document.querySelector("#diagram > svg")?.style.background ===
        "rgb(21, 32, 43)",
    );
    assert.equal(
      await page.locator("[data-molsyssketcher-measurement]").count(),
      1,
    );
  }));
async function withPage(work) {
  const context = await browser.newContext({
      viewport: { width: 1300, height: 1100 },
    }),
    page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("**/*", (r) =>
    new URL(r.request().url()).origin === server.url ? r.continue() : r.abort(),
  );
  try {
    await page.goto(`${server.url}/tests/browser/harness.html`);
    await page.waitForFunction(() => window.ready);
    await page.evaluate(async () => {
      window.diagrams = (
        await (await fetch("/tests/data/interaction-diagrams.json")).json()
      ).cases;
      document.querySelector("#a").style.cssText = "width:1100px;height:900px";
    });
    await work(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

test("diagram text/export remain inert and callback disposal retires owned resources", async () =>
  withPage(async (page) => {
    const result = await page.evaluate(async () => {
      const input = structuredClone(diagrams[0].input);
      input.parents[0].label = "<img src=x onerror=alert(1)>";
      const view = api.createInteractionSvgView(document.querySelector("#a"), {
        instanceId: "safe",
      });
      await view.replace(input);
      const root = document.querySelector("#a > svg"),
        before = view.exportSvg();
      let first = 0,
        later = 0;
      let remove;
      view.subscribeSelection(() => {
        first++;
        remove();
        view.dispose();
      });
      remove = view.subscribeSelection(() => later++);
      const scene = view.state.accepted.scene;
      view.setSelection(scene.incidences[0].id, scene.generation);
      root.dispatchEvent(
        new MouseEvent("click", { bubbles: true, clientX: 10, clientY: 10 }),
      );
      return {
        literal: before.includes("&lt;img"),
        nodes: root.querySelectorAll("img,script").length,
        first,
        later,
        disposed: view.state.lifecycle,
        probes: document.querySelectorAll("[data-molsyssketcher-measurement]")
          .length,
      };
    });
    assert.equal(result.literal, true);
    assert.equal(result.nodes, 0);
    assert.equal(result.first, 1);
    assert.equal(result.later, 0);
    assert.equal(result.disposed, "disposed");
    assert.equal(result.probes, 0);
  }));

test("nine real native two-mode diagrams have measured labels, complete roles and actual mapped fragment geometry", async () =>
  withPage(async (page) => {
    const received = await page.evaluate(async () => {
      const view = api.createInteractionSvgView(document.querySelector("#a"), {
        instanceId: "native-diagrams",
      });
      const results = [];
      for (const c of diagrams) {
        const result = await view.replace(c.input);
        if (result.status !== "accepted") throw Error(c.id);
        const scene = result.accepted.scene,
          root = document.querySelector("#a > svg");
        if (
          root.querySelectorAll('[data-layer="native-connections"] polyline')
            .length !== scene.incidences.length
        )
          throw Error("Missing native incidence");
        const mask = root.querySelector("mask");
        if (!mask) throw Error("Missing shared label mask");
        const headers = [
          ...root
            .querySelector('[data-layer="diagram-header"]')
            .querySelectorAll("text"),
        ];
        headers.forEach((node, i) => {
          const box = node.getBBox(),
            g = scene.header[i];
          if (Math.abs(box.width - g.box.width) > 0.01)
            throw Error("Header metric mismatch");
        });
        for (const fragment of scene.fragments) {
          const nested = [
            ...root.querySelector('[data-layer="molecular-fragments"]')
              .children,
          ].find((n) => Number(n.dataset.parentIndex) === fragment.parentIndex);
          const matrix = nested.getScreenCTM();
          const world = (x, y) => {
            const p = new DOMPoint(x, y).matrixTransform(matrix);
            return { x: p.x, y: p.y };
          };
          const global = (x, y) => {
            const p = new DOMPoint(
              x + fragment.offset.x,
              y + fragment.offset.y,
            ).matrixTransform(root.getScreenCTM());
            return { x: p.x, y: p.y };
          };
          for (const atom of fragment.scene.atoms) {
            const a = world(atom.position.x, atom.position.y),
              b = global(atom.position.x, atom.position.y);
            if (Math.hypot(a.x - b.x, a.y - b.y) > 0.01)
              throw Error("Fragment/anchor transform differs");
          }
          results.push({
            id: `${c.id}/parent-${fragment.parentIndex}`,
            document: c.input.parents.find(
              (p) => p.parentIndex === fragment.parentIndex,
            ).molecule,
            referenceSmiles: c.references.find(
              (r) => r.parentIndex === fragment.parentIndex,
            ).referenceSmiles,
            sceneAtoms: fragment.scene.atoms.map((a) => ({
              semanticId: a.semanticId,
              position: world(a.position.x, a.position.y),
            })),
            bonds: [
              ...nested.querySelector('[data-layer="chemical-bonds"]').children,
            ].map((group) => ({
              semanticId: group.dataset.bondId,
              shapes: [...group.children].map((shape) => ({
                tag: shape.localName,
                points:
                  shape.localName === "line"
                    ? [
                        world(
                          Number(shape.getAttribute("x1")),
                          Number(shape.getAttribute("y1")),
                        ),
                        world(
                          Number(shape.getAttribute("x2")),
                          Number(shape.getAttribute("y2")),
                        ),
                      ]
                    : shape
                        .getAttribute("points")
                        .split(" ")
                        .map((p) => {
                          const [x, y] = p.split(",").map(Number);
                          return world(x, y);
                        }),
              })),
            })),
          });
        }
      }
      view.dispose();
      return results;
    });
    drawings.push(...received);
    assert.equal(received.length, 26);
  }));

test("native roles, repeated mediators and chemical atoms are inspectable after CSS resize", async () =>
  withPage(async (page) => {
    await page.evaluate(async () => {
      window.view = api.createInteractionSvgView(document.querySelector("#a"), {
        instanceId: "picks",
      });
      window.events = [];
      view.subscribeSelection((p) => events.push(p));
      await view.replace(
        diagrams.find((c) => c.id === "two-water-interface-centered").input,
      );
    });
    for (const width of [560, 1100]) {
      const point = await page.evaluate((width) => {
        view.resize(width, 760);
        const root = document.querySelector("#a > svg"),
          r = view.state.accepted.scene.incidences[2].row,
          p = new DOMPoint(r.x + 30, r.y + 12).matrixTransform(
            root.getScreenCTM(),
          );
        return { x: p.x, y: p.y };
      }, width);
      await page.mouse.click(point.x, point.y);
      const pick = await page.evaluate(() => events.at(-1));
      assert.equal(pick.kind, "participant");
      assert.equal(pick.member.role, "leg_1_acceptor");
      assert.equal(pick.native.parents.length, 4);
    }
    const atom = await page.evaluate(() => {
      const s = view.state.accepted.scene,
        f = s.fragments[1],
        a = f.scene.atoms[0],
        p = new DOMPoint(
          a.position.x + f.offset.x,
          a.position.y + f.offset.y,
        ).matrixTransform(document.querySelector("#a > svg").getScreenCTM());
      return {
        x: p.x,
        y: p.y,
        predicted: api.hitTestInteractionDiagramScene(
          s,
          { x: p.x, y: p.y },
          document.querySelector("#a > svg").getScreenCTM(),
        ).kind,
      };
    });

    assert.equal(atom.predicted, "molecular");
    await page.mouse.click(atom.x, atom.y);
    const pick = await page.evaluate(() => events.at(-1));
    assert.equal(pick.kind, "molecular");
    assert.equal(pick.parentIndex, 1);
    assert.equal(pick.memberships.length, 2);
  }));

test("keyboard and generation-bound API inspect every native observation without source mutation", async () =>
  withPage(async (page) => {
    await page.evaluate(async () => {
      window.view = api.createInteractionSvgView(document.querySelector("#a"), {
        instanceId: "keys",
      });
      window.events = [];
      view.subscribeSelection((p) => events.push(p));
      await view.replace(
        diagrams.find((c) => c.id === "hydrogen-bonds-interface-centered")
          .input,
      );
      window.original = JSON.stringify(view.state.accepted.document);
    });
    await page.locator("#a > svg").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => events.at(-1).native.memberships.length),
      3,
    );
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(
        () => events.at(-1).native.memberships[0].occurrenceIndex,
      ),
      1,
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => view.state.selection), null);
    const state = await page.evaluate(() => {
      const s = view.state.accepted.scene;
      view.setSelection(s.incidences[0].id, s.generation);
      let refused = false;
      try {
        view.setSelection(s.incidences[0].id, s.generation - 1);
      } catch {
        refused = true;
      }
      return {
        refused,
        unchanged: original === JSON.stringify(view.state.accepted.document),
        selected: view.state.selection.member.role,
      };
    });
    assert.equal(state.refused, true);
    assert.equal(state.unchanged, true);
    assert.equal(state.selected, "donor");
  }));

test("atomic failed/burst replacement retires old DOM events and preserves independent instances", async () =>
  withPage(async (page) => {
    const state = await page.evaluate(async () => {
      const a = document.querySelector("#a"),
        b = document.querySelector("#b");
      const sentinel = document.createElement("span");
      sentinel.textContent = "Host";
      a.append(sentinel);
      const first = api.createInteractionSvgView(a, { instanceId: "one" }),
        second = api.createInteractionSvgView(b, { instanceId: "two" });
      let calls = 0;
      first.subscribeSelection(() => calls++);
      const accepted = await first.replace(diagrams[0].input);
      await second.replace(diagrams.at(-1).input);
      const old = a.querySelector("svg"),
        before = first.state.accepted;
      const bad = structuredClone(diagrams[0].input);
      bad.parents[0].molecule.context.chemicalState = "stale";
      const failure = await first.replace(bad),
        retained =
          first.state.accepted === before && a.querySelector("svg") === old;
      const results = await Promise.all(
        diagrams.slice(1, 5).map((c) => first.replace(c.input)),
      );
      old.dispatchEvent(
        new MouseEvent("click", { bubbles: true, clientX: 0, clientY: 0 }),
      );
      first.dispose();
      first.dispose();
      const other = second.state.accepted.document.id,
        host = sentinel.parentNode === a;
      second.dispose();
      return {
        accepted: accepted.status,
        failure: failure.status,
        retained,
        results: results.map((r) => r.status),
        calls,
        other,
        host,
        probes: document.querySelectorAll("[data-molsyssketcher-measurement]")
          .length,
      };
    });
    assert.equal(state.accepted, "accepted");
    assert.equal(state.failure, "failed");
    assert.equal(state.retained, true);
    assert.equal(state.results.at(-1), "accepted");
    assert.ok(state.results.slice(0, -1).every((s) => s === "superseded"));
    assert.equal(state.calls, 0);
    assert.equal(state.host, true);
    assert.equal(state.probes, 0);
  }));

test("light/dark two-mode gallery and SVG export retain native context while excluding transient state", async () =>
  withPage(async (page) => {
    for (const theme of ["light", "dark"]) {
      await page.evaluate(async (theme) => {
        window.view = api.createInteractionSvgView(
          document.querySelector("#a"),
          { instanceId: `gallery-${theme}`, theme },
        );
        await view.replace(
          diagrams.find((c) => c.id === "one-water-interface-centered").input,
        );
        const s = view.state.accepted.scene;
        view.setSelection(s.groups[0].id, s.generation);
      }, theme);
      const exported = await page.evaluate(() => {
        const doc = new DOMParser().parseFromString(
            view.exportSvg(),
            "image/svg+xml",
          ),
          m = JSON.parse(doc.querySelector("metadata").textContent);
        return {
          kind: m.kind,
          analysis: m.analysis,
          units: m.measureUnits,
          selection: doc.querySelector('[data-layer="diagram-selection"]')
            .children.length,
          fonts: doc.documentElement.outerHTML.includes("@font-face"),
        };
      });
      assert.equal(exported.kind, "molsyssketcher-interaction-figure-context");
      assert.equal(exported.selection, 0);
      assert.equal(exported.units.leg_1_dha_angle, "radians");
      await page.screenshot({ path: join(evidence, `interface-${theme}.png`) });
      await page.evaluate(() => view.dispose());
      await page.evaluate(async (theme) => {
        window.view = api.createInteractionSvgView(
          document.querySelector("#a"),
          { instanceId: `ligand-${theme}`, theme },
        );
        await view.replace(diagrams[0].input);
      }, theme);
      await page.screenshot({ path: join(evidence, `ligand-${theme}.png`) });
      await page.evaluate(() => view.dispose());
    }
  }));
