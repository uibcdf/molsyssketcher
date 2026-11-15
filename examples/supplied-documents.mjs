import {
  createMolecularController,
  createInteractionController,
} from "../dist/index.js";
import { molecule, interaction } from "../tests/fixtures.mjs";

// Executable contract example using explicitly synthetic data, with no live engine.
const molecular = createMolecularController({
  instanceId: "example-molecular",
});
const diagram = createInteractionController({
  instanceId: "example-interaction",
});
const acceptedMolecule = await molecular.replace(molecule());
const acceptedDiagram = await diagram.replace(interaction());
if (
  acceptedMolecule.status !== "accepted" ||
  acceptedDiagram.status !== "accepted"
) {
  throw new Error("The supplied contract fixtures were not accepted.");
}
const failure = await molecular.replace({ schemaVersion: 99 });
console.log(
  JSON.stringify(
    {
      molecule: acceptedMolecule.snapshot.document.id,
      original: acceptedMolecule.snapshot.document.original.data,
      diagramMode: acceptedDiagram.snapshot.document.mode,
      exactParents: acceptedDiagram.snapshot.document.parents,
      failedReplacement: failure.status,
      preservedAcceptedGeneration: molecular.state.accepted.generation,
    },
    null,
    2,
  ),
);
molecular.dispose();
diagram.dispose();
