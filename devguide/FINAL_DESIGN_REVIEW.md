# Final design consistency review

Date: 2026-11-14. Scope: the maintained design and complete implementation plan.
Outcome: **sufficiently coherent and complete to begin implementation**.
This is a design/documentation review, not runtime or scientific qualification.
Coordination: [suite #199 update](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6886729818).

## Assessment

The two primary pillars have appropriate scientific boundaries, a reusable
foundation, separate documents and acceptance, replaceable host/provider
adapters and an explicit later chemical-editor stage. Source identity,
prepared depiction, native observations, quantities, partial coverage and
historical results are preserved rather than silently reconstructed.

No additional product pillar or generic infrastructure framework is required
before implementation. The main remaining risk is building too much abstraction
before exercising real chemical drawings and native interaction inputs.

## Last corrections

| Finding | Correction | Existing implementation work |
| --- | --- | --- |
| Minimum/full milestone wording left some delivery dependencies ambiguous | Explicit standalone, linked-joint and full-roadmap gates; concrete host-before-link ordering | P0.6, P4/P5, I3/I5 |
| Actual scientific receiving could be confused with requiring a live engine for every display | Supplied data, owner-native reading and live execution have different qualification scope | P1.2, I1.2, I4 |
| Stale-result rejection alone does not bound pending computation/memory | Bounded admission, queues, retained payloads and explicit overload/cancellation lifecycle | P1.4, P3.4, I2.3/I3.6 |

These clarify existing tasks. The ledger remains **69 microsteps: 5
documentation/review steps done, 64 pending**. No runtime step becomes complete.

## Delivery gates

The [living plan](IMPLEMENTATION_PLAN.md) owns the exact task sets.

- **G-M:** standalone Molecular View, with admitted chemistry, exploration and
  shared data integrity. A 3D runtime is not required to display a molecule.
- **G-I:** standalone Interaction View, with both diagram modes, native roles/
  coverage, saved/exported state and public scientific controls.
- **G-J:** both primary minimums plus actual linked 3D, consumer, artifact and
  host evidence. An unavailable-state test does not establish synchronization.
- **G-R:** the remaining planned comparison/temporal and domain profiles,
  received under their actual route and scientific meanings.
- **G-E:** production chemical editing after the agreed exploration roadmap,
  preserving source history and invalidating affected observations.

G-M and G-I are equally required for joint baseline completion. G-J can precede
the richer G-R profiles as a deliberately bounded delivery. Completing G-J
does not complete the full roadmap. Future ADMET/allostery are not hidden
prerequisites of these current gates.

## First executable vertical slice

After the applicable admission/toolchain decisions, P0.6 should select exact
public/synthetic inputs and acceptance for a narrow joint experiment:

1. Retain one provider-prepared molecular input and its exact mappings.
2. Show its chemical depiction through Molecular View.
3. Project a native interaction result into a ligand-centered diagram using
   the same parent context; inspect a participant and its original meaning.
4. Exercise an interface-centered case without a privileged central ligand.
5. Save/reopen and export the declared visual state/context.
6. Replace the input, finish an obsolete request and verify it cannot alter the
   replacement; verify pending work remains bounded.

This is a feasibility result, not a shortcut around the full corpus, actual
linked-host or scientific acceptance. Allow contributing tasks to remain
partial rather than waiting for every abstraction/stage to be complete.

Use one scientific route and one renderer initially. If a required provider
field is unavailable, report it to its owner instead of rebuilding chemistry.
If the own-renderer cost is disproportionate, revisit the bounded renderer
decision using the actual experiment while preserving the two product pillars.

## What remains deliberately open

- Exact admitted molecule/family corpora and quantitative performance budgets.
- First chemical/native-result access routes and their actual supported data.
- Build/test tools, project license and reproducible package layout.
- Final public signatures and serialized field shapes after real examples.
- Platform, publication and release claims, which need their own evidence.

These are explicit upcoming implementation/receiving decisions, not reasons
to continue adding speculative product features. Scope-changing evidence
should reopen its specific decision; another complete design cycle is not
required before starting the first slice.
