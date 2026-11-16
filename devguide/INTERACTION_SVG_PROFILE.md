# First two-mode interaction SVG surface

[Component #10](https://github.com/uibcdf/molsyssketcher/issues/10) receives a
bounded supplied/source-development composition. Both modes reuse the accepted
molecular scene/renderer and [native topology](INTERACTION_TOPOLOGY_PROFILE.md).
This is an inspectable schematic, with finite analytical controls, not complete
interaction exploration, a production transport or a primary-view delivery gate.

## Atomic supplied input

`prepareInteractionDiagram` accepts exactly:

```javascript
{
  schemaVersion: 1,
  kind: "interaction-diagram",
  id: "declared-diagram",
  page: suppliedNativeInteractionPage,
  parents: [{ parentIndex: 0, label: "Declared parent", molecule: preparedMolecule }],
  composition: { mode: "ligand-centered", focusParentIndex: 0 },
  groups: [],
}
```

Supply every native reference-document parent once. Each prepared depiction must
match its exact owner/generation, chemical state, structure and preparation.
Every depicted atom needs its native binding: parent semantic IDs must match,
with no extra generated drawing atoms or inferred label/index correspondence.
This checks a caller's explicit declaration, not arbitrary external source
authentication. The native page remains unchanged and quantities remain opaque.

The second composition is
`{mode:"interface-centered", left:[...], right:[...], mediators:[...]}`.
Left and right are nonempty; both sides and the mediator list must form an exact
disjoint partition of all parents. A side can contain several parents. There is
no mandatory central ligand or implicit biological side classification. The
composition mode must match the reference document. Native observations within
a declared side are retained; the layout does not change the scientific query.

`createInteractionDiagramController` provides the existing bounded atomic
replacement protocol. Failure preserves the complete accepted molecular/native
bundle. These immutable supplied snapshots do not subscribe to live external
parent changes; actual host invalidation remains I1.5 work.

## Scene and rendering

`buildInteractionDiagramScene(input, textMeasurer, sceneOptions)` builds measured
scenes with the `fixed-fragments-lanes@1` layout. The ligand focus keeps its exact
local scene coordinates with zero translation while context fragments occupy
outer columns. Interface sides occupy outer lanes and declared mediators the
middle lane. Each chemical scene is translated only. Root SVG fit can uniformly
scale the whole figure; no chemical atom is rearranged by context layout.

Each native occurrence has a separate labeled observation card, with every
ordered participant role and constituent count. Role connections use all
constituent atom positions; their schematic anchor is the arithmetic centroid,
with an individual halo on every constituent. A ring is never replaced by one
arbitrary source atom. Water paths retain six/nine roles and repeated mediator
atoms, with native images kept in inspection. Diagram positions do not apply
lattice vectors or reconstruct physical geometry. Connection lengths are not
physical distances. No interaction detector or quantity decoder runs in the web
runtime.

Known native types receive explicit names; unknown types retain inspection with
an explicit unknown label. The generic dotted incidence grammar preserves roles
without imposing an unsupported universal arrow convention. Method-defined
specialist glyphs and quantitative tooltips remain pending. Explicit topology
groups appear as selectable summary targets, while every native role remains
visible. Hiding a summary does not hide or aggregate scientific observations.

`renderInteractionDiagramSvg(scene, document)` reuses the molecular renderer,
its protected generic sans-serif typography, bond primitives and unique masks.
A shared label mask clips scientific connections behind chemical text. Nested
fragment viewport transforms agree with the scene's translated atom anchors.
Individual fragment masks/IDs and diagram metadata remain independently owned.
All user/source labels and metadata use text nodes, with no HTML interpretation.

The first drawing budget is **eight parents, 128 total depicted atoms, eight
native occurrences and 48 participant incidences**. Canvas extents are at most
16384 drawing units per axis. The existing native page/JSON bounds also apply.
Over-budget input refuses; the host must explicitly query a smaller page.
These bounds are not accepted responsiveness or dense-interface budgets.
The reproducible baseline does not promise collision-free routing, user pins,
continuity across changed contexts or an optimized force/constraint solver.

## Mounted view and inspection

```javascript
import { createInteractionSvgView } from "@uibcdf/molsyssketcher";
const view = createInteractionSvgView(mount, { instanceId: "interactions" });
await view.ready;
await view.replace(suppliedDiagram);
const stop = view.subscribeSelection(pick => host.inspect(pick));
view.resize(1000, 760);
const svg = view.exportSvg();
stop();
view.dispose();
```

`InteractionSvgView` publishes document/scene/DOM coherently and retains the last
accepted bundle on failure. Bursts keep one running and the newest queued input;
retired DOM events cannot select a new scene. Instances own their probes,
listeners and roots and preserve unrelated host content on disposal.

Pointer selection distinguishes chemical atoms/bonds, role rows/connections,
observation cards and explicit group summaries. Chemical hits include their
exact parent context and all incident native memberships. Role picks include
both the specific member and its complete topology group. Observation picks
retain all roles rather than an invented pair. Hits use the actual positive SVG
screen transform and a six CSS-pixel line tolerance; native `DOMMatrix`
coefficients need not be enumerable.

Arrow keys traverse observation/role/group targets; Enter selects and Escape
clears. Focus and selection are separate. `setSelection(visualId, expectedSceneGeneration)`
admits only current native presentation targets, or null. Independent molecular
atom keyboard navigation, hover, pan/zoom, advanced accessible inspection,
interactive chemical-detail expansion and filters remain pending for this view.

SVG export retains exact native/parent references, method/parameters, producer
and reader, frame, scope, page truncation, original unit declarations, grouping,
layout and depiction provenance. It excludes transient selection/focus and does not add prepared
raw-input text. This is a figure-context record, not native analysis persistence or
reopen support. Generic fonts are not embedded. Physical quantity interpretation
remains pending [PyUnitWizard #159](https://github.com/uibcdf/pyunitwizard/issues/159).

## Native preparation and executed receiving

The unshipped `devtools.molsysmt_adapter.diagram_corpus` joins the existing public
MolSysMT ionic/participant boundary and RDKit `prepare_smiles` route. Retained
derived fragment SMILES carry standard atom-map labels. The fixture host verifies
actual parsed atom identity, complete fragment bond correspondence and native
source bindings before supplying a diagram; it does not infer equal indices
after reordering. Original source SMILES and native MOL references are retained
in test metadata. The old preparation routes/receipts stay unchanged.

Nine native diagram controls include both modes for the same ring pair, an
edge-to-face ring observation, evaluated-empty rings, a composite two-donor
interface and one/two-water, reversed-leg and periodic paths. Their 26 actual
prepared fragments are reconstructed by native RDKit from DOM bond primitives
and screen-transformed coordinates, independently of semantic style tags.
These are analytical sources, not relaxed ligand complexes, protein interfaces,
a new detector benchmark or broad composed-stereochemistry qualification.

Eleven new Node controls receive the atomic contract, fixed focus, exact maps,
source retention, unknowns, explicit extent refusal and non-enumerable transforms.
Five new Python controls (41 native adapter tests total) receive actual maps,
native MOL chemistry, nondefault unit-policy preservation and fresh Python-to-Node
handoff. Seven new browser controls (25 total with the molecular profile) receive
metrics/transforms, native/chemical picks, resize, keyboard/API selection, failed
and burst replacement, old events, independent disposal, inert labels, callback
reentry, grouping summaries, light/dark figures and export. The local gallery
is linked from `npm run demo`.

```bash
npm run check
npm run test:interactions
npm run test:browser
python -m devtools.check_interaction_svg /path/to/interaction-evidence/drawings.json
```

CI receives stored native diagrams in the RDKit browser job. The separate native
job rebuilds the pinned MolSysMT source, generates fresh mapped diagrams with its
actual producer metadata, then runs the interaction browser/native drawing
receiving on those exact generated bytes. Its disposable input replacement is
explicit; no shared workspace/environment is changed. Both artifact scopes are
retained for 14 days. Exact candidate runs and artifacts are recorded in issue
#10; the [local receipt](evidence/interaction_svg_20261115.json) records source,
runtime/binary identity, commands and limits separately.

I1.5/I1.6 and I2.1–I2.4/I2.6 are partial. Real complex/interface receiving,
graphical specialist/quantitative grammar, routing/pins, dense policy, live
parent invalidation, browser/Qt/3D host transport and every primary-view delivery
gate retain their remaining acceptance.
