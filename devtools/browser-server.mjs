import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
export async function startBrowserServer() {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const path =
      pathname === "/" ? "/examples/molecular-gallery.html" : pathname;
    const allowed =
      /^\/dist\/[a-z-]+\.js$/.test(path) ||
      [
        "/examples/molecular-gallery.html",
        "/tests/browser/harness.html",
        "/tests/data/rdkit-prepared.json",
      ].includes(path);
    if (!allowed) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      response.setHeader(
        "Content-Type",
        path.endsWith(".js")
          ? "application/javascript"
          : path.endsWith(".json")
            ? "application/json"
            : "text/html",
      );
      response.end(readFileSync(resolve(root, `.${path}`)));
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, close: () => new Promise((resolve) => server.close(resolve)) };
}
