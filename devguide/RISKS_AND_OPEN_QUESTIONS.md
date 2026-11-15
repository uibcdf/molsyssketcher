# Risks and open questions

All entries below are design risks or unresolved decisions, not observed
library defects. The initial coordination owner is suite #199; component and
provider issues should own concrete implementation work as it is opened.

| ID | Risk/question | Control or experiment | Next review |
| --- | --- | --- | --- |
| R01 | Own rendering may cost more than expected | Bound the feature matrix; compare actual drawings with reference output; keep an existing-renderer option | P0.6, P2 |
| R02 | Attractive drawings may misrepresent stereo, charges or hydrogens | Chemical controls and visual review, not screenshot similarity alone | P1.5, P2.2 |
| R03 | Viewer state may not support invalid editing drafts | Separate graph/draft envelope and validate the early edit/undo experiment | P1.4, P2.5 |
| R04 | Index/order changes may corrupt overlays or 2D/3D selection | Stable IDs, exact maps and revision-bound results; explicit unavailable mapping | P1, P3, P4 |
| R05 | RDKit WASM may lack a required native operation | Inventory actual APIs; choose one route; report reusable missing capabilities to the owner | P0.6, P1.2 |
| R06 | Reference code may bring licensing obligations or maintenance burden | MIT selected for the project; record immutable origin and review actual third-party licenses/notices before adaptation | Each reuse and P5 |
| R07 | Browser success may hide Qt/WASM/worker/asset failures | Receive the production bundle in the actual QWebEngine host | P4.2 |
| R08 | UI and memory promises may lack measured scope or bounded pending work | Agree budgets and bound admission/queues; measure cold/warm load and repeated lifecycle | P0.6/P1.4/P5.2 |
| R09 | Generic infrastructure may grow before concrete needs | One renderer, one provider route and a small public boundary first | P1/P2 review |
| R10 | Proposed 2D ownership is not yet central admission | Resolve #199 and receive the appropriate TypeScript-first component profile | P0.4 |
| R11 | Editor, reactions or dashboards may delay initial exploration | Keep distinct milestones and require explicit scope changes | Every milestone |
| R12 | Persisted documents may outlive internal implementation | Version document schemas and define migration/unsupported-version behavior before user persistence | P1 and persistence introduction |
| R13 | Drawing preparation may silently change semantic identity or object correspondence | Prepared depiction and explicit generated/condensed mapping; original and interpreted inputs remain separate | P1.6/P2.2 |
| R14 | Same-graph requests or undo may admit stale results | Monotonic generations plus destination/dependency tokens; cancellation alone is insufficient | P1.4/P2.5 |
| R15 | Competing writers or failed replacement may destroy a valid displayed document | One writer, owned candidate snapshots, atomic acceptance and orthogonal states | P1.7/P4 |
| R16 | A valid graph may hide stale frame-dependent values or misleading colors | Owner-declared result dependencies and explicit scale/range/missing-value policy | P3.3 |
| R17 | Interaction diagrams may conflate native observations, visual edges, scores or physical projections | Receive original participant/coverage contracts, typed meanings and declared projections | I1/I4 |
| R18 | A ligand-only architecture cannot represent balanced biomolecular interfaces | Receive interface-centered mode and a real peptide/protein or composite two-sided journey | I2.2/I5.2 |
| R19 | Comparison/aggregation may manufacture changes, simultaneous poses or binding probability | Preserve each context, coverage, denominator, weighting and correspondence | I3.2/I3.3 |
| R20 | Molecular readiness may conceal an unfinished second pillar | Independent finite profiles and scientific/functional gates before joint completion | I5/P5 |
| R21 | Equal centrality may be mistaken for unbounded installed methods or first-release scope | Declare finite profiles and pending advanced tasks; guard only selected scientific routes | P0.6/I4 |

## Decisions still needed

- What exact chemical classes/features form the initial supported corpus?
- Which operations can preserve each feature, and what explicit losses or
  refusals apply to generated export or future editing?
- Which RDKit access route is first, and which MolSysMT APIs already cover it?
- Which drawing-preparation fields can that route actually supply with exact
  semantic/display correspondence?
- Which additional browser/Qt/provider tools are required beyond the selected
  Node/TypeScript/Prettier/native-test foundation?
- Which third-party notices apply to future incorporated runtime assets beyond
  the project's selected MIT license?
- What controlled artifact will Sabueso first consume, and how will it verify
  production module identity?
- Which measured responsiveness, memory and graphical-quality budgets will
  the maintainer accept for that corpus and host?

Answer these through P0 and the relevant owner, rather than filling the guide
with unsupported compatibility or performance claims.

## Two-pillar review

The product-level decision is accepted: both pillars are central. Remaining
questions concern finite families/chemistry, payload/profile choices, layout,
actual provider evidence and release scope. The
[interaction contract](INTERACTION_DIAGRAMS.md) owns its minimum journeys;
ADMET/allostery remain future scientific profiles rather than installed
prerequisites.

## Final review disposition

The last consistency review clarifies delivery-gate subsets, live versus
supplied-result qualification and bounded pending work. These are acceptance
refinements within existing tasks, not additional features. The remaining
open toolchain/profile/layout/budget decisions should be exercised through
[the first joint slice](FINAL_DESIGN_REVIEW.md), with specific owning follow-up
if evidence requires a change.
