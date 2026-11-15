# Documents, references and state

## Two primary document kinds

The molecular document owns its bounded interpretation/draft and prepared
depiction. The interaction diagram document owns a visual projection over
exact molecular parents and native analysis references, with layout, grouping,
filters and annotations. It does not own another scientific result or merged
molecular graph. Both use the shared identity, quantity and lifecycle contracts.

Each document has one accepting writer. A diagram can reference immutable
parents from several molecules/analyses without requiring an already mounted
Molecular View. Parent replacement is explicit and transactional.
See [the interaction contract](INTERACTION_DIAGRAMS.md).

Status: contract requirements for P1; field names and schema are not frozen.
The [supplied-input profile](SUPPLIED_INPUT_PROFILE.md) implements a bounded
experimental projection/reference subset and immutable replacement controller.
It is not yet a chemical draft, native scientific codec or user persistence format.

## Separate kinds of state

| State | Content and authority |
| --- | --- |
| Original input | Retained bytes/text, declared format, source reference and provider interpretation options |
| Molecular document | Explicit graph or editing draft, local atom/bond IDs and chemical revision |
| Layout | 2D coordinates, their generator/options and layout revision |
| Prepared depiction | Drawing-specific chemical information, generated display objects and semantic/display mappings |
| Presentation | Viewport, theme, selection and application annotations |
| Scientific layers | Provider/domain results bound to an exact molecular input and mapping |
| External correspondence | Explicit mapping to a source or another model, with scope and generation |

The original declaration and a provider-normalized interpretation remain
distinguishable. Never merge molecular identity by a name, similarity,
canonical SMILES, element labels or equal indices. Local document IDs are
technical handles, not assertions of source identity.

## Identity and revision

A document needs a live instance identity and schema version, distinct from
the identity of a view and from a content fingerprint. The controller is its
single writer; host commands and provider candidates are accepted transitions.
The graph is a bounded semantic projection/draft, not a competing general
molecular-system implementation.

Atoms and bonds need stable local IDs independent of array order. New atoms
receive new IDs; a deleted/replaced object cannot silently reuse an external correspondence.

For molecular documents, chemical changes advance the chemical revision.
Layout changes advance the
layout revision. Accepted revision/generation tokens never rewind on undo/redo,
even when historical content is restored. History content and live applicability
are distinct. Selection or viewport changes must not invalidate chemistry.
Document replacement retires the previous instance and its pending events.

An import produces explicit mappings between provider indices and local IDs.
A cross-component mapping also names both input/model generations, direction,
scope and completeness. Partial or ambiguous mappings stay visible as such.
An absent mapping disables coordinated selection instead of guessing.

Semantic-to-depiction mappings may include generated or condensed objects.
Record cardinality, completeness and origin explicitly. A display-only object
does not automatically acquire source/3D atom identity. See the
[depiction contract](DEPICTION_CONTRACT.md).

## Chemical scope

Record element, isotope, formal charge, radical/valence declarations when
supported, bond endpoints/order, aromatic declarations and stereo information
needed by the admitted corpus. Explicit and implicit hydrogens need a declared
provider policy. Fragments preserve their connectivity and declared meaning.

Unknown or unsupported values must remain distinguishable from a negative
finding, zero or ordinary absence. Source stereo declarations and newly
computed assignments have different provenance. Reject unsupported chemistry
or preserve it as an explicitly noneditable/unsupported input; never silently
strip it to obtain a drawable structure.

Define the first supported feature matrix in P0.6. This list does not promise
full RDKit, V3000, reaction or query-chemistry coverage.

Declare capabilities by operation: retain/import, view, inspect, edit,
chemical export and graphical export. Reading a feature does not imply
lossless editable/exportable support. Preserve original bytes for an original
input export; generated exports have their own supported-feature/loss policy.
Evaluate established chemical interchange, including CommonChem/RDKit JSON,
before choosing the semantic projection encoding.

## Layout and scientific quantities

Layout uses a declared two-dimensional drawing coordinate system with explicit
axes/orientation and transforms to viewport coordinates. These are presentation
coordinates, with no inferred length in physical space.

Scientific physical quantities retain value, unit and meaning through the
provider-owned quantity contract. A color mapping may display a physical
quantity without converting its underlying record into a bare scalar. Keep
dimensionless scores and formal charge distinct from physical measurements.

## Operations and events

Define typed transitions for load/replace, selection, viewport/layout changes,
overlay updates and later chemical edits. Each event identifies its document
and relevant revision. Host callbacks receive bounded records, not internal
mutable provider objects.

Read-only mode rejects chemical mutation at the controller boundary. Hiding a
toolbar is insufficient. Presentation changes and user selections remain
available in that mode.

Keep three independent state dimensions: runtime lifecycle, accepted
document/draft validity and per-operation status. Ready, pending, invalid,
unsupported, failed and disposed must not be collapsed into one mutually
exclusive enum. A valid displayed document can coexist with a failed request.
A future draft may be chemically invalid while remaining a valid editing
document.

Structural envelope integrity, chemical validity and drawing coverage are
different checks. A chemically invalid draft still needs coherent local IDs
and bond references. An unsupported drawing feature is not automatically an
invalid molecule.

Load/replace is transactional: prepare a candidate and its depiction before
committing. Failure preserves accepted state; an explicit invalid-draft edit
uses a different transition. Publish model-change events after the coherent
state is accepted, and prevent synchronous callback re-entry from mutating
partially applied state.

## Persistence and interchange

SMILES, MOL and SDF are input/output formats with declared supported features.
They do not store the entire application document, history, overlays or exact
source correspondence. Implement their chemistry through a supported provider.

Define versioned native document persistence when saving scene/draft state is
introduced. Keep source input, interpreted graph, layout and layer provenance
separable. Test supported-feature round trips semantically; byte equality is
appropriate for retained original input, not all provider-generated exports.

Unknown schema versions fail explicitly or use a declared migration. The
schema and migration policy must be reviewed before persisting user documents.

## Interaction references and persistence

Interaction documents track visual revisions and original parent/result/query
generations. A relation/occurrence index has meaning only in its original
analysis scope. Preserve native, visual and display IDs through grouping,
expansion, comparison and frame selection.

Changing a native frame, criteria or prepared parent can invalidate a diagram
while graph connectivity is unchanged. A pin/label change modifies presentation,
not chemistry or measured distance. Reversible memberships preserve compound,
parallel and mediated observations.

Persist versioned visual state, exact original/native references, pins,
filters, legends, grouping and frame/aggregate context. Reuse owner codecs.
Opening supplied saved data runs no detector and does not silently select a
new scientific source. Historical diagrams retain their original bindings.
