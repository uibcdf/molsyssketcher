# Tests and validation

Status: 21 initial document/controller/version contract tests execute with the native
Node runner. `npm run check` receives strict types, format, these tests and
documentation consistency; `npm run pack:check` receives an independent local
packed consumer. There is no chemical, visual, browser/Qt or performance
qualification yet. See [the first profile](SUPPLIED_INPUT_PROFILE.md).

`npm run pack:conda:check` checks the proposed asset-prefix layout after relocation,
version identity and file digests. The draft Conda recipe and central profile
still need actual archive/solver/installed/public-route receiving.

## Evidence levels

Keep source inspection, a synthetic control, a real provider test, browser
execution, native-host execution, installed-artifact receiving and human
scientific review distinguishable. A screenshot alone does not establish
chemical correctness, interaction or lifecycle.

Record the exact component/provider/artifact revisions, tools, inputs,
environment, selected checks, results and remaining limits. A skipped provider
test is not an installed-provider pass.

## Molecular corpus

P0.6 creates public or synthetic inputs with origin/licensing records and
expected semantic assertions. Include:

- A simple acyclic molecule and an aromatic ring.
- Disconnected charged fragments/salts.
- An isotope and explicit-hydrogen cases with declared parsing policy.
- A tetrahedral stereo pair and double-bond stereo cases.
- Crowded/fused-ring and macrocyclic layouts.
- Malformed input, unsupported chemistry and a temporarily invalid edit draft.
- Replacement input with different ordering and overlapping local index values.
- Prepared depictions with a supported generated object, or an explicit refusal
  when that preparation is outside the initial feature scope.

Use retained source bytes and exact expected features. Broader cases may be
declared unsupported initially, but must exercise that visible outcome.
No private pilot content belongs in fixtures.

## Validation layers

| Layer | Meaningful checks |
| --- | --- |
| Document | Stable IDs, original retention, monotonic undo generations, read-only/schema guards, single writer and atomic acceptance |
| Provider | Actual import/export, admitted stereo/charge/H semantics, mapping, absent/unsupported/failing routes and option provenance |
| Depiction | Original/interpreted/prepared separation, generated/display mappings and directed stereo |
| Async | Same-graph competing requests, destination changes, undo, replacement and disposal reject stale results |
| Scene | Coherent primitive/text/hit geometry, font readiness, anchors and stereo-preserving transforms |
| Input tools | Hit tests, selection, keyboard path, empty/overlapping targets and bounded callbacks |
| Scientific layers | Scope/mapping/units, conformer/frame dependencies, explicit scale/clipping and missing-value policy |
| Lifecycle | Multiple instances, resize, repeated replacement, unsubscription and owned-resource release |
| Host | Production modules and assets execute in a real browser and actual Qt host |
| Consumer | Sabueso source-linked journey and explicit mapping availability preserve original knowledge |
| Editor | Draft preservation, typed chemical/layout changes, undo/redo, stereo and validated-snapshot handoff |

Use pure logic tests for document/controller rules and actual DOM/browser tests
for behavior that depends on rendering. Avoid tests that only duplicate
implementation branches. Keep snapshots as visual regressions alongside
semantic assertions; exact pixels across platforms are not a universal oracle.

## Scientific acceptance

Round trips must preserve the declared chemical scope or report a supported,
explicitly accepted transformation. Compare exact mappings and source
declarations, not only output string equality.

Review stereo depictions and ambiguous/unsupported chemistry with a qualified
maintainer. A property layer must retain the real definition/method/version,
units when applicable and input revision.

An edit invalidates affected scientific layers and external correspondences.
Moving the viewport or changing a theme cannot change the chemical graph.

Execute the adversarial scenarios in
[CONCEPTUAL_REVIEW.md](CONCEPTUAL_REVIEW.md) as their owning stages become
available. Include failed replacement retaining a valid display, non-bijective
depiction maps, per-operation unsupported features and explicit unknown stereo.
These are planned guards, not existing test selectors.

## Performance acceptance

Agree numerical budgets against a named corpus and environment before
acceptance. No latency, memory, thermal or large-scale performance claims have
been measured for MolSysSketcher.

Measure cold initialization, first useful drawing, warm replacement,
selection/hover responsiveness, layout/validation latency, graphical export,
repeated open/close behavior and peak/retained memory. Record bundle/WASM/font
sizes separately from process memory.

Identify host/runtime, viewport/DPI, provider/build, molecule sizes, instance
count, concurrency and system load. Distinguish renderer timing from provider,
transport and startup time. Use bounded representative runs first.

For many-molecule dashboards, separately measure lazy visibility, scrolling,
thumbnail/cache limits and disposal. Other projects' 3D host benchmarks are
context, not performance evidence for this new 2D component.

## Selecting checks and reporting

Documentation-only changes need applicable link/status/whitespace checks.
Code changes need tests for the changed behavior and relevant integration.
Run selected gates independently and inspect their actual exit status/output.
Broaden checks when failures or changed boundaries justify it.

If a Python adapter is introduced, use the applicable suite Python environment,
editable-origin checks and published pytest-receptor route. Native TypeScript
tests retain their selected runner; Python tooling does not substitute for
browser or chemical validation.

Publication/support claims require exact-candidate and clean-artifact evidence
under the applicable suite policy. No public installation route is documented
before receiving its actual public artifact.

## Interaction corpus and independent acceptance

I1-I5 require analytical and public controls for ligand-centered and two-sided
interface modes. Include:

- Directed polar/charged roles, compound/ring participants and mediated paths
  within the admitted scientific families.
- Duplicate labels across chain/model/source axes, multiple participants on
  one side, ions/waters and parallel occurrences.
- Exact maps, partial/unknown correspondence, retained original preparation
  and provider-local identifier generations.
- Evaluated-empty, unrequested/failed/unevaluated frames, partial pages and
  display filtering without scientific reclassification.
- Pose/method/coverage comparison and temporal aggregates with explicit
  denominator, weighting and non-simultaneity.
- Saved/reopened presentation state, unknown schema/assets and reproducible
  export with criteria, units, filters and context.
- Real browser/Qt linked 3D behavior, focus policy, echo/stale rejection and
  parent/edit invalidation.
- Residue-level peptide/protein or composite interface, with admitted chemistry
  and unsupported-detail behavior.

Each domain layer needs actual scientific receiving. Synthetic payloads prove
visual behavior only. Inspect labels, glyph direction, drill-down, actual
physical measures, constrained layout and figures with the maintainer.

Measure molecular, interaction and combined-host scenarios separately.
Diagram budgets include native query/source residency, compound memberships,
projection size and layout work; paging alone does not bound total RAM.

The joint baseline needs both finite minimum profiles. A molecular test suite,
a screenshot or an unavailable-3D guard cannot substitute for interaction
scientific/functional acceptance. Exact candidate checks receive both public
surfaces from the built artifact.

## Final consistency controls

Exercise the exact [delivery gates](IMPLEMENTATION_PLAN.md#delivery-gates-and-dependencies);
standalone rendering and actual linked 3D are different evidence scopes.
The minimum gate does not silently require all richer I3/I4 profiles.

Add meaningful overload/scheduling controls to P1.4: a burst of supersedable
requests retains bounded pending work, only applicable results commit,
cancellation does not falsely free a running slot, and explicit scientific
jobs are not silently dropped. Preserve the accepted view on overload.

Test supplied/saved-data viewing with the original calculation engine absent
where the selected reader route supports it. Distinguish that success from
installed-engine execution. Receive the consumer boundary against its admitted
fixtures; upstream numerical validation remains with its scientific owner.
