# Current checkpoint

Updated: **2026-11-15**. Current milestone: partial M0/P1 and first molecular SVG increment.

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
fit/resize, contextual SVG export and owned-resource disposal. There is no
production chemical/native-result adapter, production editor, published package
or fully qualified browser/Qt/platform profile. A bounded real
RDKit source-development route and its native chemical controls now exist;
this is separate from a production provider/host adapter. A local
packed consumer is tested; this does not establish a public installation route.
Package version `0.0.0` is a private tooling placeholder, not a release decision.

| Readiness axis | State |
| --- | --- |
| Shared foundation | partial: executable supplied-document/reference/controller subset; toolchain and license received; formal admission and actual scientific receiving pending |
| Molecular View | partial: first measured SVG surface and finite real-browser/native drawing controls; full exploration/Qt/scientific acceptance pending |
| Interaction View | todo: planned native projection, two diagram modes, investigation and domain profiles |
| Production editor | todo: final major capability after exploration foundations |

## Integrated plan

The ledger has **69 microsteps: 6 done, 19 partial and 44 todo**.

Completed items P0.1, P0.2, P0.3, P0.7 and P0.8 are documentation/source-review
work only. P0.5 is now complete. P0.4/P0.6, P1.1/P1.4/P1.6/P1.7/P1.8 and
I1.1/P5.3 are partial, with remaining acceptance named in the ledger. P1.2/P1.3/P1.5
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
`npm run check` executes canonical version/lock consistency, strict types, source formatting, 28 synthetic/real-provider-fixture
document/controller/scene tests and local link/anchor/ledger checks. `npm run pack:check`
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

Native RDKit reconstructs all twelve isomeric results from DOM stroke counts
and wedge geometry, with supplied atom identity/endpoint membership. Four
reflection controls distinguish tetrahedral inversion from relative E/Z.
Light/dark galleries receive a finite engineering visual review, separate from
the native chemistry and metric checks. See [the exact profile](MOLECULAR_SVG_PROFILE.md)
and [source receipt](evidence/molecular_svg_20261115.json); exact-head CI and
retained browser artifacts are linked in issue #3.

Pan/zoom, crowded-structure policy, hover/scientific layers, full accessibility,
Qt, installed visual-consumer receiving and the Interaction View remain pending.
Generic fonts are not embedded in SVG exports. This increment completes no
primary-view or joint delivery gate.

## Resume here

1. P0.4: resolve the two-pillar ownership/admission and TypeScript-first
   repository profile under [suite #199](https://github.com/uibcdf/molsyssuite/issues/199).
2. Extend the real RDKit preparation route into a received host/transport and
   finish the needed finite operation/loss/corpus and measured-budget decisions.
3. Receive the first owner-native interaction result with actual molecular
   parent/participant/coverage context; preserve independent pillar progress.
4. Extend the first SVG foundation with pan/zoom, crowded-structure controls
   and scientific layers; reuse prepared fragments for ligand-centered and
   two-sided composition. Receive native interaction results independently.
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
