# Host and ecosystem integration

## Two primary public surfaces

Molecular View and Interaction View are required product capabilities. Each
mounts independently using shared assets, lifecycle and scoped events, but
accepts its own document kind. Final signatures remain unfrozen.

The host may compose both with MolSysViewer and contextual information.
Interaction View consumes original/native references and depiction fragments;
it does not depend on an existing visible Molecular View. Selection retains
exact source/model/analysis generation and participant membership.

Status: target contracts; no consumer has received this component yet.

## Host-neutral web surface

The initial integration accepts a container, document/layout and configuration.
It exposes explicit readiness, replacement, capability inspection, selection,
overlay updates, resize and disposal. Events carry instance identity and
relevant revisions. Final signatures are selected and tested during P1/P3.

Do not expose mutable chemical-provider internals. Keep subscriptions
removable and callbacks bounded. Multiple instances must not share accidental
global selection, IDs or teardown.

The host submits commands through the controller; a Python/service adapter
does not mutate a second authoritative copy of the live visual document.
Publish accepted model-change events after transactional completion. Preserve
the current accepted molecule on a failed replacement request and expose that
request's error separately.

The core has no required React, Qt, notebook or desktop-shell dependency.
Provide a thin adapter only when a consumer needs one.

## Sabueso

Sabueso is the first concrete consumer. Its 0.16.0 direction uses a portable web
frontend in a thin PySide6/QWebEngine desktop host with a separate Python
service. MolSysSketcher should embed in that frontend through its web contract.

The first journey opens a source-linked small molecule, renders it, selects
atoms/bonds, inspects a declared layer and returns to the original source.
The original Card remains unchanged. A layer is visibly calculated or
source-declared according to its actual provenance.

Chemical editing later creates an explicit draft derived from a retained
declaration. It must not overwrite the source Card or silently assert a new
molecular identity.

The consumer's internal plan remains
[Sabueso #154](https://github.com/uibcdf/sabueso/issues/154). A sketcher milestone
does not automatically complete Sabueso's release acceptance.

## MolSysViewer

MolSysViewer owns the separate 3D representation. Its embedding/current-model
contract is tracked under
[Viewer #368](https://github.com/uibcdf/molsysviewer/issues/368).
The earlier 2D consumer request is
[Viewer #387](https://github.com/uibcdf/molsysviewer/issues/387).

Coordinate 2D and 3D selection only through a received mapping identifying both
model generations and exact atom correspondence. Index equality, labels,
residue numbers and visual resemblance are insufficient.

When a mapping is absent, partial, ambiguous or stale, report that condition
and restrict coordinated actions accordingly. Basic 2D exploration remains
available. Do not claim that a 2D graph or its layout generated a validated 3D
conformer.

For results depending on physical geometry or a trajectory frame, require
the owner's exact context even when topology/atom correspondence is unchanged.
Generated depiction objects must not be promoted to exact 3D atom matches
without a separately established mapping.

Respect the viewer's own readiness, session, transport and disposal contract.
Do not copy its internal runtime protocol into a competing shared protocol.
Inspect portable primitives for reuse and report missing public capabilities
to their owning repository.

## Desktop and notebook adapters

Use the same web document/scene contract in a normal browser and the actual
QWebEngine host. Test asset loading, worker/WASM routes if selected, resize,
keyboard focus, shutdown and repeated opening under that host.

A future Jupyter adapter must define live kernel ownership, comm readiness,
reconnection and static export separately. A successful desktop view does not
qualify notebook lifecycle or saved HTML.

If a local service is used, bind only the intended endpoint, authenticate the
session, restrict origins/routes, bound requests and remove only owned runtime
resources. Never place session credentials in exported documents or logs.
The embedding host owns application networking and service orchestration.

## Future consumers and migration

BindingMT and PharmacophoreMT are prospective consumers. Receive their actual
domain results, feature definitions and mapping contracts before claiming
integration. Preserve their ownership of scientific meaning.

Keep provider and transport adapters independent of the desktop host. Future
host changes should reuse the document, scene and event semantics.
No new Rust implementation or binary streaming layer is required without
measurements showing a concrete need for the admitted 2D workload.

## Joint consumer acceptance

The first consumer target includes a source-linked molecular journey and a
complex/interface journey: inspect contacts/coverage, follow exact participants
to 3D, and save/reopen the diagram. A residue-level peptide or two-sided
interface proves that a central small molecule is not required.

Calculated observations retain their origin and do not overwrite original
Cards or become source assertions. Report both pillar readiness states.
A molecular-only intermediate checkpoint is explicitly limited.

Standalone 2D viewing can qualify without a 3D runtime. P4.4's linked profile
requires actual correspondence-backed highlight/selection plus unavailable,
partial, stale and echo controls. Passing the unavailable case alone is
insufficient.
