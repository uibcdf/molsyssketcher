# Decisions

Recorded: 2026-11-14. These entries describe maintainer-agreed project direction
and provisional engineering choices. Implementation and qualification stay in
the task ledger.

| ID | State | Decision and rationale | Reassessment |
| --- | --- | --- | --- |
| D01 | accepted direction | Keep reusable 2D exploration/editing in MolSysSketcher, separate from MolSysViewer's 3D core | Central ownership/admission under suite #199 |
| D02 | accepted direction | Build the document, scene and interaction in TypeScript, learning from SmilesDrawer, Ketcher and RDKit | P2 measures visual correctness and maintenance cost; existing tools remain alternatives |
| D03 | accepted direction | Delegate chemical interpretation, formats, chemical layout and scientific calculations to supported providers, with RDKit as initial reference | Actual provider route and capability inventory in P0.6/P1.2 |
| D04 | accepted direction | Keep the web core independent of React, Qt, notebooks and a particular desktop shell | Add thin consumer adapters only for concrete needs |
| D05 | accepted direction | Deliver viewer, exploration and scientific integration before production editing | Early editing-feasibility check P2.5; full editor P6 |
| D06 | provisional choice | Evaluate SVG as the first own renderer and RDKit depictions as references | P2/P5 correctness, quality and performance results |
| D07 | accepted boundary | Preserve original source declarations and distinguish layout, chemistry, calculated layers and drafts | Every document/provider/consumer contract change |
| D08 | accepted boundary | Require explicit model correspondence for coordinated 2D/3D selection | Actual provider receiving; absent mapping remains visible |
| D09 | accepted planning | Use stages/microsteps and evidence-based checkpoints; do not equate documentation with implementation | Every task closeout and milestone review |
| D10 | partially resolved | D19 selects license/toolchain/private package layout and D22 selects a first RDKit source route; production transport/adapter, actual platform claims and public release version remain open | P0.4/P0.6 and P5 |
| D11 | proposed refinement | Separate chemical interpretation, prepared depiction and scene with explicit generated/display mappings | P1.6; source basis in CONCEPTUAL_REVIEW.md |
| D12 | proposed refinement | One live-document writer, atomic candidate acceptance and independent lifecycle/document/request states | P1.1/P1.7 |
| D13 | proposed refinement | Use monotonic generations, destination intent and declared dependencies for async applicability, including undo | P1.4/P2.5 |
| D14 | proposed refinement | Declare per-operation feature/loss capabilities and geometry/stereo preservation rules | P0.6/P1.3/P2 |
| D15 | proposed refinement | Scientific layers declare conformer/frame dependencies and quantitative color/missing-value policy | P3.3 |
| D16 | accepted direction | Molecular representation and interaction diagrams are equal primary product pillars; the earlier optional-module framing is superseded | Maintainer instruction, 2026-11-14; formal suite admission remains separate |
| D17 | accepted planning | Reuse shared infrastructure while maintaining independent minimum profiles, evidence and readiness for both pillars | P0.6, I1-I5, joint P4/P5 |
| D18 | proposed detail | Interaction View supports ligand-centered and interface-centered composition, investigation and reproducible documents | Finite schemas, families and numerical budgets received in their owning tasks |
| D19 | accepted, 2026-11-15 | Maintainer selected MIT; first private package uses Node 24.22.1, npm 11.19.1, TypeScript 5.9.3, Prettier 3.6.2, native Node tests, ESM and declarations | Component #1; actual browser/provider/artifact milestones |
| D20 | bounded implementation | Start with supplied attributed documents, explicit bijective preparation and shared replacement/reference controls; no live engine is loaded implicitly | SUPPLIED_INPUT_PROFILE.md; extend using actual provider receiving |
| D21 | accepted direction, 2026-11-15 | Maintainer selects Conda distribution and exact X.Y.Z library versions without prefixes/suffixes; generic-resource recipe is provisional until suite profile and actual archive receiving | Suite #199 and P5.3/P5.4; no publication from the draft recipe |
| D22 | bounded implementation, 2026-11-15 | Receive explicit Python RDKit source preparation before an own scene: retain explicit H, disable generated chiral H, preserve actual origin maps and native references; refuse outside-profile chemistry | Component #2 and RDKIT_PROVIDER.md; production transport/adapter distribution and richer profiles remain pending |
| D23 | bounded implementation, 2026-11-15 | Use own immutable SVG primitives with actual generic sans-serif metrics, positive fit transforms and scoped semantic selection; receive actual DOM bond geometry through native RDKit independently of source style tags | Component #3 and MOLECULAR_SVG_PROFILE.md; crowded structures, pan/zoom, full accessibility, Qt and complete primary views remain pending |
| D24 | bounded implementation, 2026-11-15 | Keep viewport camera/hover separate from accepted chemistry and immutable scene; bounded positive pan/zoom/fit preserve identity, export records current crop, contextual hover retires with navigation/lifecycle | Component #4 and MOLECULAR_SVG_PROFILE.md; pinch, dense scenes, native interaction composition and complete host receiving remain pending |
| D25 | bounded implementation, 2026-11-15 | P2.5 uses unshipped typed native drafts; PreparedMolecule remains a read-only projection, native owners supply bond orders and recompute H/labels; generation-bound read-only selection permits host/history restoration | Component #5 and EDITOR.md; production graph/history/provider contracts remain P6 |
| D26 | bounded implementation, 2026-11-15 | Receive unchanged bounded MolSysMT native pages with caller-declared exact parent/source mappings; preserve producer separately from reader and verify explicit physical records in Python while TypeScript retains them opaquely | Component #7 and MOLSYSMT_INTERACTIONS_PROFILE.md; supported browser record reader is PyUnitWizard #159, diagram/transport receiving remains pending |
| D27 | bounded implementation, 2026-11-15 | Represent each native occurrence as an ordered role-bearing hyperedge; explicit whole-participant groups retain reversible constituents/images and exact context without merging observations or inferring chemical equivalence | Component #9 and INTERACTION_TOPOLOGY_PROFILE.md; positioned diagrams, graphical membership and full host receiving remain pending |

## Consequences

Owning the scene gives the project direct control over scientific layers,
interaction and visual design. It also creates responsibility for chemical
drawing correctness, geometry, accessibility, lifecycle and maintenance.
Source access to reference projects does not transfer their correctness.

The accepted direction replaces the earlier local plan to begin with two
third-party interactive-engine prototypes. It does not claim that a custom
renderer has already outperformed those engines. Retain alternatives and
reconsider scope if P2 exposes unacceptable complexity.

There is no decision to implement chemical algorithms, replace MolSysMT,
rewrite MolSysViewer, require a new Rust kernel or publish a package.

The [conceptual review](CONCEPTUAL_REVIEW.md) refines the proposed contracts.
D11-D15 are requirements to receive during implementation; their detailed
API/schema and scientific behavior are not frozen or runtime-qualified.

## Future decisions

Record the question, considered alternatives, owner, evidence, result and
reassessment trigger. A decision to revisit later needs an owning issue.
Use suite #199 while establishing this cross-component proposal; create
component-local implementation issues when their work becomes actionable.

## Interaction-pillar adoption

The maintainer corrected the optional-extension framing. Interaction View has
its own work track and scientific/functional acceptance, alongside Molecular
View. Staged profile delivery remains necessary; it does not demote either
pillar or require all future scientific engines in the initial artifact.

The earlier assessment is retained in
[history](archive/interaction_diagrams_inclusion_assessment_20261114.md).
Current scope is [INTERACTION_DIAGRAMS.md](INTERACTION_DIAGRAMS.md) and the
living ledger. Chemistry/scientific authority stays with the existing owners.
