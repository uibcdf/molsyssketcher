import { readFileSync } from "node:fs";
import {
  createInteractionPageController,
  inspectInteractionPage,
  buildInteractionTopology,
  inspectInteractionTopology,
} from "../dist/index.js";

const corpus = JSON.parse(
  readFileSync(
    new URL("../tests/data/molsysmt-interactions.json", import.meta.url),
  ),
);
const controller = createInteractionPageController({
  instanceId: "native-inspection",
});
const participants = JSON.parse(
  readFileSync(
    new URL("../tests/data/molsysmt-participants.json", import.meta.url),
  ),
);
let generation = 0;
for (const { id, projection } of [...corpus.cases, ...participants.cases]) {
  const result = await controller.replace(projection);
  if (result.status !== "accepted")
    throw new Error(`Rejected native control: ${id}`);
  const inspection = inspectInteractionPage(result.snapshot.document);
  const topology = buildInteractionTopology(result.snapshot.document, {
    instanceId: "example-topology",
    generation: ++generation,
    groups:
      id === "one-water"
        ? [
            {
              id: "mediator",
              label: "Water",
              members: [
                { occurrenceIndex: 0, participantIndex: 2 },
                { occurrenceIndex: 0, participantIndex: 3 },
              ],
            },
          ]
        : [],
  });
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
      presentationNodes: topology.nodes.length,
      groupedMediatorRoles:
        id === "one-water"
          ? inspectInteractionTopology(
              topology,
              topology.nodes[0].id,
            ).memberships.map((m) => m.role)
          : [],
    }),
  );
}
controller.dispose();
