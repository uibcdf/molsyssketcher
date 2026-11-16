# Molecular interaction diagrams

Status: **primary product pillar**, adopted by the maintainer on 2026-11-14.
The first bounded native ionic inspection profile exists; full scientific,
diagram API/layout and graphical qualification remain pending.
The [living plan](IMPLEMENTATION_PLAN.md) owns implementation states.

The [shared adoption notice](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6886729818)
records the maintainer's product decision and the revised acceptance scope.

MolSysSketcher has two equally important capabilities: molecular 2D
representation/exploration and multi-participant interaction diagrams.
Both use a common visual foundation and have their own acceptance.
Interaction diagrams are part of the product baseline. A selected provider,
layout algorithm or later scientific family can have its own availability
without making this pillar optional.

## Purpose and research journeys

Support two first-class diagram modes:

- **Ligand-centered:** an admitted chemical depiction with interacting residues,
  rings, groups, waters, ions and other partners.
- **Interface-centered:** two declared participant sides, possibly composite,
  without requiring a privileged central small molecule. Peptide-protein and
  protein-protein interfaces can use residue/feature summaries and progressive
  chemical detail.

The same participant may appear at different visual resolutions. Expansion,
collapse and grouping preserve original membership and scientific roles.
Sequence labels are views of a declared molecular source, not complete
chemical identity.

Required research journeys include opening and inspecting a known complex;
following a contact to its participants and method; filtering existing results;
comparing contexts; inspecting temporal summaries; following exact 3D
correspondence; and saving/exporting a reproducible diagram.

These operations do not require chemical editing. Production editing remains
the final stage and must respect the diagrams' source/analysis validity.

## Shared foundation and state authority

Reuse chemical depictions, typography, geometry, transforms, hit testing,
selection, layers, quantity/provenance handling, lifecycle and exports.
The interaction view composes depiction fragments and context nodes; it does
not require mounting a complete Molecular View for every participant.

Keep two bounded document kinds:

| Document | Authority |
| --- | --- |
| Molecular document | An original-input interpretation or explicit chemical draft, with prepared depiction and semantic/display maps |
| Interaction diagram document | A visual projection referencing molecular contexts and native analyses, plus grouping/layout/filter/annotation state |

Each live document has one accepting writer. The interaction document does
not copy or edit a second authoritative molecular graph or scientific result.
Shared parent snapshots are immutable; host commands explicitly replace a
parent/context and invalidate affected projections.

Every scene object resolves through visual IDs to exact native participants
and their scientific context. Equal labels, array indices or canonical strings
do not establish identity.

## Scientific providers and execution location

Use native [MolSysMT interaction contracts](https://github.com/uibcdf/molsysmt/blob/main/devguide/interactions_api.md)
for detection, participants, roles, relations/occurrences, criteria and coverage.
BindingMT owns binding-specific grouping and characterization.
TopoMT owns admitted pocket/topography results; PharmacophoreMT owns features,
hypotheses and tolerances; PeptideMT owns its design/evaluation context.
The scientific owners receive PLIP/ProLIF or other external adapters when needed.

The presentation layer computes display positions, line routes and hit tests.
It does not independently detect chemistry or interactions. A qualified
scientific provider may execute in Python, a service or supported WASM;
execution location does not transfer scientific ownership to the renderer.

Declared provider versions do not certify all families or a new integration.
Select and receive the initial profiles explicitly. Availability, actual
calculation, saved-result reading and consumer qualification are separate.

## Native observation projection

The diagram references, without replacing the owning result schema:

| Binding | Required meaning |
| --- | --- |
| Parent context | Molecular source/occurrence, preparation, state, conformer/frame and owner-declared validity inputs |
| Scientific result | Named analysis, actual method/profile/options/version, coverage and producer |
| Relation/occurrence | Original identifiers and their analysis generation; no globally persistent index assumption |
| Participant | Exact roles and atom/group/residue/ring/water/ion/feature membership |
| Geometry/measure | Original units, coordinate/PBC convention and applicability |
| Visual projection | Anchors, grouping, detail level, scene generation, filters, legend, positions and pins |

Relationships can be directed, symmetric, compound, parallel or mediated.
Do not flatten a ring to an arbitrary atom or a water bridge to a direct
hydrogen bond. Preserve contributor identity, multiplicity and alternative
analyses. Display grouping is a reversible projection with drill-down.

Do not infer correspondence after external protonation, atom reordering,
alternate-state selection or extraction. Require the actual owner maps and
their unchanged-input preconditions. Unsupported mappings remain visible.

Define capabilities separately for retaining, displaying, inspecting,
filtering, comparing, saving and exporting each admitted feature. A generic
unknown-type glyph may preserve an inspectable result only when its unknown
semantics are explicit. It must not impersonate a recognized interaction.

## Coverage, filters and comparison

Distinguish evaluated-empty, not requested, unevaluated, failed, unsupported
and unavailable. Show selected scope, truncated/paged coverage and filters.
A hidden line is not a negative finding; a partial page is not a complete
scientific analysis.

Changing a display filter does not change an analysis criterion. A new
scientific cutoff requires its supported owner operation and a new result.
The renderer never invents observations outside recorded coverage.

Comparison is a required investigation path. Keep each pose, molecular state,
method and analysis independently attributed. A displayed difference can mean
different preparation, criteria or coverage, rather than a changed physical
interaction.

Use explicit correspondence for shared selections and gained/lost claims.
Independent side-by-side comparison remains useful when equivalence is
unestablished. A layout alignment is a visual relationship, not entity identity.
Keep a consistent quantitative scale when a comparison requires it.

## Time and ensembles

Single-frame and aggregated diagrams are distinct modes. Aggregation declares
the sampled/evaluated frames, denominator, weighting, grouping and stop/partial
status. Parallel occurrences need a stated counting policy.

An aggregate can contain contacts that never co-occurred in a single frame.
Its presentation must not imply a simultaneous pose. Frequency is not binding
probability, lifetime or affinity. A summary does not authenticate another
current frame or make a stale calculation applicable.

Read supplied aggregates through their owner contract. If a visual summary
needs a reusable scientific statistic not available there, request it from
the owner instead of introducing a hidden analysis engine in the client.

## Visual grammar and layout

Keep chemical depiction, scientific relationships, annotations and selection
as distinct layer roles. Glyphs communicate participant roles and declared
interaction type, with a legend, accessible alternatives and explicit unknowns.
Familiar LigPlot+/PoseView conventions are references, not universal standards.

In ligand-centered mode, fix the accepted chemical depiction while placing
context nodes. Interface mode needs balanced sides/lanes or another declared
layout; dense interfaces may use a grouped or matrix projection instead of an
unreadable full network. All projections retain original memberships.

Specify constraints, collision handling, label bounds and edge ports/routing.
Compare a reproducible constrained baseline with candidate layout engines.
No force-directed algorithm is assumed superior or crossing-free. fCoSE is
an evaluation candidate, not an adopted dependency.

Preserve user pins and stable positions across compatible updates. Re-layout
is deliberate and bounded. Optional animation or a force solver cannot move
chemical atoms, distort stereo or turn drawing distances into physical ones.
Use the common font/geometry/hit snapshot and independent multi-view SVG IDs.

## Quantitative and domain layers

These are planned capabilities of the interaction pillar, implemented through
declared profiles. They do not promise every method/provider in the first delivery.

- **Quantitative values:** retain atom/group/residue/molecule scope, missing
  states, units, limits and meaningful color/range/clipping policy.
- **Energetics:** preserve whether values are scores, energy terms or
  method-defined contributions. HYDE-like halos are a visual reference;
  arbitrary atomic scores are not automatically binding free energies.
  Do not sum unrelated terms or invent a value when a method supplies none.
- **Environment/cavities:** distinguish schematic burial/contact contours from
  actual physical projection/section. A physical mode declares frame,
  transform/plane, units and occlusion. TopoMT's selected-provider meanings
  remain authoritative; OpenCASTp is not an assumed universal backend.
- **Pharmacophores:** distinguish observed features, interaction-derived
  features and hypotheses. Preserve centers, directions/normals, tolerances
  and roles. A 2D glyph radius is not a measured 3D tolerance.
- **Biomolecular interfaces:** receive peptide/protein representation and
  admitted modified/cyclic cases. Summary views must not silently simplify
  unknown chemistry or manufacture complete peptide identity from a sequence.

ADMET and allostery remain future scientific profiles. Structural alerts,
predictions, measurements and causal interpretations retain their distinct
meanings and owners. They do not become mandatory installed engines merely
because the diagram pillar is mandatory.

## Coordinated 2D/3D investigation

The host mediates current mappings and calls supported MolSysViewer APIs.
Events identify diagram, molecular and analysis contexts, origin and generation.
No view acts on another source by matching residue labels or accepting an
unscoped web signal.

Hover highlights by default; camera focus is explicit/configurable. Prevent
echo loops and stale actions after replacement, reanalysis, frame changes or
disposal. Partial/ambiguous/unavailable correspondence has a visible outcome.

Standalone 2D viewing can work without a 3D runtime. Qualifying the linked
profile nevertheless requires a real mapped journey; an unavailable-state
test is not proof of synchronization.

## Persistence, export and editing

Persist versioned visual state, exact parent/result references, supported
original/native payload locators, pins, filters, legends and context.
Reopen supplied saved data without silently recalculating or contacting a
service. Missing/corrupt/unavailable assets preserve explicit failure state.
Reuse owner-native scientific persistence instead of inventing another codec.

Export a legible vector figure and a reproducible context/legend record.
Record selected frame/aggregate, criteria, filters, truncation, units and
producer context. Keep credentials, executable content and unapproved private
material out of exported artifacts.

Later molecular edits create an explicit draft. Affected analyses become
stale; retained historical diagrams can remain inspectable against their
original parent. New 3D preparation/pose/calculation is a separate owner action.
Moving a diagram node changes visual state only.

## Acceptance and completion

The [delivery-gate table](IMPLEMENTATION_PLAN.md#delivery-gates-and-dependencies)
distinguishes standalone G-I, linked-joint G-J and richer G-R scope. Single-frame
minimum receiving does not claim complete temporal/comparison functionality.
The full research journeys remain planned work rather than hidden prerequisites
of the first bounded delivery.

The interaction pillar needs its own API examples, finite corpus, scientific
controls, browser/Qt checks, resource measurements and human review.
Use I1-I5 in the [living ledger](IMPLEMENTATION_PLAN.md); common P4/P5 gates
receive both primary views.

The initial interaction profile must demonstrate a real ligand-centered
journey and a residue-level peptide/protein or two-sided interface, plus
directed, compound and mediated relationship controls within admitted families.
Record exact supported chemistry/families instead of claiming arbitrary
complexes.

Required edge cases include repeated residue labels across models/chains,
insertion/alternate/source axes, multiple ligands, waters/ions, parallel
observations, evaluated-empty versus missing coverage, partial pages,
method/state differences, stale generations and failed replacement.

Both primary minimum profiles must be received before calling the joint
exploration baseline complete. Report molecular, interaction and shared-host
readiness separately. Detailed profile choices and numerical budgets remain
P0.6/owner acceptance work. There is no runtime implementation or measured
performance yet.

## Decision and source trail

The [earlier assessment](archive/interaction_diagrams_inclusion_assessment_20261114.md)
preserves the references and scientific corrections behind this design.
Its optional-module framing is superseded by the maintainer's two-pillar
direction. Formal suite admission and provider qualification remain separate.

The [MolSysMT API](https://github.com/uibcdf/molsysmt/blob/main/devguide/interactions_api.md),
[query contract](https://github.com/uibcdf/molsysmt/blob/main/devguide/interactions_query_semantics.md),
[Viewer consumer contract](https://github.com/uibcdf/molsysviewer/blob/main/devguide/interactions_compatibility_contract.md)
and [ProLIF examples](https://prolif.readthedocs.io/en/stable/notebooks/md-ligand-protein.html)
are source references, not evidence of an executed MolSysSketcher integration.

## Received native inspection increment (2026-11-15)

The [finite MolSysMT profile](MOLSYSMT_INTERACTIONS_PROFILE.md) now implements
owner-native ionic page receiving with role-bearing participants, exact declared
parent/source bindings, method/producer retention, PBC images and explicit
coverage. Python verifies physical records through PyUnitWizard; TypeScript
retains them opaquely pending the supported browser reader. This is I1.2/I1.4
partial progress, with no graphical diagram or production host profile. The
remaining requirements above retain their scope.

## Received participant topology (2026-11-15)

The [I1.3 topology profile](INTERACTION_TOPOLOGY_PROFILE.md) adds actual compound
rings, directed hydrogen bonds, parallel contacts and exact one/two-water native
paths with reversible explicit presentation grouping. Native occurrence identity,
ordered roles, constituent atoms, repeated mediator membership and PBC images
remain intact. This is a partial semantic foundation for the positioned two-mode
diagrams above; no interaction drawing or graphical hit profile is received.
