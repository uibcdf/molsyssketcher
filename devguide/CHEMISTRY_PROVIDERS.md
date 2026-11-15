# Chemical providers and scientific contracts

Both primary views consume owner-supported inputs. Chemical interpretation
and native interaction-result projection are distinct adapter roles.
A saved native-result reader does not activate a detector just to display
its observations. Product centrality does not require every backend at startup.

Status: provider requirements plus a bounded implemented
[RDKit source-development route](RDKIT_PROVIDER.md). The web runtime loads no
engine implicitly; production adapters and native interaction receiving remain pending.

## Provider role

Delegate chemical parsing/writing, perception, validation, coordinate
generation, alignment and scientific characterization to supported providers.
Inspect the owning MolSysMT API before adding general interoperability or
analysis operations in the sketcher.

RDKit is the initial chemical reference. A Python/library/service route and
RDKit.js/WASM are separate candidates. RDKit.js exposes a subset of native
RDKit, and using the same family of engine does not prove version, options,
mapping or scientific equivalence.

The TypeScript component must remain usable with an already supplied document
and layout. Requiring an engine for a particular operation must not force that
engine onto unrelated viewing operations.

## Initial capability inventory

| Operation | Initial requirement |
| --- | --- |
| Import supported SMILES/MOL input | Retain original input and interpretation options; return graph and mappings |
| Export supported chemical formats | Declare format/features and losses; preserve the admitted chemistry |
| Generate 2D layout | Return exact ID/index correspondence and generation options |
| Prepare depiction | Return drawing-relevant chemistry and explicit semantic/display correspondence without mutating the accepted input |
| Align a layout | Declare reference, correspondence and failure/ambiguity |
| Validate a draft | Return structured diagnostics without destroying the draft |
| Calculate a property | Preserve method, input, scope, parameters, units and applicability |

Inventory actual APIs and test the first route before advertising any operation.
In particular, do not assume that the browser binding exposes native editable
molecule APIs or every descriptor. A future missing reusable operation belongs
with its scientific owner, with linked consumer evidence.

The [depiction contract](DEPICTION_CONTRACT.md) distinguishes provider
interpretation, drawing preparation and scene primitives. A tuple of atomic
numbers, bond orders and coordinates is not a complete depiction interface.
Do not copy provider ring, valence or stereo-perception algorithms into the
renderer to fill an undeclared adapter gap.

## Request/result contract

Requests identify operation, provider and access route, exact input document,
declared dependencies, output destination, mappings, options and
cancellation/request identity. The destination's current intent matters even
when two requests share the same chemical input.

Results identify the actual engine/version/build, method and applicable
definition/configuration version, original input scope, transformations,
output mappings, warnings and status. Preserve provider outputs needed for
reproducibility without leaking private material.

Absence, unsupported operation, malformed input, chemically invalid input,
transitive dependency failure, execution failure, cancellation and stale
completion are distinct. Do not substitute an unavailable engine silently.
An absent property or failed calculation must not become a numerical zero.

Interpretation, layout and depiction use owned candidate snapshots. A mutating
provider API receives an owned copy. Expose changes in hydrogens, aromatic
representation, standardization or stereo according to their actual meaning:
presentation preparation cannot silently change accepted chemical state.

## Scientific layers

Atom-level values, bond-level values, group/feature results and molecule-level
descriptors have different scope. A domain component owns definitions such as
pharmacophore features or binding interactions; the scene draws supplied
results and explains their legend.

Keep method options and definitions with each layer. Partial charges are
method-dependent calculated values. Feature definitions may depend on a
definition file as well as the engine version. Review provider defaults that
can suppress parameter failures before treating a value as scientifically
applicable.

The component must not turn a calculated overlay into a Sabueso source
assertion or a Discovery conclusion. Preserve declared input, calculation,
source knowledge and user annotations as distinct records.

The scientific owner declares all validity dependencies. A topology-dependent
result may survive a layout change; a conformation/frame-dependent result can
be stale while the graph is unchanged. Include relevant molecular state,
frame, physical geometry, parameters and definition context without inventing
a competing scientific result schema.

Scientific values, display color normalization and visual interpolation are
separate. Legends declare units, range, clipping and per-molecule/global scale.
Unknown or nonapplicable values need a distinct visual state. A smoothed
visual heatmap does not become a physical field by being drawn.

## Route-specific integration

- A browser route initializes WASM explicitly, executes costly operations off
  the UI thread, and releases owned provider objects. Measure worker startup,
  duplicated WASM state and peak memory.
- A Python route uses supported local APIs and declared environments. Optional
  engine loading, structured diagnostics, argument contracts and physical
  quantities use applicable suite-owned tools.
- A service route additionally defines authentication, origin/endpoint scope,
  timeouts, cancellation, size bounds and owned-process shutdown.

These are alternatives to qualify. Build one supported route before adding
another; saved-document viewing remains independent of a live calculation.

## Compatibility acceptance

Compare a public/synthetic molecular corpus under recorded versions and
options. Verify graph/stereo preservation, mappings, explicit-H handling,
supported exports and failures. Different valid depiction coordinates do not
alone establish a chemical mismatch.

Record source-only experiments separately from published installed artifacts.
Never advertise a provider installation minimum or route before it has been
received in the intended distribution.

## Native observation adapters

MolSysMT owns scientific participant roles, relations/occurrences, criteria,
quantities and coverage. BindingMT and other owners add their declared domain
context. Preserve original IDs/generations and unchanged-input preconditions.
Do not define a competing universal detector/result codec.

Guard only the selected route and receive its finite profile. Both primary
minimum profiles need actual provider/consumer evidence. A missing backend
can disable a requested operation without demoting Interaction View from the
product baseline or silently closing its qualification task.

Saved-result reading, live analysis, rendering and domain interpretation are
separate operations. Scientific ownership is independent of Python/service/
qualified-WASM execution location.

## Receiving a visual route versus executing science

Qualify these scopes separately:

- Render a supplied attributed document/result with exact maps and meanings.
- Read/project an original result through its supported owner-native route.
- Execute a newly requested calculation through the selected live provider.

A valid supplied/saved-result path can remain available without the original
calculation engine, subject to its actual reader dependencies. It does not
claim that engine is installed or a new calculation occurred. Missing original
context cannot be repaired by inventing provenance.

Consumer qualification checks data fidelity, declared features, units,
mappings, failures and original scientific meaning. It does not recreate every
upstream scientific validation study or replace the owner's method authority.
A live-calculation claim still needs actual selected-provider execution
evidence. Synthetic layers alone cannot establish that claim.
