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
An experimental read-only molecular SVG surface now renders prepared documents,
with measured labels, semantic selection/hover, pan/zoom, fit/resize and graphical export.
The first supplied interaction SVG surface now composes both diagram modes;
production provider/host adapters and full view qualification remain pending.
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
route and native chemical round trips.

For the first molecular SVG controls, run `npx playwright install --with-deps chromium`
and `npm run test:browser`. `npm run demo` prints a local comparison-gallery URL.
See the [molecular SVG profile](devguide/MOLECULAR_SVG_PROFILE.md) for the API,
actual browser/native drawing checks and remaining limits. This finite surface
does not complete either primary view or qualify Qt, a public package or all platforms.

The [internal edit/undo experiment](devguide/EDITOR.md#received-p25-experiment-2026-11-15)
receives the bounded P2.5 architectural checks with native RDKit fixtures and
actual browser restoration. `npm run demo` links to it. Experimental tooling is
excluded from distribution; production editing remains the final stage.

The [first native interaction profile](devguide/MOLSYSMT_INTERACTIONS_PROFILE.md)
receives bounded MolSysMT pages with exact declared parent mappings,
role-bearing participants, native provenance and explicit coverage. In a
provisioned source environment, `npm run test:interactions` exercises actual
native calculations and Python quantity verification. TypeScript retains
quantity records opaquely; full interaction grammar and production transport
remain pending.

The [native participant topology](devguide/INTERACTION_TOPOLOGY_PROFILE.md)
now preserves compound rings, directed hydrogen bonds and one/two-water paths
through explicit reversible grouping. Each native observation remains distinct,
with complete roles, atom membership and source context. The first
[two-mode SVG composition](devguide/INTERACTION_SVG_PROFILE.md) reuses prepared
chemical fragments and offers native/chemical selection, exact context and
figure export. `npm run demo` links to its gallery. Full layout/quantitative
grammar and consumer/Qt receiving remain pending.
