# Initial executable supplied-input profile

Implemented under [MolSysSketcher #1](https://github.com/uibcdf/molsyssketcher/issues/1),
2026-11-15. This experimental foundation accepts attributed, already prepared
JSON documents. It does not yet render, parse chemistry, read owner-native
interaction results, or run a scientific calculation. The private package's
`0.0.0` is a build placeholder, not a selected public release.

## Public surface and example

The package exports `prepareSuppliedMolecule`,
`prepareSuppliedInteractionDocument`, `sameMolecularContext`,
`createMolecularController`, `createInteractionController`, `DocumentController`,
`SketcherError`, `INPUT_LIMITS` and their public TypeScript types. Run
`npm run example` for a complete synthetic example using the built exports.
The exact field definitions are in `src/types.ts`; the examples are maintained
in `tests/fixtures.mjs`. No consumer imports toolkit internals.

```typescript
import { createMolecularController } from '@uibcdf/molsyssketcher';

const controller = createMolecularController({ instanceId: 'host-view-1' });
const result = await controller.replace(suppliedPreparedDocument);
if (result.status === 'accepted') {
  inspect(result.snapshot.document, result.snapshot.generation);
}
controller.dispose();
```

Here `suppliedPreparedDocument` is an attributed JSON document satisfying the
profile, and `inspect` is host behavior. The core loads no provider or network
transport implicitly. Factories use the supplied validators; the generic
controller accepts an explicit validator and still snapshots its output.
Each mounted host instance must supply its own live `instanceId`.

## Finite feature matrix

| Boundary | Accepted behavior | Explicit limitation |
| --- | --- | --- |
| Original declaration | Preserve nonempty text, declared format and exact source reference | No SMILES/MOL/SDF parsing or chemical export |
| Molecular context | Owner-scoped molecular and preparation references, chemical state and structure | No identity inference or 2D/3D mapping |
| Semantic projection | Stable atom/bond handles and unique provider indices, explicit bond endpoints, supplied element/isotope/charge/H fields | Structural checks do not establish chemical validity or source-to-graph chemical fidelity |
| Prepared depiction | `supplied-bijective@1`, separate display IDs, exact atom/bond bijections, finite drawing coordinates and explicit axes | Generated/condensed objects, other profiles and reflection conventions are refused |
| Bond presentation | Supplied single/double/triple/wavy strokes and solid/hashed wedges with an explicit originating display endpoint | No stereo perception, CIP assignment, rendering or graphical correctness claim |
| Coverage | Complete versus partial preparation, with explicit missing information | Partial data is never promoted to complete preparation |
| Interaction document | Either mode label, exact immutable parents and owner-native analysis references | No contacts, participants, coverage query, side layout or result codec yet |
| Replacement | Immutable candidate/accepted snapshots, generations, latest intent, bounded queue and failure preservation | One destination; no edit history, independent scientific jobs or shared service scheduler |

This schema is an experimental view projection, not a substitute for CommonChem,
MolSysMT's molecular model or its native interaction-result persistence. An
analysis reference identifies a result; this increment does not claim it has
resolved or verified that result. User persistence and migrations remain pending.

Unknown schema versions, fields, styles, axes and mapping profiles fail
explicitly. Retain unsupported original material outside a failed replacement;
the previously accepted document remains available. There is no automatic
normalization or fallback provider.

## Transaction and scheduling contract

`replace` returns an accepted, failed, superseded or disposed result. Runtime
lifecycle, the accepted snapshot and latest operation status are independent.
An accepted generation advances only on successful acceptance; later equivalent
content receives a newer generation. Request identities never rewind.

Each controller permits one preparation call in flight and one newest queued
replacement. A newer request aborts the older signal and retires older intent;
the slot stays occupied until the call actually finishes. Superseded queued
promises settle immediately and their payloads are released. Disposal clears
accepted/queued data and prevents an eventual provider completion from committing.
Provider abort callbacks observe coherent state and may reenter safely.

This scheduler applies only to explicitly supersedable document replacement.
Future explicit scientific jobs keep their owner's lifecycle. A selected live
adapter still needs operation timeouts, process/service capacity and actual
provider residency receiving. A provider that ignores cancellation may occupy
its slot indefinitely; the core starts no second execution behind it.

## Bounds and corpus

The initial fixed ingress limits are 32 nesting levels, 100,000 visited JSON
nodes, 1,000,000 UTF-16 code units of accumulated text including object keys,
4,096 semantic/display atoms, 8,192 semantic/display bonds, 64 parents and
64 analysis references. These are admission limits, not measured scientific
scale or performance claims. Inputs must be plain JSON data with finite numbers;
cycles, accessors, symbols, sparse arrays and runtime objects are refused.

The synthetic corpus exercises reordered semantic/provider/display identifiers,
retained source newlines, charged/isotopic fields, explicit wedge origins,
missing mappings, partial preparation, stale structure/preparation references,
duplicate labels across owners, failed replacement, burst replacement,
uncancellable work, callback re-entry and independent instance disposal.
Synthetic labels and coordinates are not an RDKit or molecular-science oracle.

P0.6 still needs actual provider routes, public molecular/complex/interface
corpora, chemical operation/loss matrices, browser/Qt scenarios and accepted
numerical performance budgets. Full native observations, both visual journeys,
save/reopen and graphical export remain the next joint-slice work.
