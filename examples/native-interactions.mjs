import { readFileSync } from "node:fs";
import {
  createInteractionPageController,
  inspectInteractionPage,
} from "../dist/index.js";

const corpus = JSON.parse(
  readFileSync(
    new URL("../tests/data/molsysmt-interactions.json", import.meta.url),
  ),
);
const controller = createInteractionPageController({
  instanceId: "native-inspection",
});
for (const { id, projection } of corpus.cases) {
  const result = await controller.replace(projection);
  if (result.status !== "accepted")
    throw new Error(`Rejected native control: ${id}`);
  const inspection = inspectInteractionPage(result.snapshot.document);
  console.log(
    JSON.stringify({
      control: id,
      coverage: inspection.coverage,
      partial: inspection.partial,
      producer: projection.native.page.software,
      method: projection.native.page.method,
      participants: inspection.observations.map((observation) =>
        observation.participants.map((participant) => ({
          role: participant.role,
          atoms: participant.atoms.map((atom) => ({
            parent: atom.parentIndex,
            id: atom.atomId,
          })),
        })),
      ),
      quantities: inspection.quantities,
    }),
  );
}
controller.dispose();
