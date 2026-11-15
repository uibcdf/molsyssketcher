# Rendering and interaction

Molecular View and Interaction View share this foundation. User interaction
means pointer/keyboard behavior here; scientific molecular interactions are
provider observations. Their projection is defined in
[INTERACTION_DIAGRAMS.md](INTERACTION_DIAGRAMS.md).

Status: the bounded [first molecular SVG profile](MOLECULAR_SVG_PROFILE.md)
implements own primitives, actual font metrics, semantic selection, fit/resize,
export and owned lifecycle. The broader behavior below remains a requirement
until its applicable receiving; native interaction diagrams remain pending.

## Scene

Build a semantic scene from the accepted
[prepared depiction](DEPICTION_CONTRACT.md) and its explicit document mappings.
Keep atoms, bonds, labels, annotations, overlays and hit regions
addressable through local IDs. Retain transforms between document, scene and
viewport coordinates.

Use provider-generated coordinates initially. Study SmilesDrawer's legibility
and overlap handling without implementing another chemical parser, ring
perception system or full coordinate generator.

An RDKit depiction is a comparison reference. It does not prove that the
sketcher's own primitives preserve chemical meaning.

## Visual correctness and quality

The admitted feature matrix must cover the actual supported bond styles,
charges, isotopes, explicit hydrogens and stereo declarations. Wedges,
hashed bonds, aromatic depiction and label placement must remain meaningful
under resize and export.

Keep chemical stereo declarations, directed wedge endpoints and computed
labels distinct. Qualify screen-axis conversion and orientation-sensitive
transforms. Reflection stays disabled until it preserves the declared chemical
meaning; later atom dragging may require re-preparation or visible refusal.
An unchanged graph alone does not prove that the picture is chemically correct.

Evaluate label collisions, crowded rings, short bonds, clipping, fragment
spacing, typography and legibility at different scales. Preserve supplied
coordinates when requested; an explicit cleanup operation may produce a new
layout with recorded provenance.

Provide light/dark themes, configurable styles and a clear visual hierarchy.
Theme changes cannot erase warnings, selection or distinctions between
scientific layers. Keep typography/font assets and export licensing explicit.

Measure labels using the actual font/metrics policy. Font readiness or fallback
changes can alter clipping, bond shortening and hit geometry. Publish drawing
geometry, label masks, anchors and hit regions as one coherent scene snapshot.
Use instance-local SVG IDs for masks/definitions to avoid collisions between
multiple views and exported scenes.

## Interaction

Provide pan, zoom, fit-to-view, hover, atom/bond selection and bounded selection
events. Define hit testing in viewport space using semantic geometry and
consistent tolerances, rather than relying on incidental SVG path ordering.

The host chooses how tooltips, inspectors and actions appear. Application
callbacks may inspect a selection, open another panel or request an explicit
calculation without replacing the component's internals.

Define event behavior for empty space, overlapping labels, multiple fragments,
rapid replacement and callback re-entry. Keep chemical editing disabled in
exploration mode at the controller boundary.

## Custom shapes and layers

Start with labels, circles/halos, lines/arrows and regions. An anchor can refer
to exact atoms/bonds/groups or an explicit scene position. Specify whether size
and position follow molecule coordinates or screen coordinates.

Layer ordering, clipping, legend, visibility and pointer behavior are explicit.
A decorative shape should not capture molecular selection unless configured.
An annotation remains distinct from a calculated scientific layer.

Use typed layer roles: chemical depiction, scientific result, user annotation
and transient selection. An interaction arrow or decorative line is not a
chemical bond. Keep layer origin, serialization/export policy and selection
behavior explicit without building a general plugin framework.

Chemical edits invalidate affected results and correspondences. Layout changes
reproject valid anchors; they do not automatically invalidate unchanged
chemical calculations.

For scientific colors, declare the scale, units, bounds, clipping, missing
values and normalization policy. Independently autoscaled molecules cannot
imply a common quantitative color scale. Record interpolation/smoothing as a
visual policy unless the scientific owner defines it as a calculated result.

## Accessibility

Support keyboard focus and a documented selection/navigation path. Provide
textual molecule/selection information for users who cannot rely on the image.
Do not encode scientific meaning only in color; supply legends, labels and
distinguishable patterns where needed.

Test keyboard interactions in the actual host and preserve application-level
shortcuts outside the active component. Reusable scene controls should work
without a prescribed toolbar or frontend framework.

## Export and scale

Graphical export records viewport/layout, theme, included layers and relevant
calculation provenance. Define whether export includes transient selection.
Chemical export is a separate provider operation. Avoid executable content or
private metadata in exported graphics.

Use SVG first for bounded molecular scenes. Add Canvas or another renderer
only when measured workloads or consumer requirements justify it.

Many-structure dashboards require virtualized lists, lazy rendering, bounded
caches and explicit disposal. Do not equate a good single-molecule viewer with
an already qualified thousand-molecule dashboard.

## Primary interaction-diagram surface

Receive ligand-centered and interface-centered composition, compound anchors,
typed relationship glyphs, reversible grouping and stable pins through the
same primitives, typography and hit geometry. An interaction view is not a
collection of unrelated full molecular widgets.

Presentation editing belongs to exploration: arrange context nodes, pin
positions, filter layers and annotate without changing scientific inputs.
Persist those choices. Dense interfaces need an explicit summary/matrix
policy rather than unconditional rendering of every relation.

Both surfaces need keyboard and textual inspection paths. Interface summaries
and unknown interaction types must remain scientifically interpretable when
color, fine geometry or a 3D runtime is unavailable.
