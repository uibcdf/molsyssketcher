import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
function markdownFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? markdownFiles(path)
      : path.endsWith(".md")
        ? [path]
        : [];
  });
}
function anchors(text) {
  const counts = new Map();
  return new Set(
    [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, heading]) => {
      const base = heading
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_\s-]/gu, "")
        .trim()
        .replace(/\s/g, "-");
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      return count ? `${base}-${count}` : base;
    }),
  );
}
const files = [
  join(root, "README.md"),
  join(root, "AGENTS.md"),
  ...markdownFiles(join(root, "devguide")),
];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  assert.doesNotMatch(content, /[\t ]+$/m, `Trailing whitespace: ${file}`);
  for (const [, target] of content.matchAll(/\[[^\]\n]+\]\(([^\s)]+)\)/g)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    const [path, anchor] = target.split("#");
    const destination = path
      ? resolve(dirname(file), decodeURIComponent(path))
      : file;
    assert.ok(existsSync(destination), `Missing link in ${file}: ${target}`);
    if (anchor && destination.endsWith(".md"))
      assert.ok(
        anchors(readFileSync(destination, "utf8")).has(
          decodeURIComponent(anchor),
        ),
        `Missing anchor in ${file}: ${target}`,
      );
  }
}
const plan = readFileSync(
  join(root, "devguide/IMPLEMENTATION_PLAN.md"),
  "utf8",
);
const checkpoint = readFileSync(join(root, "devguide/CHECKPOINT.md"), "utf8");
const tasks = [
  ...plan.matchAll(
    /^\| ([PI]\d+\.\d+) \| (todo|active|partial|blocked|done) \|/gm,
  ),
];
assert.equal(tasks.length, 69);
assert.equal(new Set(tasks.map(([, id]) => id)).size, 69);
const counts = Object.fromEntries(
  ["done", "partial", "active", "blocked", "todo"].map((status) => [
    status,
    tasks.filter(([, , value]) => value === status).length,
  ]),
);
const summary = `${counts.done} done, ${counts.partial} partial and ${counts.todo} todo`;
assert.ok(
  plan.includes(`69 microsteps: ${summary}`),
  "Plan summary disagrees with the task ledger.",
);
assert.ok(
  checkpoint.includes(`69 microsteps: ${summary}`),
  "Checkpoint summary disagrees with the task ledger.",
);
console.log(
  `Documentation passed: ${files.length} files; 69 unique tasks; ${summary}.`,
);
