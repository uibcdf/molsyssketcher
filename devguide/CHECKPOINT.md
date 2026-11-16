# Current checkpoint

Updated: **2026-11-15**. Current milestone: first supplied ligand-centered/interface-centered SVG composition.

## Product direction

The maintainer has adopted two equally important MolSysSketcher pillars:

1. Molecular 2D representation and exploration.
2. Multi-participant molecular interaction diagrams and investigation.

Both use an original framework-independent TypeScript scene/document
foundation and supported scientific providers. SVG is the first renderer to
evaluate. Molecular View and Interaction View are working product names;
`MolecularSvgView` now implements a first bounded molecular surface.
Production chemical editing remains the final stage;
presentation editing of diagrams is part of exploration.

The earlier optional-module framing is superseded. Read
[INTERACTION_DIAGRAMS.md](INTERACTION_DIAGRAMS.md) and the
[living ledger](IMPLEMENTATION_PLAN.md). The prior
[assessment](archive/interaction_diagrams_inclusion_assessment_20261114.md)
is preserved as history; its old filename forwards to current scope.

## Actual implementation state

The private TypeScript package now accepts supplied prepared molecular documents
and exact multi-parent/native-result references. Both document kinds have
immutable acceptance, independent controllers, monotonic replacement generations,
bounded preparation queues and stale/disposal guards. MIT was selected by the
maintainer. Node/npm and development dependencies are pinned.

The first own SVG renderer has measured typography, pointer/keyboard selection,
bounded pan/zoom/fit, contextual hover, resize, contextual SVG export and
owned-resource disposal. There is no
production chemical/native-result adapter, production editor, published package
or fully qualified browser/Qt/platform profile. A bounded real
RDKit source-development route and its native chemical controls now exist;
this is separate from a production provider/host adapter. A local
packed consumer is tested; this does not establish a public installation route.
Package version `0.0.0` is a private tooling placeholder, not a release decision.

| Readiness axis | State |
| --- | --- |
| Shared foundation | partial: executable supplied-document/reference/controller subset; toolchain and license received; formal admission and full scientific/host receiving pending |
| Molecular View | partial: first measured SVG surface and finite real-browser/native drawing controls; full exploration/Qt/scientific acceptance pending |
| Interaction View | partial: first two-mode supplied SVG composition and native participant inspection; full grammar, investigation, real-complex and host receiving remain pending |
| Production editor | todo: final major capability after exploration foundations |

## Integrated plan

The ledger has **69 microsteps: 7 done, 29 partial and 33 todo**.

Completed items P0.1, P0.2, P0.3, P0.7 and P0.8 are documentation/source-review
work only. P0.5 and the bounded P2.5 architectural experiment are complete.
P0.4/P0.6, P1.1/P1.4/P1.6/P1.7/P1.8 and
I1.1/I1.2/I1.3/I1.4/P5.3 are partial, with remaining acceptance named in the ledger. P1.2/P1.3/P1.5
are partial after actual native RDKit preparation/round-trip receiving.
P2.1–P2.4, P3.1/P3.4 and P4.1 are now partial after the finite molecular SVG
increment. Counts do not
measure effort or imply completion of either primary view.

The expansion from 38 steps adds the documented adoption P0.8, shared reference
work P1.8 and 29 interaction tasks I1-I5. Existing task IDs are preserved.
The earlier 38-step source-review receipt remains unchanged historical evidence.

## What the interaction review added

The previous ligand-only extension design was incomplete for a primary pillar.
Current requirements include:

- Ligand-centered and interface-centered modes without a mandatory central ligand.
- Original native analyses, compound/directed/mediated participants, reversible
  grouping and explicit evaluated/missing/partial coverage.
- Comparison preserving method/state/context and temporal summaries with a
  declared denominator and non-simultaneity.
- Constrained reproducible layout, user pins, accessible glyph/legend semantics
  and bounded dense-interface policy.
- Actual mapped 2D/3D investigation plus stale/echo controls; fallback behavior
  alone cannot qualify the linked profile.
- Saved/reopened visual state and figures retaining scientific context.
- Received quantitative, energetic, pocket/projection, pharmacophore and
  peptide-detail profiles with their original scientific meanings.

Each view has its own finite minimum acceptance. A molecular-only intermediate
milestone does not complete the joint exploration baseline. Richer profile
work stays visible pending; all possible scientific engines are not mandatory
installed dependencies.

## Evidence and validation

The [conceptual source review](CONCEPTUAL_REVIEW.md) and
[prepared depiction contract](DEPICTION_CONTRACT.md) remain applicable to the
shared foundation. Scientific provider methods/results stay with their owners;
the renderer does not infer contacts or promote results into source assertions.

The [two-pillar adoption receipt](evidence/two_primary_pillars_20261114.json)
records old/new scope and task counts. The original
[source-inspection manifest](evidence/conceptual_review_20261114.json) is a
dated historical record, not a live plan counter.

Documentation checks cover local file/anchor links, task IDs/status counts,
decision/readiness consistency, historical-record preservation and whitespace.
`npm run check` executes canonical version/lock consistency, strict types, source formatting, 60 synthetic/real-provider-fixture
document/controller/scene tests and local link/anchor/ledger checks, plus six
separately compiled internal experiment tests. `npm run pack:check`
checks the local tarball's contents, offline independent consumer imports,
declarations and read-only types. `npm run example` exercises both supplied
documents and failed-replacement preservation. Exact scope is in
[SUPPLIED_INPUT_PROFILE.md](SUPPLIED_INPUT_PROFILE.md).

The maintainer selected Conda distribution and exact `X.Y.Z` library versions
without prefixes/suffixes. `npm run pack:conda:check` stages and relocates the
proposed `$PREFIX/share/molsyssketcher` payload, verifies file digests/version
and imports the installed ESM modules. The `noarch: generic` recipe is a draft;
conda-build is not installed in the inspected environment and no Conda archive
has been built, solved, installed or uploaded. The generic-resource profile
needs [central receiving](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6890741865).

Tests exercise source retention, reordered mappings, explicit directed wedge
endpoints, unsupported/partial states, exact parent generations, burst
coalescing, uncancellable occupancy, stale successes/failures, callback re-entry,
disposal and independent instances. Synthetic tests do not verify chemistry or drawings.

## Received RDKit source route

[Component #2](https://github.com/uibcdf/molsyssketcher/issues/2) adds a bounded
Python source-development adapter using RDKit 2026.09.2. It retains raw SMILES,
uses explicit H/parser/layout/drawing options, disables generated chiral H atoms,
checks actual origin mappings, and retains native MOL/SVG/isomeric-SMILES references.
Its 12-case corpus covers charged fragments, isotope/explicit H, two stereo pairs,
aromatic `[nH]`, fused and macrocyclic cases. The native MOL controls all round-trip;
the Node boundary receives every generated document.

There are 40 passing Python tests with pytest-receptor, including failure/absence,
unsupported chemistry, correspondence reordering/generated-object rejection,
support diagnostics, policy preservation and an actual Python-CLI-to-Node handoff.
Ruff and native corpus regeneration checks pass. Local support libraries are
controlled editables. The new CI job uses the declared Conda provider/test fixture;
its exact-head installed-tool results are recorded in issue #2.

See [RDKIT_PROVIDER.md](RDKIT_PROVIDER.md) and
[rdkit_preparation_20261115.json](evidence/rdkit_preparation_20261115.json).
ArgDigest, DepDigest and SMonitor serve the Python boundary. PyUnitWizard is
reviewed and host-policy preservation tested; drawing positions are nonphysical
and require no quantity conversion. This adapter is unshipped source tooling,
not a new installed Python facade or a qualified host service.

## Received first molecular SVG surface

[Component #3](https://github.com/uibcdf/molsyssketcher/issues/3) adds own chemical
primitives, immutable measured scenes, label masks, semantic viewport hits,
separate keyboard focus/selection, light/dark themes and contextual SVG export.
Failed replacements keep the accepted document/scene/DOM together; independent
instances own and dispose their probes, masks and listeners. The runtime still
loads no chemical engine or network transport implicitly.

The eight real-browser tests use the twelve actual prepared RDKit controls.
Actual generic sans-serif glyph bounds agree at multiple viewport sizes;
pointer labels/atoms/bonds, keyboard shortcuts, axis/endpoint variants, burst and
failed replacement, old DOM events, safe text/export and independent disposal
are exercised. The local browser is Google Chrome 157.0.8103.38; the CI job
installs Playwright's pinned Chromium separately and records its actual version.
The first CI attempt passed foundation/provider checks but refused browser
installation on the moving Ubuntu 26.04 default. The provider/browser job now
pins Ubuntu 24.04; the owning issue records the exact replacement CI run.

Native RDKit reconstructs all twelve isomeric results from DOM stroke counts
and wedge geometry, with supplied atom identity/endpoint membership. Four
reflection controls distinguish tetrahedral inversion from relative E/Z.
Light/dark galleries receive a finite engineering visual review, separate from
the native chemistry and metric checks. See [the exact profile](MOLECULAR_SVG_PROFILE.md)
and [source receipt](evidence/molecular_svg_20261115.json); exact-head CI and
retained browser artifacts are linked in issue #3.

Crowded-structure policy, scientific layers, full accessibility,
Qt, installed visual-consumer receiving and the Interaction View remain pending.
Generic fonts are not embedded in SVG exports. This increment completes no
primary-view or joint delivery gate.

## Received molecular navigation and hover

[Component #4](https://github.com/uibcdf/molsyssketcher/issues/4) extends the
first surface with an independent immutable camera, cursor-centered wheel/API
zoom, primary-pointer pan, explicit fit, keyboard alternatives and scoped hover.
Relative zoom is bounded to 0.25–8; positive uniform transforms preserve chemical
orientation. Camera/hover changes do not revise accepted chemistry or the scene.
Export retains the current camera/viewBox/crop and excludes transient indicators.

Fifteen actual-browser controls now cover navigation and the existing surface.
They include drag versus click, CSS-pixel displacement/tolerance, wheel delta
modes, high pixel density, keyboard pan/zoom/fit, explicit and observed resize,
capture loss before acquisition, blur/cancel, stale DOM events, bounded hover,
unsubscription, callback reentry, independent instances and disposal. Thirty-one
Node tests include pure camera invariants. Native RDKit receives all twelve
drawings after their actual DOM screen transforms, zoom and pan; its four
reflection controls retain the prior independent chemical scope.

The [profile](MOLECULAR_SVG_PROFILE.md) documents API, units, limits and reusable
tool ownership. The new [receipt](evidence/molecular_navigation_20261115.json)
records source-local results; the owning issue receives exact-head CI and retained
artifacts. The earlier scene/provider receipts remain historical. Pinch, crowded
structures, full accessible inspection, native interaction diagrams and actual
Qt/Conda visual delivery remain pending. P2.4/P3.1 remain partial with their
remaining acceptance visible; task counts are unchanged.

## Received internal editing feasibility (P2.5)

[Component #5](https://github.com/uibcdf/molsyssketcher/issues/5) receives the
seven architectural checks in [EDITOR.md](EDITOR.md): a typed bond-order edit,
exact-revision validation, coherent graph/selection/drawing undo and redo,
monotonic live generations, stale validation rejection, newest same-graph layout
intent and a read-only mutation barrier. Production editing remains P6.

The unshipped typed model imports the built public library. Four actual RDKit
validation states (three valid, one oxygen-valence invalid) and six attributed
layouts have native graph/MOL correspondence checks. Six internal Node controls,
four additional Python controls (44 total), and the internal Chromium journey
exercise the finite experiment. The browser suite now has 18 controls. Stored
native receipts are delivered in controlled order; this is not a live provider
service or a production job scheduler. A synthetic attached observation stays
historical after edit/undo; native interaction receiving remains pending.

The necessary public seam is read-only `setSelection(target, expectedSceneGeneration)`:
history restoration can apply semantic selection to a freshly accepted scene,
while old generations and unsafe payloads refuse explicitly. Original text and
provider-native draft declarations remain distinct, and computed H/labels come
from RDKit. Invalid drafts retain graph data without a fabricated current drawing.
The package/prefix checks exclude all experimental code and fixtures.

See [the receipt](evidence/editor_experiment_20261115.json); exact-head CI and
browser artifacts are recorded in the owning issue. P2.5 is done in its stated
architectural scope. No production editor, native interaction journey, delivery
gate or public package is qualified by this experiment.

## Received first native interaction inspection

[Component #7](https://github.com/uibcdf/molsyssketcher/issues/7) adds a bounded
source-development adapter for actual MolSysMT ionic results and public
immutable TypeScript page receiving/inspection. Native method/profile, producer,
execution, analysis-local identifiers, roles, original units, PBC images,
coverage and caller-declared exact parent/atom/frame bindings are retained.
Single-frame pages distinguish evaluated-empty, unevaluated and partial scope,
including last and zero-limit pages. Failed/stale replacement preserves accepted
inspection through the shared controller.

Seven actual native controls include analytical 0.3 nm contacts and a 0.2 nm
periodic contact. Eighteen Python tests use pytest-receptor and explicit
PyUnitWizard field/unit/seal handshakes; eight new Node tests receive recorded
pages and fresh native output also crosses the built public boundary. Host
nondefault diagnostics/unit policies are preserved. Source tools remain unshipped.
The browser retains quantity records opaquely: a supported reader is requested in
[PyUnitWizard #159](https://github.com/uibcdf/pyunitwizard/issues/159).
No interaction drawing or browser quantity decoding is claimed.

The [profile](MOLSYSMT_INTERACTIONS_PROFILE.md) and
[local receipt](evidence/molsysmt_interactions_20261115.json) separate the local
source HEAD, older runtime stamp and pre-existing native binary hash. CI builds
the exact provider source in a disposable prefix and retains actual origin and
fresh-page artifacts; exact candidate receiving is recorded in issue #7.
I1.2/I1.4 are partial. Real compound/mediated/native-complex profiles, two-mode
composition, live parent invalidation, browser/Qt transport and delivery gates
remain pending.

## Received native participant topology and grouping

[Component #9](https://github.com/uibcdf/molsyssketcher/issues/9) extends the
finite source inventory to pi-pi, Baker-Hubbard hydrogen bonds and exact
one/two-water paths. Eight additional native pages use public RDKit/MolSysMT
preparation/calculation; they retain compound constituents, directed roles,
parallel contacts, repeated mediators, original quantities/provenance and
periodic participant images. Versioned native method/leg definitions are
checked explicitly; TypeScript quantities remain opaque.

`buildInteractionTopology`, `findInteractionParticipantNode` and
`inspectInteractionTopology` supply immutable explicit grouping with complete
forward/reverse native membership and exact parent/analysis/frame context.
Every native occurrence remains a distinct ordered hyperedge, including repeated
node IDs after grouping. Expansion rebuilds from the unchanged native page.
Unknown/overlapping/partial groups refuse; retired instance/generation/analysis/
frame visual IDs do not resolve. This is membership for future diagrams, with
no layout, drawing or contact recalculation.

Ten added Node controls and eighteen added Python controls receive the bounded
profile (49 core Node, 36 native adapter Python controls total). The independent
packed consumer exercises mediated membership and read-only declarations. CI
builds the pinned MolSysMT native source and retains fresh participant pages;
exact candidate receiving is in issue #9. The
[topology profile](INTERACTION_TOPOLOGY_PROFILE.md) and
[local receipt](evidence/interaction_topology_20261115.json) name source identity,
analytical controls and limits. I1.3 is partial: positioned two-mode diagrams,
graphical membership/hits, real complex/interface and browser/Qt receiving
remain pending. Earlier receipts retain their historical scope.

## Received first two-mode interaction SVG composition

[Component #10](https://github.com/uibcdf/molsyssketcher/issues/10) adds the atomic
supplied diagram contract, measured scene, reused chemical SVG composition and
independent `InteractionSvgView`. Ligand mode fixes the focus's internal geometry;
interface mode receives explicit composite sides and mediator lanes. Native
occurrences remain distinct role-bearing cards, with every compound constituent,
repeated mediator, exact parent binding and original image inspectable.

Nine actual source controls join public MolSysMT observations and RDKit fragment
depictions through verified atom-map/bond correspondence. The browser receives
all 26 composed fragments; native RDKit reconstructs their actual DOM bond
primitives and screen-transformed coordinates. Eleven Node, five Python and
seven browser controls are added (60 core Node, 41 native adapter Python and
25 browser controls total). Failure preserves the accepted bundle; stale DOM,
burst/disposal, callbacks, exact-generation selection, unknown/coverage states,
CSS resize, light/dark and figure context are received. The local demo now links
to a two-mode gallery. Physical quantity records remain opaque.

The [profile](INTERACTION_SVG_PROFILE.md) and
[local receipt](evidence/interaction_svg_20261115.json) separate analytical,
scientific, graphical and installed-artifact scope. CI receives stored diagrams
in the RDKit job and freshly generated native/depiction bytes in the rebuilt
MolSysMT browser job. Exact-head CI/artifacts are recorded in issue #10.
I1.5/I1.6 and I2.1–I2.4/I2.6 are partial. Layout/pins, richer grammar, real
complex/interface corpora, quantitative inspection and live browser/Qt/3D host
receiving retain their remaining acceptance. No primary-view gate is complete.

## Resume here

1. P0.4: resolve the two-pillar ownership/admission and TypeScript-first
   repository profile under [suite #199](https://github.com/uibcdf/molsyssuite/issues/199).
2. Extend the real RDKit preparation route into a received host/transport and
   finish the needed finite operation/loss/corpus and measured-budget decisions.
3. Extend owner-native interaction receiving with actual molecular
   parent/participant/coverage context beyond the received ionic inspection profile;
   extend the received two-mode SVG composition into real complexes/interfaces,
   collision-aware routing, pins, accessible inspection and quantitative grammar.
4. Continue crowded-structure controls and scientific layers, and reuse prepared
   fragments for ligand-centered/two-sided composition. Preserve the now-received
   P2.5 generation/selection seams while keeping production editing in P6.
5. Continue the joint slice through native observations, save/reopen/export and
   actual browser/Qt receiving. Keep P6 production chemical editing last.

## Coordination and limits

The [two-pillar update](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6886729818)
has been delivered in the existing suite proposal, superseding its earlier
optional-module assessment.

- [MolSysSuite #199](https://github.com/uibcdf/molsyssuite/issues/199) owns the
  proposed component split/admission. Its earlier optional-module report is
  historical; the maintainer's local two-pillar product decision is accepted.
- [Sabueso #154](https://github.com/uibcdf/sabueso/issues/154) owns the first
  consumer/0.16.0 target. Exact finite candidate acceptance remains explicit.
- [Viewer #368](https://github.com/uibcdf/molsysviewer/issues/368) owns supported
  3D embedding/current-model work; actual map receiving remains necessary.
- Native interaction provider contracts and experimental limits remain owned
  by MolSysMT and the relevant domain components.

The canonical suite registry/guide inspection at
[e4d97ba1](https://github.com/uibcdf/molsyssuite/tree/e4d97ba1ac5341aa2d1cd50b56096098e59bb940)
did not register MolSysSketcher. Local product acceptance does not establish
formal membership, publication or qualified cross-component support.

The first implementation is tracked in
[component #1](https://github.com/uibcdf/molsyssketcher/issues/1). A
[central handoff](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6890500934)
records the missing TypeScript-first admission/profile at inspected central
checkout `b9852d973e96613a68cab7278491ff647bfd0b7d`.
Root instructions, the local reporting/check route and
[source/tool locations](WORKSPACE.md) exist; registered guide synchronization and
central profile receiving remain pending. No sibling code, shared environment,
registry or release was changed. Project-local npm development tools are installed.

The maintainer authorizes direct commits/pushes to this component and issue
publication in UIBCDF; third-party issue publication requires explicit permission
and confirmation. Package publication remains separately authorized.

The local evidence record is
[foundation_20261115.json](evidence/foundation_20261115.json). The source commit
containing it is the candidate identity; later CI evidence is linked in issue #1.

## Final design consistency review

The [final review](FINAL_DESIGN_REVIEW.md) finds the design sufficiently
coherent and complete to begin implementation. It corrects three bounded
issues: exact standalone/linked/full gate subsets, supplied-result versus live
calculation receiving, and bounded pending work.

At the 2026-11-14 review no product feature or microstep was added, and no runtime
validation was performed. Its 69-step, 5-done/64-pending counts are historical.
The current ledger above records the first executable foundation; the original
receipts and archived assessment remain unchanged. No G-M/G-I/G-J gate is complete.
