# Project purpose and scope

## Product

MolSysSketcher is a reusable scientific 2D component with two equally important
product pillars:

1. Molecular representation and exploration, followed by chemical editing.
2. Multi-participant molecular interaction diagrams and investigation.

Both are core capabilities, with independently usable view surfaces and their
own acceptance. They share a controllable visual foundation: legible molecules,
exact selections, typed scientific layers, custom shapes and dependable embedding.

The project direction is an original TypeScript document/scene/interaction
implementation. Existing supported chemical tools supply interpretation,
serialization, layout and calculations. Study SmilesDrawer, Ketcher and RDKit
for design and implementation lessons; review licenses before adapting code.

## Users and journeys

- A researcher opens a Sabueso molecule, inspects its 2D structure, selects an
  atom or region and follows associated information without altering the source.
- A scientific application displays a provider-calculated property with its
  method, units, applicability and exact atom correspondence.
- A researcher opens a ligand complex or a two-sided peptide/protein interface,
  inspects native observations and follows exact participants into 3D.
- A researcher compares poses, methods or frames, inspects evaluated coverage
  and saves a reproducible interaction diagram.
- A future editing user prepares an explicit molecular draft and submits a
  validated snapshot to a separately owned workflow.
- A later dashboard displays many structures using lazy rendering and bounded
  caches. That workload has its own acceptance and performance measurements.

The host controls navigation, panels, toolbars and scientific intent. The
component supplies presentation and interaction without imposing a complete
application layout or an AI assistant.

## Ownership

| Responsibility | Owner or proposed boundary |
| --- | --- |
| Portable 2D document, scene, hit testing, selection, shapes and lifecycle | MolSysSketcher project |
| Interaction-diagram projection, visual grammar, constrained layout, comparison presentation and reproducible figures | MolSysSketcher project, consuming native scientific results |
| Molecular-system interoperability, manipulation and general analysis | MolSysMT and supported providers |
| Chemical interpretation, chemical formats and 2D-coordinate generation | Explicit selected chemical provider, initially evaluating RDKit routes |
| Binding and pharmacophore definitions or calculations | BindingMT, PharmacophoreMT or the relevant domain owner |
| Original source assertions, ambiguity and research navigation | Sabueso |
| 3D scene and supported 3D embedding | MolSysViewer |
| Shared ownership decision and component admission | MolSysSuite, under #199 |

This table is the proposed project split. Central registration and a received
shared contract remain separate work. A capability listed under an owner is
not proof that the needed public API already exists.

## Initial product profiles

The molecular profile begins with a bounded small-molecule corpus, including
disconnected fragments such as salts where admitted. Build selection,
pan/zoom, tooltips, layers and export before production chemical editing.
Preserve source declarations, charges, isotopes and supported stereochemistry.
Declare unsupported features instead of silently simplifying them.

The interaction profile includes ligand-centered and interface-centered modes,
compound/mediated participants, explicit coverage and a residue-level
peptide/protein or two-sided interface. Finite chemical/family matrices,
quantitative profiles and resource budgets are received explicitly. See
[the interaction contract](INTERACTION_DIAGRAMS.md).

Reactions, unrestricted polymers/query chemistry, Markush coverage, arbitrary
biomolecular scale and a complete publishing editor remain future scope.
Drawn 2D coordinates do not establish a 3D conformer or physical geometry.

There is no new Rust kernel requirement. Reuse Rust-backed capabilities already
owned by MolSysMT or MolSysViewer through supported boundaries.

## Success

A joint exploration delivery receives both finite minimum profiles: useful
molecular exploration and interaction-diagram investigation. Each needs real
scientific/visual controls, exact selections, appropriate layers, reproducible
output and actual host integration. Replacement/disposal must preserve source
meaning and avoid stale state/resource leaks.

Report shared-foundation, molecular, interaction and editor readiness
separately. A molecular-only intermediate milestone does not complete the
joint baseline. Equal importance does not require duplicate infrastructure.

Sabueso 0.16.0 is the first consumer target, not MolSysSketcher's version number.
It should receive the exploration capability independently of the later editor.
Platform support, package distribution and editing readiness each require their
own evidence and acceptance.

## Vocabulary

Molecular View and Interaction View are working product names, not implemented
class signatures. A molecular interaction is a scientific observation supplied
by its owner; pointer/keyboard interaction is UI behavior. A diagram document
is a visual projection, not a new scientific result or molecular-system codec.
