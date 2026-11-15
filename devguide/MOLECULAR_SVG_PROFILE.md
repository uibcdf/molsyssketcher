# First molecular SVG profile

Implemented under [component #3](https://github.com/uibcdf/molsyssketcher/issues/3),
extended with navigation/hover under [component #4](https://github.com/uibcdf/molsyssketcher/issues/4),
2026-11-15. This is an experimental read-only molecular surface over the
[supplied prepared-document contract](SUPPLIED_INPUT_PROFILE.md). It does not
complete Molecular View or the independent Interaction View. The original
provider declaration and prepared coordinates are never edited.

## Public API and ownership

The root ESM module exports `buildMolecularScene`, `hitTestMolecularScene`,
`createBrowserTextMeasurer`, `renderMolecularSvg`, `createMolecularSvgView`,
`MolecularSvgView` and their immutable public types. Importing the module in
Node does not allocate browser resources. Constructing a view needs a connected
HTML container and a browser with SVG text bounds, the font loading API,
pointer capture and ResizeObserver.

```typescript
import { createMolecularSvgView } from '@uibcdf/molsyssketcher';

const view = createMolecularSvgView(container, {
  instanceId: 'host-molecule-1',
  theme: 'light',
});
const unsubscribe = view.subscribeSelection(pick => inspect(pick));
await view.ready;
const outcome = await view.replace(preparedDocument);
if (outcome.status === 'accepted') {
  saveFigure(view.exportSvg());
}
// At host teardown:
unsubscribe();
view.dispose();
```

Here `container`, `preparedDocument`, `inspect` and `saveFigure` belong to the
host. The view creates only its measurement probe and one SVG root; it preserves
host siblings. Instances have independent documents, masks, listeners, selection
and disposal. Each host supplies an instance identity. Selection and hover each
allow at most 32 subscriptions; unsubscription and disposal remove owned listeners.
The view also owns and disconnects its viewport resize observer.

`state` separates accepted document/scene, operation status, selection, hover
and immutable viewport camera.
`replace` reports accepted, failed, superseded or disposed. It inherits one
running/one newest queued preparation and retires stale intent. A document,
measured scene and detached SVG are prepared before publishing the accepted
view. A failed candidate keeps the accepted document and actual SVG together.
Generation gaps are allowed; generations never rewind.

The SVG fits its container using `viewBox` and positive uniform scaling.
`resize(width, height)` sets an explicit SVG viewport, retained across replacement;
the host must provide room for it. The camera survives resizing, while hover and
active gestures retire. Successful replacement resets the camera to fit and
clears hover/selection/focus; failed replacement retains the accepted state.
Disposal is idempotent and retires pending replacements.

## Viewport navigation and hover

`view.fit()` restores the full scene bounds. `view.zoomBy(factor, clientPoint?)`
uses a positive factor and optional client CSS-pixel anchor (`clientX/clientY`,
not coordinates relative to the container). Without an anchor it zooms around
the camera center. `view.panBy(dx, dy)` moves the drawing by client CSS pixels;
each component is bounded to absolute 16,384 per call.

The reusable pure tools `fitViewport`, `panViewport`, `zoomViewport` and
`viewportBounds` operate on a nonphysical `Rect` and frozen `ViewportState`
(`zoom`, `center`). Pure `panViewport` changes the camera center in scene units;
its delta therefore has the opposite sign from the drawing's CSS displacement.
`VIEWPORT_LIMITS` bounds relative zoom to **0.25–8** and center displacement to
four fitted widths/heights from the original center. Zoom preserves the anchor's
screen position unless a pan limit clamps it. Degenerate/nonfinite/overflowing
bounds or invalid camera inputs refuse explicitly. These are finite navigation
guards, not scientific or performance limits.

Primary-pointer drag pans after four CSS pixels of motion. A smaller gesture is
a click; a drag does not select. Pointer capture keeps a drag coherent outside
the viewport. Pointer cancellation, loss or release of capture (including release
before its pending acquisition), blur, resize, navigation APIs, replacement and
disposal retire the corresponding gesture. One primary pointer is admitted;
multi-touch/pinch gestures remain pending.

The unmodified wheel zooms around its client position, normalizing pixel, line
and page delta modes with a bounded per-event step. W/A/S/D move the drawing by
40 CSS pixels; +/= and − zoom by 1.25 and its inverse; Home or 0 fits the molecule.
Arrow keys retain semantic navigation. Modified application shortcuts are
preserved, except Shift with + for the ordinary plus key. Controls act within
the active component. The development gallery also provides native labeled buttons.

`view.subscribeHover(listener)` returns an unsubscribe function. It emits a
`ScenePick` or null when the target changes, deduplicating repeated motion over
the same semantic object. It does not emit cursor coordinates or every mouse
move. Picks carry the exact instance/document/scene/context identity used by
selection. Separate hover, focus and selection overlays have no pointer ownership.
Hover clears on leaving, navigation, explicit or observed CSS resize, accepted
replacement and blur. Touch dragging does not manufacture hover. Disposal clears
state and subscriptions without delivering further callbacks. Reentrant callbacks
cannot deliver an older pick to remaining subscribers after it has retired.

The camera and hover do not revise the chemical document, prepared coordinates,
scene generation or provider provenance. Export records the current camera,
viewBox and viewport dimensions, including its intentional crop. Hover, focus and
selection overlays are empty in the exported SVG. Exported text retains the
generic-font policy; a cropped viewport is not partial scientific preparation.

MolSysViewer's `CameraManager` was reviewed at
`0dcdd6ce574d3c99483480cb38c16c1e3cc4782f`: it focuses native 3D selections with
physical radii and a viewer transport. This nonphysical 2D rectangular camera
belongs to the accepted sketcher scene boundary and is implemented as a reusable
pure tool here. No reference code was incorporated. Python support libraries
retain their existing scientific-adapter scope; CSS pixels introduce no physical
quantity conversion or new Python runtime dependency.

## Finite representation matrix

| Feature | Received behavior | Remaining scope |
| --- | --- | --- |
| Mapping | Exact source/context/provider, semantic/display identities, separate immutable scene | Generated/condensed/grouped objects remain refused by the input profile |
| Coordinates | Normalize median bond length to 48 scene units; convert declared y-up to screen y-down once | Drawing units are nonphysical; no physical projection or reflection control |
| Bond strokes | Single, symmetric double, triple, solid directed triangle, eight widening hatches, wavy polyline | No ring perception or inner-ring offset policy; triple/wavy have geometric controls only |
| Stereo | Explicit wedge origin is independent of tuple order; native tetrahedral/E/Z controls preserve meaning | No CIP/stereo perception in the web core; broader stereo profiles remain refused by the provider |
| Labels | Provider-supplied labels; matching element/isotope/charge/H declarations become measured element, super/subscript runs | Other labels stay literal text; no chemical text parser, abbreviation expansion or collision solver |
| Typography | Actual browser SVG `getBBox`, fixed generic sans-serif, regular weight, geometric precision, bounded cache | No bundled/downloaded fonts, custom typography, font embedding or cross-platform font equivalence |
| Masks/hits | Label masks and painted bond strokes share scene geometry; six CSS-pixel slop stays constant under uniform camera zoom | External shear/stretch uses a conservative stroke bound; dense/crowded chemistry still needs an accepted policy |
| Themes | Light/dark, monochrome chemical strokes and labels; separate selection/focus overlays | Configurable palettes and quantitative scientific legends remain pending |
| Exploration | Pointer selection/hover, bounded pan/zoom/fit, keyboard navigation and exact contextual events | Pinch, multiselection, full accessible inspection, scientific layers and human usability receiving remain pending |
| Export | Own SVG primitives/text with exact context, provider/options, coverage, theme, camera/viewBox and nonphysical-coordinate record | Selection/focus/hover and original input text are excluded; generic fonts are not embedded; chemical export is separate |

The scene admits at most 256 atoms and 512 bonds; labels have at most 128 UTF-16
code units and font size is 10–32 scene units (default 18). Raw coordinates are
bounded to absolute 1,000,000; near-zero median bonds and coincident bonded
positions refuse explicitly. These are initial admission guards, not measured
performance budgets or a promise of legibility at maximum size.

Hit testing uses viewport CSS pixels and actual label-mask/bond geometry, with
atom priority and a default six-pixel tolerance. Picks include instance,
document, scene/depiction generations and exact molecular context. The host
owns tooltips, panels and calculations. Keyboard focus is distinct from
selection. Modified application shortcuts are preserved. No exploration method
mutates a chemical declaration or invokes a scientific calculation.

## Executed receiving and reproduction

Run the finite browser controls with a managed Chromium runtime:

```bash
npx playwright install --with-deps chromium
npm run test:browser
python devtools/check_svg_chemistry.py /tmp/molsyssketcher-svg-review/drawings.json
```

For an explicitly selected installed browser, set
`MOLSYSSKETCHER_BROWSER_EXECUTABLE`. The local run used
`/usr/bin/google-chrome`, version **157.0.8103.38**. Playwright **1.57.0** is an
exact development dependency (Apache-2.0); no browser or test runner is shipped
in the library. CI installs Playwright's own Chromium and records its actual
version on an explicit Ubuntu 24.04 runner. Playwright 1.57.0 refused the first
CI attempt on the moving Ubuntu 26.04 default before executing browser controls;
the provider/browser job now selects its supported Ubuntu runtime explicitly.
Neither route qualifies Firefox, Safari or Qt/QWebEngine.

The fifteen real-browser tests cover the twelve actual RDKit preparations, glyph
bounds at multiple viewport sizes and relative zooms 0.25/1.75/8, pointer labels/atoms/bonds, keyboard focus
and selection, modified shortcuts, burst/failing replacement, retired DOM events,
independent disposal, safe literal labels, host typography, export metadata,
axis/endpoint controls and light/dark comparison galleries. Navigation controls
include cursor anchoring, all wheel delta modes, capture/blur/cancel, drag versus
click, keyboard pan/zoom/fit, observed resize, hover bounds/deduplication/reentry,
retired DOM events and export crop/context. Painted-stroke hit tests also execute
at device scale factor 2. The 31 Node tests include pure camera invariants;
synthetic geometry tests are separate from real font receiving.

`devtools/check_svg_chemistry.py` receives DOM-extracted primitives: stroke count
determines order; triangle apex and hatch-width gradient determine wedge origin
and polarity. Atom identity/attributes and endpoint membership are supplied.
Native RDKit interprets the reconstructed graph/2D coordinates and round-trips
it through MOL, comparing isomeric SMILES for all twelve cases. Four reflected
controls check tetrahedral inversion and unchanged relative E/Z. Current input
is transformed client CSS-pixel geometry from the actual DOM after zoom 1.4
and pan, with each shape's actual screen transform applied. The oracle
does not prove label spelling, all pixel visibility or arbitrary chemical-image
recognition; metrics and visual review address separate concerns. Its pinned
native coordinate-stereo function is exposed with a deprecated Python binding;
it is confined to developer verification.

`MOLSYSSKETCHER_BROWSER_EVIDENCE_DIR` selects an owned evidence directory; the
default is `/tmp/molsyssketcher-svg-review`. It contains browser version,
DOM geometry/context, exported SVGs and two gallery screenshots. CI retains
these synthetic, nonprivate controls for 14 days. The source receipt is
[molecular_svg_20261115.json](evidence/molecular_svg_20261115.json).
The navigation extension is recorded separately in
[molecular_navigation_20261115.json](evidence/molecular_navigation_20261115.json);
its local evidence directory is `/tmp/molsyssketcher-navigation-review`.

Use `npm run demo` to open the printed local gallery URL, or append
`?theme=dark`. It serves only the built modules and explicit public fixtures;
it is a development demo, not a production server or published site.

Visual inspection of this finite gallery found the declared labels, wedges,
fragment separation and native E/Z pair distinguishable. Symmetric double
strokes have visible corner joins/gaps relative to RDKit's inner-ring style.
The gallery is an engineering review, not maintainer/researcher scientific or
accessibility acceptance. Crowded structures, pinch, edit feasibility,
native interaction diagrams, actual Qt and both installed visual journeys
remain pending; no G-M/G-I/G-J gate is complete.
