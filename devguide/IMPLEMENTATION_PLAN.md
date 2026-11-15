# Living implementation plan

Updated: 2026-11-15. Current milestone: M0 with a first shared P1 increment.

This is the single microstep ledger for two equally important product pillars:
Molecular View and Interaction View. Shared work is implemented once. Both
views have explicit functional/scientific acceptance before production editing.

## Status and evidence

- todo: work has not started.
- active: work is in progress.
- partial: useful work exists, with explicit remaining acceptance.
- blocked: an identified dependency prevents the next required action.
- done: the stated result exists and its applicable checks were received.

For implementation completion, record exact source/artifact, selected checks,
results, owning issue and limits in CHECKPOINT.md or a linked receipt. A source
description, a closed upstream issue or an unavailable-provider test is not
executed integration evidence.

There are **69 microsteps: 6 done, 12 partial and 51 todo**. Five completed steps
are documentation/source review; P0.5 supplies the tested toolchain and license.
Counts are unweighted, not effort percentages. Initial implementation evidence
and explicit remaining acceptance are in CHECKPOINT.md and SUPPLIED_INPUT_PROFILE.md.

## Tracks and dependencies

| Track | Stages | Required role |
| --- | --- | --- |
| Shared foundation | P0, P1 | Product/contracts, documents, prepared depictions and scientific-result references |
| Molecular View | P2, P3 | Chemical representation, nonmutating exploration and scientific layers |
| Interaction View | I1, I2, I3, I4, I5 | Native observation projection, diagrams, investigation, domain layers and scientific acceptance |
| Joint host/delivery | P4, P5 | Both primary views received in the actual consumer/artifact |
| Production editor | P6 | Chemical drafts, validation and history after exploration foundations |

P2 and I1 can advance from the same foundation. I2 reuses prepared chemical
depictions and shared scene primitives; it does not wait for a production
editor. P4/P5 qualify both views. I4 enrichments can be delivered by declared
profile after the minimum joint baseline; they remain visible pending work.
P6 is the final production capability.

## P0 — Project foundation (partial)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| P0.1 | done | Purpose, consumers and scientific boundaries recorded in PROJECT.md |
| P0.2 | done | Architecture, document/provider contracts, editor path and tradeoffs recorded in the guide |
| P0.3 | done | Staged plan, decisions, risks and continuation checkpoint recorded and documentation links checked |
| P0.4 | partial | Local instructions/reporting route and central handoff exist; formal admission, TypeScript-first profile and registered guide synchronization remain in suite #199 |
| P0.5 | done | MIT selected by maintainer; Node/npm, TypeScript/Prettier pins, lockfile, ESM/declarations, executable local checks and clean packed-consumer route committed under component #1 |
| P0.6 | partial | Supplied-input and RDKit source-route matrices, 12 native molecular controls and ingress/queue bounds exist; native interaction/public complex corpora, full operation matrices and accepted measured budgets remain pending |
| P0.7 | done | Source-backed conceptual review and prepared-depiction/transaction requirements recorded in CONCEPTUAL_REVIEW.md |
| P0.8 | done | Maintainer's equal-pillar direction, complete interaction contract, separate readiness and integrated work ledger recorded |

Review the official starter/profile without inventing an unused Python package
for a TypeScript-first component. Formal admission remains independent of this
local product decision.

## P1 — Shared documents and scientific boundaries (partial)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| P1.1 | partial | Supplied molecular projections retain original text, stable local/provider/display maps and monotonic replacement generations; draft/edit/undo behavior remains pending |
| P1.2 | partial | Real bounded RDKit Python source adapter has lazy dependency/argument/catalog controls and a finite capability inventory; production host/transport and distributed adapter receiving remain pending |
| P1.3 | partial | Native SMILES interpretation, generated 2D preparation, exact maps and retained input feed TypeScript; MOL/SMILES references round-trip for 12 controls. General format/export APIs and broader operation scope remain pending |
| P1.4 | partial | One replacement destination has request intent, one running/one newest queued call, honest cancellation occupancy and stale/disposal rejection; independent destinations, undo and selected-provider size/time/service receiving remain pending |
| P1.5 | partial | Twelve real-provider controls receive native round trips, parser/preparation provenance, original declarations and nonphysical drawing coordinates; native scientific quantities/external correspondence and full consumer receiving remain pending |
| P1.6 | partial | Actual RDKit preparation supplies exact bijections, explicit wedges/H/charges/isotopes and native references; generated objects are refused. Broader preparation/scene coverage remains pending |
| P1.7 | partial | Document candidate acceptance is atomic, state dimensions are independent and failures preserve accepted data; complete interpretation/depiction/scene acceptance remains pending |
| P1.8 | partial | Shared immutable owner/generation/state/structure/preparation references and independent document controllers exist; scene composition and native provider receiving remain pending |

Gate: admitted molecular input can enter the depiction path, and referenced
molecular/analysis contexts can be composed without implicit identity changes.

## P2 — Molecular View: representation (todo)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| P2.1 | todo | SVG chemical primitives, semantic geometry, transforms and hit regions reusable by both views |
| P2.2 | todo | Declared chemical feature matrix, directed stereo/axis controls and reference comparison |
| P2.3 | todo | Actual font metrics, coherent label/hit geometry, themes and crowded-structure review |
| P2.4 | todo | Fit/pan/zoom, resize, graphical export, replacement and owned-resource disposal |
| P2.5 | todo | Early internal edit/undo/validation/stale-response/read-only experiment in EDITOR.md |

Gate: usable molecular representation and an exercised future editing path.
P2.5 does not deliver the production editor.

## P3 — Molecular View: scientific exploration (todo)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| P3.1 | todo | Hover/selection, keyboard path, contextual events and enforced nonmutating exploration |
| P3.2 | todo | Anchored labels, halos, arrows/regions, layer roles and explicit pointer policy |
| P3.3 | todo | Shared typed scientific-layer surface with exact dependencies, mappings, units, legends and missing-value policy |
| P3.4 | todo | Bounded callbacks, independent instances, unsubscription, stale-event and lifecycle controls |

Gate: a host can explore an admitted molecule and a meaningful scientific layer
without modifying its original declaration.

## I1 — Interaction View: document and native observations (partial)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| I1.1 | partial | Experimental versioned reference document validates exact multi-parent contexts and original result references for both mode labels; native occurrence/participant projection and complete visual document remain pending |
| I1.2 | todo | First native interaction-result adapter preserving selected method/profile, quantities, producer and analysis-local identifiers |
| I1.3 | todo | Directed/symmetric, compound, parallel and mediated participant relationships with reversible visual membership maps |
| I1.4 | todo | Coverage-aware queries, filters and bounded projection preserving evaluated-empty, missing, failed and partial states |
| I1.5 | todo | Atomic multi-parent context replacement and dependency invalidation; no promotion of stale observations or source identity |
| I1.6 | todo | Public read-only diagram input/inspection contract and meaningful native/reference/provenance controls |

Gate: native results project into a coherent multi-participant visual document,
with no new detector or competing interactions codec.

## I2 — Interaction View: diagram and visual grammar (todo)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| I2.1 | todo | Ligand-centered mode with fixed prepared depiction, exact partner anchors and typed contacts |
| I2.2 | todo | Interface-centered mode with two declared/composite sides and no required central ligand |
| I2.3 | todo | Constrained reproducible layout, label/edge routing, user pins, bounded re-layout and candidate comparison |
| I2.4 | todo | Role-aware glyphs, physical-measure tooltips, legends and accessible unknown/missing states |
| I2.5 | todo | Residue/feature summaries and reversible chemical detail/grouping; explicit dense-interface presentation policy |
| I2.6 | todo | Keyboard/pointer selection, expansion, filters and coherent hit geometry across both diagram modes |

Gate: both diagram modes are usable and scientifically interpretable. Chemical
atoms stay fixed during context layout; drawing length is not physical distance.

## I3 — Interaction View: investigation and reproducibility (todo)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| I3.1 | todo | Actual host-mediated 2D/3D mapping and highlight/focus, with absent/partial/stale/echo controls |
| I3.2 | todo | Single-frame and supplied-aggregate navigation with evaluated denominator, weighting and non-simultaneity semantics |
| I3.3 | todo | Side-by-side/comparative contexts retaining method/state/coverage differences and explicit correspondence for differences |
| I3.4 | todo | Versioned diagram persistence/reopen with original/native references, pins/filters and no implicit recalculation |
| I3.5 | todo | Vector export plus reproducible context/legend record retaining criteria, frame, filters, truncation and units |
| I3.6 | todo | Parent/frame/edit invalidation, retained historical inspection and independent multi-view lifecycle |

Gate: a researcher can investigate, compare and reproduce diagrams without
changing their original scientific inputs. A saved aggregate is not a new pose.

## I4 — Interaction View: quantitative and domain profiles (todo)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| I4.1 | todo | Multi-participant quantitative layers using the shared layer surface with exact scope, units/scales and missing-value semantics |
| I4.2 | todo | Received method-defined energetic/contribution profile with correct labels, decomposition scope and actual provider provenance |
| I4.3 | todo | Received schematic environment/burial/pocket layer with explicit rule and linked original topographic measures |
| I4.4 | todo | Received observed/hypothesized pharmacophore layer preserving roles, geometry, directions and tolerance meaning |
| I4.5 | todo | Declared physical projection/section profile kept distinct from chemical-layout contours, with actual frame/transform/unit controls |
| I4.6 | todo | Admitted peptide/modified/cyclic chemical-detail profile with source correspondence and explicit unsupported chemistry |

Gate: each admitted domain profile has actual scientific and visual receiving.
Synthetic layer tests alone do not qualify a scientific provider. Unavailable
profiles remain pending/partial; no silent substitute closes their work.
Future ADMET/allostery science is outside these currently defined profiles.

## I5 — Interaction View: scientific and usability acceptance (todo)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| I5.1 | todo | Analytical and public ligand-complex controls for directed, compound and mediated roles, duplicates, coverage and exact mappings |
| I5.2 | todo | Real residue-level peptide/protein or two-sided interface journey, with declared chemistry and grouping scope |
| I5.3 | todo | Actual browser/Qt linked-view journey, repeated replacement/disposal and missing/stale correspondence cases |
| I5.4 | todo | Bounded sparse/dense diagram measurements including layout, query/source residency, projection limits and responsive interaction |
| I5.5 | todo | Maintainer/researcher review of glyph meaning, navigation, quantitative interpretation and reproducible figures |

Gate: interaction readiness has independent evidence. Molecular View tests,
screenshots or a single happy-path diagram do not replace these checks.

## P4 — Joint consumer and host integration (todo)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| P4.1 | todo | Both production view surfaces embed in a portable browser with correct assets and lifecycle |
| P4.2 | todo | Both surfaces and their composition execute in actual PySide6/QWebEngine with readiness, resize and shutdown |
| P4.3 | todo | Sabueso source-linked molecular and complex/interface journeys preserve original Cards and distinguish calculated layers |
| P4.4 | todo | Actual current 2D/3D coordinated selection plus absent/partial/stale safeguards for the linked profile |
| P4.5 | todo | Human review receives both minimum journeys and explicit scientific/platform limits |

Standalone 2D milestones can be received without a 3D runtime. The linked
profile needs an actual mapped journey; an unavailable-state guard alone no
longer completes P4.4.

## P5 — Joint exploration qualification and delivery (partial)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| P5.1 | todo | Both minimum profiles pass applicable robustness, chemical/observation fidelity, accessibility and lifecycle checks |
| P5.2 | todo | Separate molecular/interaction and combined-host performance budgets measured and accepted |
| P5.3 | partial | Private ESM/declaration tarball and independent offline foundation consumer pass; draft Conda assets/recipe have local layout receiving. Actual Conda archive/profile, both visual surfaces and full artifact/public-route qualification remain pending |
| P5.4 | todo | Applicable CI/governance/delivery route and exact-candidate checks; publication remains separately authorized |

Gate: both primary minimum profiles and the shared host/artifact boundary are
received. Never declare the joint exploration baseline complete from molecular
readiness alone. A limited milestone names its delivered profile explicitly.

## P6 — Production chemical editor (todo; final stage)

| ID | Status | Required result / completion evidence |
| --- | --- | --- |
| P6.1 | todo | Explicit basic atom/bond editing tools with declared chemical scope |
| P6.2 | todo | Preserved drafts, revision-bound validation and invalidation of affected interaction contexts |
| P6.3 | todo | Transactional undo/redo with coherent graph/layout/selection and no revived stale diagram/provider events |
| P6.4 | todo | Stereo-sensitive edits and supported chemical exports preserve meaning or report unsupported operations |
| P6.5 | todo | Explicit validated-snapshot handoff to an owner workflow, without silently updating poses or recalculating contacts |
| P6.6 | todo | Editing journeys reviewed against both source-preservation and interaction-validity contracts |

Advanced editor tools and particular downstream methods can have later
increments. P6.5 does not implement docking, conformer generation or free energy.

## Delivery gates and dependencies

P0.6 fixes finite feature matrices and numerical budgets. Shared P0/P1
prerequisites apply to every gate. These gate names are planning labels,
not additional microsteps or implemented API names.

| Gate | Required task evidence | Completion meaning |
| --- | --- | --- |
| G-M | P2/P3 plus per-view browser/Qt evidence under P4.1/P4.2 | Standalone molecular minimum |
| G-I | P2.1-P2.4 depiction foundation; I1/I2; I3.4-I3.6; I5.1/I5.2/I5.4/I5.5; per-view browser/Qt evidence under P4.1/P4.2 | Standalone interaction minimum, including both diagram modes |
| G-J | G-M and G-I; I3.1/I5.3; complete P4/P5 | Joint linked/consumer/artifact baseline with actual mapped 3D |
| G-R | G-J plus I3.2/I3.3 and I4, with their applicable I5/domain checks | Remaining planned temporal/comparison/domain exploration received |
| G-E | G-R plus P6 | Production editor and its interaction-validity contract received |

Per-view evidence may satisfy a view milestone while the corresponding shared
task remains partial. P4.1/P4.2 complete only when both surfaces pass. A missing
3D runtime does not invalidate standalone G-M/G-I, but it cannot satisfy G-J.
A G-J delivery does not complete G-R or the full roadmap.

P4.1/P4.2 provide the host foundation before I3.1/I5.3 exercise linked actions.
P4.4 consumes those actual mapping results; it is not a prerequisite that
requires itself indirectly. Richer I3.2/I3.3 and I4 work is not a hidden
prerequisite of the minimum G-J delivery. Chemical editing remains after the
agreed exploration roadmap. Future ADMET/allostery are outside these gates.

A narrow first joint slice can exercise partial P1/P2/I1/I2 work after the
applicable setup decisions; it need not wait for every abstraction or feature
matrix case to be finished. See [the final review](FINAL_DESIGN_REVIEW.md).
That experiment does not close the full minimum gates.

Report shared-foundation, molecular, interaction and editor readiness
separately. Distinguish standalone, linked minimum and full roadmap scope.
Equal importance does not mean equal task duration or duplicated infrastructure.

## Plan history and continuation

The original guide had 35 microsteps. The first conceptual review recorded
38 (4 documentation/source-review items done). That dated receipt remains
unchanged as historical evidence. This expansion adds P0.8, P1.8 and I1-I5:
31 new tasks, one documentation completion and 30 pending implementation items.

The next receiving is the remaining P0.4/P0.6 decisions and actual provider/scene
work from the partial P1 foundation, with both views in scope. Preserve task IDs
and record acceptance changes explicitly. Update the ledger, checkpoint,
decisions and receipts together; no scope revision implies executed runtime work.
