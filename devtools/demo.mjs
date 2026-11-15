import { startBrowserServer } from "./browser-server.mjs";
const server = await startBrowserServer();
console.log(`Molecular SVG comparison: ${server.url}`);
process.once("SIGINT", async () => {
  await server.close();
  process.exit(0);
});
process.once("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});
