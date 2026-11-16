# First native interaction inspection profile

[Component #7](https://github.com/uibcdf/molsyssketcher/issues/7) receives a finite
I1.2/I1.4 increment. The unshipped Python adapter reads an existing native
`molsysmt.Interactions`; the dependency-free TypeScript package receives its
bounded inspection envelope. MolSysMT owns interaction calculation, classification,
queries, native identifiers and scientific provenance. No interaction diagram,
production transport, linked 3D journey or installed Python facade is delivered.

## Native boundary

`devtools.molsysmt_adapter.project_interactions(analysis, request)` requires an
explicit reference document, exact result reference, one structure index, page
offset/limit and caller-declared atom/frame correspondences. The received source
route is MolSysMT commit
[`6deb0200`](https://github.com/uibcdf/molsysmt/commit/6deb0200cd7e384128eded46caaf751a57e65bc6),
using its public ionic `minimum_distance`/`native` result and
`query(structure_indices=[...]).to_page(...)` API with schema
`molsysmt.interactions.page@1`. Other producer methods refuse explicitly in this
source adapter. No full occurrence-dictionary serialization or fallback
calculation is used.

The adapter retains the native page's producer function, selected method/profile,
method definition, parameters, attribution, producer software, execution records,
evidence, quantities, source maps, PBC images and compact participant catalog.
The current reader version is separate from the producer software. A source map
or `source_id` declares provenance; it does not authenticate source identity.

`correspondence.authority` must be `caller-declared@1`. Each observed constituent
atom needs an explicit native index, original source index, parent index and
semantic atom ID. Every document parent needs a frame binding matching its exact
structure context. The analysis dependency must match all ordered parent
contexts, including their owner/generation, chemical state and preparation.
Bindings are checked for ambiguity, completeness and agreement with native
source maps. The host remains responsible for establishing those identities
against its actual current molecular objects before making the declaration;
this adapter cannot authenticate an arbitrary host assertion. Many-parent
structure references are never inferred by matching numeric indices.

Native occurrence and relation handles remain local to the exact analysis.
Compact catalog positions are separate from relation handles, including on
later pages. Participants retain roles and variable-length constituent atom
sets; inspection never flattens a compound participant to an invented pair.
Actual compound/directed/mediated detector profiles and reversible visual maps
remain I1.3 work. A clearly synthetic receiving control exercises a compound
constituent list without claiming such detection.

## Coverage and bounds

The queried frame carries explicit evaluated coverage and the original evaluation
scope. `inspectInteractionPage` distinguishes `evaluated`, `evaluated-empty`
and `unevaluated`. A page remains partial when its offset is nonzero or its
row count is below `total_count`, even if `next_offset` is null. A zero-limit
page with observations elsewhere is not reported as an evaluated negative.

This first route bounds local atom/structure axes to 4096 each, document parents
to eight, rows to 256, copied constituent memberships to 2048 per page and the
serialized Python envelope to one million characters. TypeScript additionally
uses the shared strict JSON snapshot bounds. Metadata/source axes are retained;
the page is not a benchmark or a streaming trajectory claim. Missing source
indices for a required binding, unsupported methods/schemas or excessive extents
refuse explicitly. Source failures retain their native cause in Python and use
catalog diagnostics without logging payloads. A failed browser/controller
replacement preserves its last accepted document; it does not manufacture a
scientific failed/empty observation. More query/filter/failure profiles remain
pending.

## Physical quantities

Native distance and charge columns retain their declared units. Python builds
PyUnitWizard `QuantityRecord` records and receives them through
`QuantityRecord.from_dict(...).to_quantity(field=..., unit=..., form="pint")`,
with explicit receiver units `nm` and `e`. Field/seal/incompatible-unit or column
correspondence failures refuse. No host standard-unit policy is consulted for
these handshakes or overwritten by this adapter.

The browser retains records **opaquely**. Its validation checks field/format
and column correspondence, not cryptographic seals or dimensional conversion.
`reader.quantityVerification: "python-only"` is the source adapter's declaration,
not independently verified browser evidence. `inspectInteractionPage` exposes
participant data and quantity field names, with `quantities: "opaque"`; it does
not expose interpreted numerical measurements. No JavaScript unit/seal codec
has been copied from private owner code. A supported browser receiving route is
requested in [PyUnitWizard #159](https://github.com/uibcdf/pyunitwizard/issues/159).
Until received, graphical quantity inspection and untrusted-browser record
verification remain pending.

ArgDigest validates the explicit Python request before loading the provider;
DepDigest handles selected soft-provider availability; SMonitor supplies
metadata-only signals and catalog exceptions. Importing the source adapter loads
no MolSysMT engine and preserves the application's diagnostics/unit policies.
The source tools are excluded from the JavaScript package and Conda resource
layout.

## Public TypeScript receiving

```javascript
import {
  createInteractionPageController,
  inspectInteractionPage,
  prepareInteractionPage,
} from "@uibcdf/molsyssketcher";

const page = prepareInteractionPage(suppliedNativeEnvelope);
const inspection = inspectInteractionPage(page);
const controller = createInteractionPageController({ instanceId: "analysis-panel" });
await controller.replace(page);
controller.dispose();
```

The JSON validator owns/freezes input without executing accessors, checks native
CSR/page/coverage/source-map coherence, and rejects unknown profile fields.
The controller reuses bounded newest-intent replacement, accepted-data
preservation and stale/disposal guards. It does not rebind an old analysis to a
new parent generation. Cross-component live parent invalidation remains I1.5.
`npm run example` includes the seven recorded native inspection controls.

## Evidence and reproduction

`tests/data/molsysmt-interactions.json` contains seven pages from actual public
MolSysMT ionic calculations on analytical ions: two 0.3 nm observations,
first/last/zero-limit pages, evaluated-empty and unevaluated frames, and a 0.2 nm
periodic contact with participant image vectors. The known unbonded ion control
uses the public `assume_complete_connectivity=True` option; its scientific
assumption stays in native parameters. These are analytical controls, not a
ligand-complex, protein-interface or native drawing corpus.

```bash
npm run test:interactions
node --test --test-isolation=none tests/interaction-page.test.mjs
python -m devtools.molsysmt_adapter.corpus --output /tmp/native-pages.json
```

The Python selector has 18 actual-provider/unit/identity/failure/policy controls,
including fresh native JSON received by the built public Node module. Eight
additional Node controls receive recorded native pages, inspect exact roles and
coverage, reject malformed bindings/columns, and retire stale replacements.
They do not exercise a graphical interaction surface. Existing molecular browser
controls retain their independent scope.

The local MolSysMT runtime/metadata stamp is `0.23.0+904.gff25f1202`, older than
the inspected source HEAD. It is retained as observed, not restamped. The local
receipt records the pre-existing native binary hash separately; a clean source
checkout alone cannot prove that binary was built from that HEAD. CI instead
checks out the exact provider source and builds its Rust extension in a
disposable fully provisioned prefix, then records the actual stamp/binary and
fresh native pages. Tests preserve each producer's metadata rather than claiming
byte identity across differently stamped builds. Exact candidate CI is linked
from issue #7. No published MolSysMT/Sketcher pair is qualified by this route.

See [the local receipt](evidence/molsysmt_interactions_20261115.json).
I1.2/I1.4 are partial; two-mode diagrams, broader participant science, quantity
rendering, save/reopen, real molecular composition, browser/Qt host receiving and
all primary-view delivery gates remain pending.
