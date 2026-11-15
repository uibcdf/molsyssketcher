# Conceptual design review

This dated review precedes the maintainer's adoption of two equal product
pillars. Its source observations remain historical evidence. Current scope
and task counts are in [the living plan](IMPLEMENTATION_PLAN.md) and
[the interaction contract](INTERACTION_DIAGRAMS.md).

Date: 2026-11-14. Scope: product/scientific contracts and selected source code.
Evidence: [inspection manifest](evidence/conceptual_review_20261114.json).
Coordination: [suite #199 review update](https://github.com/uibcdf/molsyssuite/issues/199#issuecomment-6886016230).

## Assessment

The project has a sound high-level separation: reusable 2D scene, chemistry
delegated to supported providers, host-independent integration and production
editing after exploration. This review does not recommend replacing that
direction or adding a new chemical kernel.

The initial guide was incomplete at several boundaries that matter before
implementation. The refinements below are proposed requirements, not claims
of a measured renderer, received provider adapter or maintainer acceptance of
every detailed API.

## Source observations

Selected files from three immutable commits were inspected:

| Project | Commit | Relevant observation |
| --- | --- | --- |
| SmilesDrawer | 2cdf95907fc3534a14124bcf41c5b247eeb72a4d | DrawerBase combines positioning/stereo/overlap processing; SvgWrapper has text metrics/masking and scene-specific geometry |
| Ketcher | cfbc2c84a4d9d3476ec4388eb595e30f9df77a2f | Atom/bond entities carry richer chemical state than connectivity; stereo actions and command history have explicit model-change semantics |
| RDKit | 79045367d04b6f9d11e29ae73f3e1d6b210d9641 | Drawing preparation can modify a depiction copy; MinimalLib declares a bounded browser-facing surface |

These are source observations, not comparative quality/performance results.
No source code was incorporated into MolSysSketcher. Fifteen selected
source/license files were retrieved temporarily, rather than cloning complete
repositories or installing/building them.

## Findings and refinements

| ID | Priority | Gap in the initial design | Proposed refinement / receiving task |
| --- | --- | --- | --- |
| C01 | before viewer implementation | Graph plus coordinates does not specify every chemically meaningful drawing decision | Separate interpreted chemistry, prepared depiction and scene; P1.6 |
| C02 | before document API stabilization | Local graph/draft could become an accidental competing chemical authority | One controller owns accepted live state; providers return candidates; preserve provider semantics and original input; P1.1/P1.7 |
| C03 | before async provider integration | Chemical revision alone misses same-input competing requests and undo returning to equivalent content | Monotonic accepted generations, request/dependency tokens and per-operation applicability; P1.4/P2.5 |
| C04 | before first format/support claim | Import/view/inspect/edit/export were not separate feature capabilities | Per-operation feature matrix and explicit loss/refusal policy; P0.6/P1.3 |
| C05 | before interactive/stereo acceptance | Generic geometry changes can contradict stereo; labels and hit regions can diverge | Directed depiction, qualified transforms and coherent geometry/metrics snapshots; P2.2/P2.4 |
| C06 | before scientific overlays | A graph-only binding misses conformer/frame-dependent results; color scales can mislead comparisons | Owner-declared dependencies, typed visual layers and explicit scale/missing-value semantics; P3.3 |
| C07 | before host integration | One ready/pending/invalid state cannot represent valid displayed data plus a failed operation | Orthogonal lifecycle/document/request states and atomic replacement; P1.7/P4 |

The new [depiction contract](DEPICTION_CONTRACT.md) covers the most significant
missing boundary. Document, provider, interaction, integration, editor and
validation contracts are updated with the other refinements.

## Source support and limits of inference

RDKit's
[prepareMolForDrawing](https://github.com/rdkit/rdkit/blob/79045367d04b6f9d11e29ae73f3e1d6b210d9641/Code/GraphMol/MolDraw2D/MolDraw2DUtils.cpp#L52)
supports C01. The official
[Python drawing API](https://www.rdkit.org/docs/source/rdkit.Chem.Draw.rdMolDraw2D.html)
describes returning a modified copy. The precise bridge needed by our own
renderer still has to be implemented and tested.

SmilesDrawer's
[graph-processing path](https://github.com/reymond-group/smilesDrawer/blob/2cdf95907fc3534a14124bcf41c5b247eeb72a4d/src/DrawerBase.js#L615)
and
[SVG wrapper](https://github.com/reymond-group/smilesDrawer/blob/2cdf95907fc3534a14124bcf41c5b247eeb72a4d/src/SvgWrapper.js)
show coupled layout, text and drawing work. They motivate explicit boundaries;
they do not require copying its parser or perception algorithms.

Ketcher's
[stereo actions](https://github.com/epam/ketcher/blob/cfbc2c84a4d9d3476ec4388eb595e30f9df77a2f/packages/ketcher-core/src/application/editor/actions/bondStereo.ts)
and
[history](https://github.com/epam/ketcher/blob/cfbc2c84a4d9d3476ec4388eb595e30f9df77a2f/packages/ketcher-core/src/application/editor/EditorHistory.ts)
illustrate that editing and model notifications need more than visual gestures.
C02-C07 are design deductions for MolSysSketcher, not reported defects in those
libraries.

RDKit's
[JSON documentation](https://www.rdkit.org/docs/RDKit_Book.html#json-support)
describes CommonChem and RDKit extensions. Evaluate that interchange before
designing our semantic projection, while preserving our document IDs and
declaring unsupported extensions. This review does not select a frozen format.

## Adversarial acceptance scenarios

1. A prepared depiction adds an object or changes bond representation; original
   input, semantic identity and external mappings remain honest.
2. Two layout requests share one chemical revision but different options;
   completion of the older request cannot overwrite the selected newer one.
3. An edit is undone to equivalent chemical content; an old request remains
   stale because accepted generations were not rewound.
4. Replacement import/depiction fails; the previous accepted molecule and
   working interactions remain available.
5. An advanced feature is readable but not editable/exportable; capabilities
   report the exact limitation without silent loss.
6. A font loads or the viewport changes; labels, hit regions, anchors and
   exported graphics use a coherent geometry snapshot.
7. A 3D frame changes without changing topology; conformer/frame-dependent
   results become stale according to their real dependencies.
8. A missing atom value is visibly missing, and independently normalized
   molecule colors do not imply a common scientific scale.
9. A reflected/reordered depiction preserves supported stereo meaning or
   rejects the transformation.

These are planned controls, not executed runtime results.

## Scope discipline

Keep one provider route, one initial renderer and a bounded ligand corpus.
Retain a standard-format/provider adapter instead of a new general molecular
system model. Use small declarative shape APIs; a global plugin system,
distributed state engine or collaborative editor is not needed initially.

Production editing can remain last. Resolve the prepared-depiction,
transaction and capability boundaries early, then use P2.5 to test the future
editing path. Formal admission, tooling, actual provider scope and runtime
measurements remain open.
