# Native participant topology and reversible grouping

[Component #9](https://github.com/uibcdf/molsyssketcher/issues/9) adds the first
I1.3 presentation topology. It consumes the
[received native pages](MOLSYSMT_INTERACTIONS_PROFILE.md) and keeps every native
occurrence as a separate ordered, role-bearing hyperedge. It supplies membership
for future diagram layout and inspection; it has no positions, drawing, chemical
detector or physical reconstruction.

## Public operations

```javascript
import {
  buildInteractionTopology,
  findInteractionParticipantNode,
  inspectInteractionTopology,
} from "@uibcdf/molsyssketcher";

const topology = buildInteractionTopology(page, {
  instanceId: "interaction-panel",
  generation: 1,
  groups: [{
    id: "water",
    label: "Mediator",
    members: [
      { occurrenceIndex: 0, participantIndex: 2 },
      { occurrenceIndex: 0, participantIndex: 3 },
    ],
  }],
});
const node = findInteractionParticipantNode(topology, {
  occurrenceIndex: 0, participantIndex: 2,
});
const pick = node ? inspectInteractionTopology(topology, node.id) : null;
```

The example explicitly groups two known occurrences of the same mediator in
the supplied one-water control. These numeric handles are local to its exact
analysis/frame. `participantIndex` is the position in the relation's ordered
participants, not an atom index or compact page-catalog position. Original
`occurrenceIndex` and `relationIndex` survive pagination unchanged.

Each node retains all original member keys, roles, complete constituent atom
bindings and native participant lattice images. Each observation retains all
its ordered incidences, including repeated node IDs after grouping. A ring keeps
all six constituents. A water shared between legs keeps both roles and its
image in each leg. Distinct native observations remain separate even when every
display endpoint has been grouped onto the same nodes. No direct endpoint bond
replaces a mediated path. The original prepared page, physical columns, coverage,
parameters, evidence and producer remain immutable in `topology.projection`.

Unlisted participants become separate nodes. Grouping is explicit: matching
labels, source indices, atom sets or coordinates never merge participants.
Groups can span declared parents, with each member retaining its own exact
binding. This does not assert chemical equivalence or create a new molecule.
Removing groups and rebuilding from the same projection expands the complete
membership without calculation or source mutation. This operation supplies no
implicit parent, analysis, frame or quantity aggregation.

`findInteractionParticipantNode` provides native-to-presentation lookup within
the supplied topology. `inspectInteractionTopology` reverses a current visual
ID to every member and exact analysis/parent/frame context, or returns null
for an unknown ID. IDs contain the instance, generation, exact analysis
reference and queried frame. Other instances, generations, analyses and frames
cannot resolve an old ID. The host must advance generation whenever it rebuilds
an accepted presentation; IDs are not scientific persistence identifiers.

Options are owned/frozen through the strict JSON boundary. Nonpositive or
unsafe generations, unknown fields, accessors, empty groups, duplicate group
IDs, repeated/overlapping member assignments and absent participants refuse.
Partial atom subsets are not group members: a compound participant is always
whole. The grouping limit is 2048 groups/assigned participant memberships;
the native page's existing axis, row, constituent and JSON bounds still apply.
An empty/unevaluated page retains its distinct coverage with zero nodes and
observations. Geometry, glyphs, visual hits, accessibility and host lifecycle
remain separate receiving work.

## Extended native source inventory

The Python adapter now receives four exact native method/profile/definition
contracts from MolSysMT source `6deb0200cd7e384128eded46caaf751a57e65bc6`:

| Producer family | Selected method/profile | Physical columns |
| --- | --- | --- |
| Ionic | `minimum_distance` / `native` | distance in nm, two charges in e |
| Pi-pi | `centroid_angle_offset` / `least_squares` | distance, two offsets, four deviations in nm; plane angle in radians |
| Hydrogen bonds | `baker_hubbard` / `nitrogen_oxygen` | three distances in nm and two angles in radians |
| Water bridges | `hbond_water_path` / `indexed_water`, exact order 1 or 2 | the five hydrogen-bond columns per directed leg; exact Baker-Hubbard leg definition retained |

Each versioned `method_definition` is checked explicitly; unknown definitions,
profiles, water orders and leg profiles refuse. This is a consumer receiving
inventory, not new detection rules or an alternative native-result codec.
Other scientific profiles remain pending. Quantity records use the same public
PyUnitWizard field/unit/seal handshake with explicit nm/e/radians receiver
units. Standard host units are preserved, including angstrom/degrees controls.
TypeScript retains quantities opaquely pending
[PyUnitWizard #159](https://github.com/uibcdf/pyunitwizard/issues/159).

## Native controls and limits

`devtools.molsysmt_adapter.participant_corpus` uses public RDKit SMILES/H
preparation and public MolSysMT conversion/calculation. It does not import
provider-private fixture builders or chemical-state mutators. Original input
strings and RDKit version/build are retained in the corpus metadata. Actual
converted atom IDs/names/order are checked before declaring source/fragment
bindings. The eight
pages in `tests/data/molsysmt-participants.json` cover:

- Symmetric six-member rings in parallel (0.35 nm), edge-to-face (0.4 nm) and
  evaluated-empty frames, sharing one native relation.
- Two distinct directed hydrogen bonds with separate donors and one shared
  acceptor; explicit grouping preserves both observations.
- Exact one-water/two-water paths with six/nine ordered roles, 0.3 nm D-A
  legs, 0.2 nm H-A legs and pi-radian D-H-A angles.
- A reversed middle leg and a periodic two-water path with repeated mediator
  images preserved from the native result.

These are analytical geometries with declared chemistry, not relaxed structures,
ligand complexes, protein interfaces or an independent detector benchmark.
They receive the adapter/membership contract and informative scalar controls;
scientific validation of the detector family remains with MolSysMT. The original
seven ionic controls and their historical receipt remain unchanged.

```bash
npm run test:interactions
node --test --test-isolation=none tests/interaction-topology.test.mjs
python -m devtools.molsysmt_adapter.participant_corpus --output /tmp/participant-pages.json
npm run example
```

Eighteen added Python controls (36 native adapter controls total) and ten added
Node topology controls exercise actual native fields, unit refusal, incomplete
constituents, original producer retention, bounded pages, forward/reverse
membership, grouping/expansion, parallel observations, PBC roles and scoped IDs.
Fresh native JSON also crosses the built public topology API. The packed
independent consumer checks exports, actual mediated membership and read-only
declarations. None is graphical interaction evidence.

CI adds RDKit only to its disposable native-provider test closure, builds the
same pinned MolSysMT source/Rust extension, verifies dependency closure, and
retains origin plus fresh ionic/participant pages with their actual producer
metadata. The [local receipt](evidence/interaction_topology_20261115.json)
keeps local source/runtime/native binary identity separate; exact candidate
CI and artifact identity are recorded in issue #9. No shared environment,
sibling source, release or public distribution artifact is changed.

I1.3 is partial. Positioned ligand-centered/interface-centered diagrams,
role-aware graphical grammar, actual visual membership/hits, complex/interface
corpora and browser/Qt host receiving remain pending. No primary-view delivery
gate is completed by this topology.
