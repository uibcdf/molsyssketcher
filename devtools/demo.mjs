import { startBrowserServer } from "./browser-server.mjs";
const server = await startBrowserServer();
console.log(`Molecular SVG comparison: ${server.url}`);
console.log(
  `Interaction diagrams: ${server.url}/examples/interaction-gallery.html`,
);
process.once("SIGINT", async () => {
  await server.close();
  process.exit(0);
});
process.once("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});
