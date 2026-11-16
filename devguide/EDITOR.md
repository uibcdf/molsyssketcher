# Editing after exploration

This document concerns chemical editing. Presentation editing of interaction
diagrams—pins, node placement, filters and annotations—is part of the core
exploration capability and does not wait for P6.

Status: the bounded internal P2.5 experiment is received under
[component #5](https://github.com/uibcdf/molsyssketcher/issues/5).
Production editing remains the final planned stage, P6.

## Why defer editing

The viewer, scientific layers and host integration provide useful software
before editing is complete. Editing introduces draft chemistry, tool semantics,
history, stereo changes and export obligations that need their own acceptance.

The shared foundation must nevertheless contain stable object IDs, revisions,
separate chemical/layout state, typed transitions, provider boundaries and an
explicit read-only capability.

## Early feasibility check

Run P2.5 before treating the scene/document contract as stable:

1. Load a supported structure and retain its original declaration.
2. Change one bond in an internal draft through a typed operation.
3. Request validation against the exact draft revision.
4. Undo the change and verify graph, IDs and displayed state.
5. Verify undo advanced the live generation instead of rewinding it, then
   complete an old request and verify it cannot overwrite restored content.
6. Complete competing same-graph layout requests in reverse order and verify
   that only the applicable destination intent is accepted.
7. Attempt the mutation in read-only mode and verify rejection.

This is a bounded architectural experiment. It does not require public editing
tools, a complete history engine, all chemical classes or a production editor.
Keep its results and adjust the document contract if the experiment reveals
an obstacle.

## Received P2.5 experiment (2026-11-15)

The typed model is `devtools/editor_experiment/session.ts`, built separately
into ignored `.experiment/` assets. It imports the built public library and is
absent from the ESM tarball and proposed Conda resource payload. It is a
developer experiment, not a public editing API, chemical interchange codec,
production history engine or live provider transport.

The finite profile has ethanol's three neutral, nonisotopic C/C/O atoms,
implicit hydrogens, fixed topology and a typed `set-bond-order` operation.
RDKit constructs the graph declarations, sanitizes the changed molecule,
recomputes implicit H, prepares the valid depictions and verifies native MOL
round trips with actual index/endpoint checks. Initial `CCO\n`, `C=CO` and
`CC=O` are valid controls; neutral C–C≡O is invalid by native oxygen valence.
Three valid states each have an original and rigidly rotated preparation.
No chemical validity is inferred from the drawing.

`tests/data/editor-experiment.json` contains these stored native reports. The
browser receives them through explicitly controlled deliveries; it does not
execute RDKit or represent a live asynchronous service. Python SDK integration
is reused through `prepare_smiles`; fixed test-only native sanitization and
coordinate-transform controls add no production Python boundary. All drawing
positions are nonphysical. ArgDigest/DepDigest/SMonitor retain their existing
source-adapter roles; no PyUnitWizard conversion or application-policy change
is introduced.

| Contract check | Executed evidence |
| --- | --- |
| Load and retain source | Original `CCO\n` and exact source/context stay frozen separately from draft-native declarations |
| Typed bond edit | One draft bond changes to double; source atom/bond IDs stay stable, and old prepared labels are hidden while no current preparation exists |
| Exact-revision validation | An opaque in-process ticket binds instance, live draft generation, destination and monotonically increasing request intent |
| Undo coherent content | Browser restores the original graph, preparation, semantic selection and visible bond indicators; redo restores the edited native preparation |
| Undo and stale validation | Undo advances the live draft generation; an older real native report delivered afterward is stale even when graph content matches again |
| Same-graph layout competition | Two controlled native layout deliveries complete newest first; the older response cannot replace the accepted rotated layout |
| Read-only barrier | Apply/undo/redo reject in a read-only experiment; selection remains an exploration operation |

History retains eight content snapshots (graph, matching preparation and
selection). A new edit clears redo. Chemical transitions reset validation and
retire both destinations. At most two receipts per destination are outstanding;
retired tickets retain their slot until received. This bounds the test ledger;
it neither starts/cancels provider jobs nor supplies a production scheduler.
Foreign, duplicate, wrong-graph and disposed receipts cannot publish.

Invalid drafts retain their declared bond orders without fabricated current
depictions. Actual native invalidity, unvalidated/pending, unsupported and
execution-failed states are separate. Unsupported/failure controls are synthetic
receipt-contract checks; they do not qualify an additional scientific provider.

Undo may reuse an attributed preparation from history, with its original
provider/source references and explicit basis generation. It does not claim a
fresh validation for the restored live revision. A declared synthetic observation
reference becomes historical after an edit and stays historical after undo;
this does not receive native interactions or complete I3/P6 invalidation.

The architectural adjustment is a read-only public view operation:
`view.setSelection(target, expectedSceneGeneration)`. The target contains only
`kind` and `semanticId`, or is null to clear. It resolves exact display/context
IDs from the current scene and refuses an old generation, unknown target or
executable/accessor payload. The host restores a selection using the **new**
accepted scene generation after replacing its depiction. Draft generation,
scene generation and provider preparation identity stay distinct. This method
does not change chemistry or infer external correspondence.

Ketcher's undo/redo specification and `Editor.history.test.ts` were inspected
at `cfbc2c84a4d9d3476ec4388eb595e30f9df77a2f`: atomic restoration, bounded
history and redo-branch invalidation informed the receiving criteria. No
reference implementation was incorporated. The experiment uses its own small
history model, independent of Ketcher's production modes and command engine.

Run `npm run test:experiment` for the six typed-model Node controls. `npm run check`
includes these alongside the 31 core tests. `npm run test:browser` now has 18
actual Chromium controls, including the internal journey and selection seam.
Use `npm run corpus:experiment:check` and
`python -m pytest --receptor=llm devtools/tests` for native reproduction and 44
Python tests. Native fixture generation is
`python -m devtools.editor_experiment.corpus` and requires explicit review of
changed receipts. The current source receipt is
[editor_experiment_20261115.json](evidence/editor_experiment_20261115.json).

`npm run demo` links to `/examples/editor-experiment.html`. It labels the fixed
native-receipt scope and preserves invalid drafts visibly as data. Its limited
engineering review does not qualify a production editor, all chemical classes,
native interactions, Qt, saved histories or a public installation route.

## Production editing capabilities

Introduce explicit edit tools for atoms and bonds, selection/deletion, fragment
placement and coordinate manipulation. Extend rings/templates and advanced
features after the initial supported scope is validated.

Define each gesture's chemical meaning. Dragging an atom in a drawing changes
layout; changing its element or bond order changes chemistry. Stereo-sensitive
operations, including mirroring, need explicit provider-backed semantics.
Recheck the prepared depiction after orientation-sensitive changes. Preserve
the intended stereo meaning rather than treating a changed wedge as mere style.

Use transactional commands for undo/redo. A user action should have a coherent
history effect even when validation or layout runs asynchronously. Redo cannot
reapply a result against an unrelated document generation.

Use a bounded history policy and a separate saved/dirty marker. Restoring
historical content must not rewind live generations or revive old provider
callbacks. Reusing IDs for the same restored history objects does not
automatically revive their external correspondences.

## Drafts and validation

Preserve temporarily invalid or incomplete drafts. Display pending,
invalid, unsupported and execution-failed states distinctly. If the selected
chemical engine cannot represent a draft, retain it in the editor document and
report that limitation without data loss.

Separate explicit user edits from provider normalization proposals. Review
changes to aromaticity, hydrogens, charges, protonation or stereo instead of
silently replacing the user's declaration.

A chemical edit invalidates affected scientific layers and external
correspondences. A valid new mapping or calculation may re-enable them.
Undo requires coherent state restoration, not revival of stale async messages.

## Workflow submission

Scientific execution begins with an explicit snapshot and user action.
The scientific owner validates prerequisites such as protonation, conformer,
charge model, parameters and applicable method.

Docking, simulation or free-energy calculations are independent jobs with
their own inputs, ownership and lifecycle. Mouse movement is not an automatic
scientific execution request. Results identify the submitted revision even if
the user continues editing.

## Acceptance

Qualify the supported chemical scope, draft preservation, undo/redo,
revision-safe validation, source immutability and import/export round trips.
Have a maintainer/researcher review actual editing journeys before calling the
editor ready. Exploration can ship under its own scope beforehand.

## Consequences for the interaction pillar

A molecular draft change invalidates dependent current observations without
destroying historical records bound to their original inputs. Undo/redo
advances live generations and cannot revive a stale interaction callback.
Recomputing preparation, a pose or contacts is a separate scientific-owner
action.

The early P2.5 experiment can use a declared attached observation reference.
Actual native multi-view invalidation and user journeys still need I3/P6
receiving; a mock does not qualify that integration.
