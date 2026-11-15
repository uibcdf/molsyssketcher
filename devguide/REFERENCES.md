# References and coordination

The current project has two primary pillars. Read
[INTERACTION_DIAGRAMS.md](INTERACTION_DIAGRAMS.md) for the accepted product
direction. The optional-module assessment is retained as
[history](archive/interaction_diagrams_inclusion_assessment_20261114.md).

Reviewed for this design on 2026-11-14. These links support architectural
reasoning, not executed MolSysSketcher compatibility or performance claims.
Live branch links are references; record immutable source/artifact identities
before adapting code or qualifying a provider.

The [conceptual review](CONCEPTUAL_REVIEW.md) and its
[source manifest](evidence/conceptual_review_20261114.json) record a subsequent
selective inspection at immutable commits. Those sources were not incorporated
into this project and were not installed or executed.

## Project coordination

- [MolSysSuite #199](https://github.com/uibcdf/molsyssuite/issues/199):
  proposed reusable 2D component, scientific/scene split and admission.
  Earlier comments compare third-party engines; the later maintainer direction
  is an own scene with delegated chemistry and staged editing, recorded in the
  [2026-11-14 coordination update](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6885763863).
- [Sabueso #154](https://github.com/uibcdf/sabueso/issues/154):
  interactive explorer and first consumer receiving.
- [MolSysViewer #387](https://github.com/uibcdf/molsysviewer/issues/387):
  earlier source-bound 2D depiction request.
- [MolSysViewer #368](https://github.com/uibcdf/molsysviewer/issues/368):
  supported live embedding/current-model boundary for the separate 3D viewer.

## Reference implementations

| Reference | What was inspected / useful learning |
| --- | --- |
| [SmilesDrawer](https://github.com/reymond-group/smilesDrawer) | Molecular drawing project; legibility, themes and layout/label handling |
| [SmilesDrawer DrawerBase](https://github.com/reymond-group/smilesDrawer/blob/master/src/DrawerBase.js) | Graph processing, ring handling, positioning, overlap resolution and stereo annotation; drawing quality involves more than rendering primitives |
| [SmilesDrawer SvgDrawer](https://github.com/reymond-group/smilesDrawer/blob/master/src/SvgDrawer.js) | SVG edge/label drawing and wedge/hashed-wedge presentation |
| [SmilesDrawer documentation](https://reymond-group.github.io/smilesDrawer/getting-started/) | Drawing, themes and highlighted/weighted structures |
| [Ketcher](https://github.com/epam/ketcher) | Molecular editor architecture and interactive behavior |
| [Ketcher editor history](https://github.com/epam/ketcher/blob/master/packages/ketcher-core/src/application/editor/EditorHistory.ts) | Commands, undo/redo and editor-state responsibilities |
| [Ketcher API](https://github.com/epam/ketcher/blob/master/documentation/api.md) | Asynchronous format export, events and integration surface |
| [RDKit.js documentation](https://github.com/rdkit/rdkit-js/blob/master/readme.md) | Official JS distribution, MinimalLib subset, initialization, worker use and WASM object lifetime |
| [RDKit MinimalLib](https://github.com/rdkit/rdkit/tree/master/Code/MinimalLib) | Actual native bindings/build underlying the JS distribution |
| [RDKit.js molecule API](https://rdkitjs.com/docs/interfaces/Mol.html) | Available coordinates, alignment, drawing and chemical serialization methods; inventory actual chosen-version capabilities |
| [RDKit depiction API](https://www.rdkit.org/docs/source/rdkit.Chem.rdDepictor.html) | 2D layout generation and alignment options |
| [RDKit drawing API](https://www.rdkit.org/docs/source/rdkit.Chem.Draw.rdMolDraw2D.html) | Depiction controls and drawing references |
| [RDKit feature definitions](https://www.rdkit.org/docs/RDKit_Book.html#the-feature-definition-file-format) | Definition-dependent scientific features and associated atom scope |
| [RDKit partial charges](https://www.rdkit.org/docs/source/rdkit.Chem.rdPartialCharges.html) | Method/options and parameter-failure behavior requiring explicit result applicability |

Alternative existing renderers/editors remain fallback options if maintaining
an own renderer proves unjustified. Their earlier source screen is recorded
in suite #199 and Sabueso's
[2D component proposal](https://github.com/uibcdf/sabueso/blob/main/devguide/pending_proposals/interactive_2d_component_0160.md).
That consumer document predates the repository and current staged direction.

## Governing and provider references

- [MolSysSuite component guide](https://github.com/uibcdf/molsyssuite/blob/main/MOLSYSSUITE_GUIDE.md).
- [Starter and admission](https://github.com/uibcdf/molsyssuite/blob/main/devguide/new_component_starter_kit.md).
- [Modular reusable tools](https://github.com/uibcdf/molsyssuite/blob/main/devguide/modular_reusable_tools.md).
- [Optional engine contract](https://github.com/uibcdf/molsyssuite/blob/main/devguide/optional_engine_integration.md).
- [Development workspace](https://github.com/uibcdf/molsyssuite/blob/main/devguide/development_workspace.md).
- [Cross-component feedback](https://github.com/uibcdf/molsyssuite/blob/main/devguide/cross_component_feedback.md).
- [MolSysMT](https://github.com/uibcdf/molsysmt): inspect supported interoperability and scientific APIs before proposing missing capabilities.
- [MolSysViewer architecture](https://github.com/uibcdf/molsysviewer/blob/main/devguide/architecture.md): embedding, runtime ownership and explicit model correspondence.

The initial central guide/registry inspection used commit
[e4d97ba1ac5341aa2d1cd50b56096098e59bb940](https://github.com/uibcdf/molsyssuite/tree/e4d97ba1ac5341aa2d1cd50b56096098e59bb940).
It did not register MolSysSketcher. Later policy/guide revisions require their
own inspection and adoption; this reference does not freeze live linked rules.

## Native interaction and diagram contracts

- [MolSysMT interaction API](https://github.com/uibcdf/molsysmt/blob/main/devguide/interactions_api.md):
  native participants, observation identity, criteria, quantities and coverage.
- [Query semantics](https://github.com/uibcdf/molsysmt/blob/main/devguide/interactions_query_semantics.md):
  bounded/source-aware interpretation of result subsets.
- [Viewer consumer contract](https://github.com/uibcdf/molsysviewer/blob/main/devguide/interactions_compatibility_contract.md):
  scoped actions, generations and received scientific boundaries.
- [BindingMT native interface](https://github.com/uibcdf/bindingmt/blob/main/devguide/binding_interface_native_interactions.md):
  binding-specific composition and actual profile limits.
- [ProLIF examples](https://prolif.readthedocs.io/en/stable/notebooks/md-ligand-protein.html):
  interactive diagrams and explicit single-frame/aggregate distinctions.

The [two-pillar adoption receipt](evidence/two_primary_pillars_20261114.json)
records the plan expansion. The earlier 38-task receipt remains a dated
source-inspection snapshot, not the current ledger.
