# Editing after exploration

This document concerns chemical editing. Presentation editing of interaction
diagrams—pins, node placement, filters and annotations—is part of the core
exploration capability and does not wait for P6.

Status: production editing is the final planned stage, P6.

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
