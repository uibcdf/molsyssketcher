# MolSysSketcher

An extensible scientific 2D component with two primary capabilities:
molecular representation/exploration and molecular interaction diagrams.
Chemical editing follows in a later stage.

The project direction is a framework-independent TypeScript component with its
own scene and interaction layer. RDKit and supported MolSysMT operations provide
chemical interpretation and calculation. SmilesDrawer, Ketcher and RDKit are
references for learning and evaluation; this description does not incorporate
their code or select their licenses for this repository.

Both primary views share scene primitives and scientific boundaries, and have
their own functional acceptance. Interaction diagrams include ligand-centered
and two-sided interface views. Production chemical editing comes last, with
an early feasibility check to protect that path.

**Current status:** an experimental TypeScript document/transaction foundation
accepts supplied prepared molecular data and exact interaction-result references.
Rendering, production provider/host adapters and the two visual surfaces remain pending.
An explicit [RDKit source-development route](devguide/RDKIT_PROVIDER.md) now
prepares a finite real-provider corpus for this foundation; it is separate from
the shipped web runtime and the future production host adapter.
There is no published package, selected release version or qualified platform. Formal
MolSysSuite admission remains pending under
[MolSysSuite #199](https://github.com/uibcdf/molsyssuite/issues/199).

Start with the [developer guide](devguide/README.md), the
[current checkpoint](devguide/CHECKPOINT.md) and the
[implementation plan](devguide/IMPLEMENTATION_PLAN.md).

Develop with Node **24.22.1** and npm **11.19.1**:

```bash
npm ci
npm run check
npm run pack:check
npm run pack:conda:check
npm run example
```

The private ESM package includes TypeScript declarations and has no runtime
dependencies. Conda is the intended public distribution route; the
[draft resource recipe](devtools/conda-build/README.md) has a local prefix-layout
check, with actual Conda archive/publication receiving still pending. npm is
the development/build boundary. Versions use exactly `X.Y.Z`; `0.0.0` is a
development placeholder. See the
[supplied-input profile](devguide/SUPPLIED_INPUT_PROFILE.md) for the implemented
API and its limits. The original example and synthetic contract tests do not
establish chemical or visual correctness. Real-provider preparation receiving
is described below. Licensed under MIT.

For the selected RDKit source route in a provisioned Python environment, run
`npm run test:provider` and `npm run corpus:check`. The 12-case native corpus is
also received by the Node tests. These controls qualify the declared preparation
route and native chemical round trips; our own renderer remains pending.
