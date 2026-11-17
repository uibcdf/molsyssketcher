---
summary: Historical optional interaction-diagram assessment superseded by equal-pillar direction.
issue: uibcdf/molsyssketcher#8
status: superseded
opened: 2026-11-14
closed: 2026-11-14
verification: inspected
area: [architecture, interaction-view]
guard:
normative: devguide/INTERACTION_DIAGRAMS.md
blocked_by: []
supersedes: []
---

# Historical interaction-diagram inclusion assessment

Superseded on 2026-11-14 by the maintainer decision to make interaction
diagrams a primary product pillar. Read [the current contract](../INTERACTION_DIAGRAMS.md)
and [the living plan](../IMPLEMENTATION_PLAN.md) for current scope.
The original dated assessment follows; its optional-module status is historical.

# Molecular 2D interaction diagrams: inclusion assessment

Date: 2026-11-14. Status: **proposed optional exploration module**.
This is an evaluation, not accepted implementation scope or a release promise.
The core 38-microstep ledger and production-editor-last direction are unchanged.
Coordination owner: [MolSysSuite #199](https://github.com/uibcdf/molsyssuite/issues/199).
The [assessment notice](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6886306052)
records this proposed direction; formal adoption and receiving remain pending.

## Recommendation and value

Include interaction diagrams in the project's proposed direction as a distinct
view module over the same scene primitives. A ligand-focused view with partner
residues, meaningful contacts and mapped 3D inspection is a strong concrete
research journey for Sabueso and future binding applications.

This capability is useful before chemical editing exists. It depends on a
correct viewer, native result receiving and participant correspondence, rather
than a production editor. Treat larger peptide/protein interfaces, physical
projections and energetic interpretation as separately admitted increments.

The proposal needs scientific and architectural corrections before adoption.
Its visual concepts are valuable; claims of universal standards, guaranteed
crossing-free layouts, arbitrary per-atom free energy or already available
native integration are not established.

## Responsibility split

| Concern | Owner / receiving boundary |
| --- | --- |
| Chemical recognition, interaction detection, participant roles, geometry and result coverage | MolSysMT's public native interactions and declared scientific providers |
| Binding-specific grouping, characterization and contribution associations | BindingMT; preserve exact scope and original/current-use distinction |
| Pocket/topographic results, provider-specific metrics and supported geometry | TopoMT and the explicitly selected provider; OpenCASTp is not an assumed universal backend |
| Pharmacophore definitions, observed features, hypotheses and tolerances | PharmacophoreMT, with supported molecular preparation/recognition from MolSysMT |
| Peptide-design context, candidates and evaluations | PeptideMT; molecular representation remains with its molecular owner |
| Multi-participant diagram, visual layout, glyphs, legends, selection and export | Proposed MolSysSketcher interaction view |
| 3D scene, camera and highlight operations | MolSysViewer's supported APIs, orchestrated by the host with explicit correspondence |
| Future ADMET/allostery meanings and calculations | Their accepted scientific owners and future received contracts |

The presentation layer can compute drawing positions, route lines, perform
hit testing and filter existing observations. It must not independently infer
chemical topology, detect contacts, invent missing observations or recompute
science when a user moves a diagram node.

Scientific ownership and execution location are separate. A qualified provider
may execute through Python, a service or a supported WASM route. This proposal
does not revoke the core's candidate RDKit/WASM boundary or require all future
science to live in a particular process. The renderer consumes provider results
under their contract in every route.

## Existing native foundation

The inspected public
[MolSysMT interactions contract](https://github.com/uibcdf/molsysmt/blob/main/devguide/interactions_api.md)
already describes multiple families, compound participants, relations versus
occurrences, criteria/profiles, quantities, attribution and bounded inspection.
Those interfaces remain subject to their actual experimental/support scope.

The inspected
[BindingMT interface contract](https://github.com/uibcdf/bindingmt/blob/main/devguide/binding_interface_native_interactions.md)
documents a bounded native ionic characterization/composition route. It does
not establish every contact or energetic workflow proposed here.
PharmacophoreMT documents native feature inventories and a
[prepared-feature contract](https://github.com/uibcdf/pharmacophoremt/blob/main/devguide/prepared_feature_snapshot_contract.md);
its declared parent/context and capture limits must remain visible.

Start with a received native analysis. Add PLIP/ProLIF output adapters through
their scientific owners when a concrete input requires them. They are useful
reference implementations, not one universal data or interaction standard.
Keep method/profile/version/parameters and differences between analyses;
matching type names do not establish identical results.

External preparation can add hydrogens, select alternate states or change
indexing. Preserve the actual prepared input and its original-system maps;
matching PDB labels or integer indices is not a correspondence contract.

This assessment inspects contracts and documentation. It does not execute or
qualify those providers or claim installed compatibility with MolSysSketcher.

## Correct scientific interpretation

### Energetic halos

HYDE/SeeSAR is a useful example of visualizing method-specific per-atom
contributions to estimated affinity. It does not make every atomic score a
general or experimentally measured binding free energy.

Accept such a layer only when its owner supplies the definition, decomposition
scope, input pose/state, method/version/options, units and limitations. Preserve
whether the number is a score, an energy term or a method-defined contribution.
Do not silently sum unrelated atomic contributions or relabel them as total
binding affinity. Unknown/unassessed atoms are not zero contribution.

The [HYDE guide](https://www.biosolveit.de/wp-content/uploads/2025/07/Hydescorer-UserGuide_2025_07.pdf)
supports the specific visual example. No HYDE dependency, execution or license
acquisition is selected by this proposal.

### Cavity and environment contours

A chemical 2D layout is not a spatial slice of its 3D pocket. A contour around
the ligand cannot automatically represent cavity volume or steric distance.

Separate two possible modes:

- A schematic environment/burial/contact contour, with an explicit rule,
  legend and linked numerical 3D metrics.
- An actual projection/section of supplied physical geometry, with a declared
  frame, plane/transform, units and visibility/occlusion policy.

Do not mix those modes silently. The
[SZMAP report](https://docs.eyesopen.com/applications/szmap/szmap_report.html)
illustrates an environment-dependent boundary convention; it is not evidence
that any triangulated pocket has a unique faithful outline on an arbitrary
chemical drawing.

Preserve TopoMT's
[selected-provider result contract](https://github.com/uibcdf/topomt/blob/main/devguide/architecture.md).
Provider-reported quantities and shape definitions can differ. A volume stays
a physical quantity even if its graphical annotation is schematic.

### Pharmacophores

Distinguish observed chemical features, interaction-derived features and
design hypotheses. Preserve the owner's participant roles, centers,
directions/normals, tolerated geometry and provenance.

A circle used as a 2D feature symbol does not make a 3D tolerance sphere into
a measurable radius in drawing coordinates. Editing such a symbol changes a
scientific constraint only through an explicit supported owner operation.
The scene must not invent a complementary interaction hypothesis.

### Peptides, ADMET and allostery

Use progressive representation: residue/feature summaries for context, with
explicit expansion to admitted chemical detail. Nonstandard residues,
cyclization and cross-links require actual chemical support and correspondence.
Do not promise arbitrary peptide chemistry from a sequence label.

Future ADMET overlays distinguish structural alerts, model predictions and
measured endpoints. A flagged substructure does not itself establish toxicity.
Future allostery overlays preserve the chosen network/model and inferred
relations; correlation or a graph path does not automatically establish causal
communication or a cryptic binding site.

These future owners/capabilities are extension opportunities, not received
integrations or a requirement to implement their science in MolSysSketcher.

## Interaction scene and data boundary

Add a compositional interaction view over existing molecular depictions and
context nodes. Preserve one or more molecular model/occurrence references.
Do not turn all complex participants into one artificial molecular entity,
or define a competing scientific interactions schema.

The diagram's visual projection references:

- Exact model/state/frame and prepared-input context.
- Original named analysis and relation/occurrence identifiers.
- Typed participants with roles: atoms, rings, groups, residues, waters, ions
  or features as supported by the owner.
- Quantities, criteria, coverage, producer and original result provenance.
- Visual anchors, summary/expansion choices, layout, filters, labels and pins.

Participants are not always two atoms. Water bridges, ring contacts and
coordination need compound or multi-participant relationships. An atom-pair-only
edge schema would discard meaning. Residue labels are presentation, not global
identity; chain/model/insertion/alternate/source axes need their actual owner maps.

Keep parallel observations and alternative analyses distinct. Display filtering
does not change the original criterion. New detection thresholds require an
explicit scientifically owned analysis unless an existing qualified query
already defines that transformation.

Coverage distinguishes evaluated-empty, not requested, failed and unavailable.
Paged/filtered subsets must show their limits. A trajectory aggregate states
the sampled frames, evaluated denominator, weighting and grouping policy.
Frequency is not binding probability or affinity.

The diagram preserves whether a record is a source declaration, computed
observation, prediction or hypothesis. Drawing a calculated contact in Sabueso
does not promote it to a source assertion, experimental binding measurement
or Discovery conclusion.

## Layout and UX

Keep the focus molecule's accepted chemical depiction fixed while arranging
partner summaries. Graph springs must not move chemical atoms, distort stereo
or make drawn edge length look like a physical contact distance.

Compare constrained static placement with a bounded optional layout adapter.
[fCoSE](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose) offers fixed,
alignment and relative-placement constraints. Its existence does not guarantee
crossing-free chemical diagrams or superiority over domain-specific layout.
Do not adopt the whole Cytoscape rendering stack merely to obtain a layout.

Prefer stable positions, reproducible settings, user pinning and deliberate
re-layout. Continuous motion is optional. Limit work and stop conditions; route
and filter edges to improve clarity rather than promising no crossings for
every graph.

LigPlot+ and PoseView are useful presentation references. Offer familiar symbols
with explicit legends, themes and accessible alternatives. No universal
iconography or automatic journal compliance is claimed.

For 3D coordination, the host consumes a typed event and an explicit current
participant mapping, then calls supported viewer APIs. Hover highlights by
default; camera focus is an explicit click/action or configurable policy.
Keep camera motion under user control.

Bidirectional events carry origin/context to prevent feedback loops. Retired
diagram, analysis or 3D-model generations cannot act on a replacement.
External providers do not intercept arbitrary web messages.

## Proposed increments and acceptance

These are evaluation gates, not additions to the accepted core task ledger.

| Increment | Bounded result | Required evidence before expansion |
| --- | --- | --- |
| I0 | Native analysis-to-visual projection for one admitted public complex, one Cartesian frame and declared families | Exact model/participant/occurrence maps, units, criteria and coverage |
| I1 | Read-only fixed-ligand diagram, partner labels, typed contacts, filter/legend and SVG export | Correct endpoints, distinguishable unknown/empty states, usable constrained layout |
| I2 | Current 2D/3D highlight/selection and explicit focus | Real supported viewer integration, missing-map behavior and stale/echo controls |
| I3 | Additional received quantitative/pharmacophore/environment layers | Owner-defined meanings, projection policy, units/scales and actual input dependencies |
| I4 | Peptide/interface abstractions, temporal aggregates and other domain adapters | Their separately admitted chemistry, grouping, temporal coverage and scale budgets |

The first increment should prove one real useful diagram. Energetic
decomposition, cavity projection, arbitrary peptides, ADMET and allostery must
not all become prerequisites of that proof.

Minimum adversarial cases include equal residue labels in different sources,
compound/ring and mediated participants, duplicate observations, missing maps,
unevaluated frames, partial pages, different methods, stale pose/frame changes,
layout changes leaving physical measures intact and unknown values distinct
from zero. A model edit marks affected contacts stale without implicit detection.

## Sources and remaining decisions

Primary references inspected include
[PLIP documentation](https://github.com/pharmai/plip/blob/master/DOCUMENTATION.md),
[ProLIF interactive diagrams and aggregates](https://prolif.readthedocs.io/en/stable/notebooks/md-ligand-protein.html),
[LigPlot+](https://www.ebi.ac.uk/thornton-srv/software/LigPlus/),
[PoseView](https://www.biosolveit.de/wp-content/uploads/2020/10/poseview_ug.pdf),
the HYDE/SZMAP sources above and fCoSE's documented constraints.
Live documentation references are dated inspection, not frozen qualification.
Commercial sample code, graphical assets and reference implementations are not
incorporated.

Before adoption, select the first consumer journey, admitted native provider
profile, multi-participant visual contract, layout comparison and release scope.
Core viewer implementation, formal component admission and their existing
acceptance remain separate. No public support or performance claim is made.

## Lifecycle receiving note - 2026-11-16

The metadata and local issue #8 mapping were added during administrative lifecycle
receiving. The dates describe the original assessment and its supersession, not
the creation of issue #8. The original assessment above remains unchanged; its
central #199 references are historical provenance, not current membership state.
