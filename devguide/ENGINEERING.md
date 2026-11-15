# Engineering, dependencies and delivery

Status: the initial TypeScript package/build/test configuration and a Linux
foundation CI workflow exist. Scientific/visual/platform and public delivery
qualification remain pending.

## Governance and repository setup

MolSysSketcher is a proposed suite component. Resolve admission/ownership in
[suite #199](https://github.com/uibcdf/molsyssuite/issues/199) before treating it
as a registered provider or requiring a shared contract from another member.

Use the
[official starter/admission route](https://github.com/uibcdf/molsyssuite/blob/main/devguide/new_component_starter_kit.md)
and review the appropriate TypeScript-first profile. The current Python starter
must not be copied wholesale to create an unused package. Admission work covers
classification, root instructions, synchronized guides, reporting route,
applicable checks and dependency/support reviews.

The project owns its implementation and local API. Shared suite contracts
belong in MolSysSuite; cross-platform MolI contracts retain their platform
owner. Provider defects belong in their provider repositories with linked
consumer evidence.

## Toolchain and dependencies

P0.5 selects Node 24.22.1 (`.node-version`), npm 11.19.1 (`packageManager`),
TypeScript 5.9.3 and Prettier 3.6.2 with `package-lock.json` integrity pins.
The framework-independent `src/` package builds ESM and declarations into a
clean `dist/`; ES2022/DOM typing is a build target, not browser qualification.
There are no runtime dependencies. TypeScript strict/no-unused/compiler checks
and Prettier are the initial code quality route. `devguide/` prose retains its
document/link/ledger checks; historical evidence is not reformatted.

Run `npm ci`, `npm run check`, `npm run pack:check`, `npm run pack:conda:check`
and `npm run example`.
Native Node tests import built exports and run with explicit no-isolation mode;
the packed-consumer check also verifies declarations and read-only types in a
temporary independent offline installation. CI pins checkout/setup-node commits
and exact Node/npm tools. Its first execution is recorded in CHECKPOINT.md.

Prefer a small core and justified dependencies. Framework independence does
not require implementing every geometric utility ourselves. Record dependency
purpose, version/build, supported API, license and delivery route.

Start with one renderer and one chemical access route. Browser RDKit/WASM,
Python RDKit and host-service access have distinct runtime and packaging
requirements. Do not bundle all routes by default.

For any Python companion, follow the current received
[development workspace contract](https://github.com/uibcdf/molsyssuite/blob/main/devguide/development_workspace.md)
and applicable Python 3.11-3.14 support policy. Shared-environment eligibility
requires its own receiving; avoid inventing a new routine environment or
changing an existing shared prefix during documentation work.

Review ArgDigest, DepDigest, SMonitor, PyUnitWizard and Ackredit at their actual
Python/scientific boundaries. Record applicability; unused Python libraries
are not mandatory dependencies of a TypeScript-only core.

## Source learning, adaptation and license

The maintainer selected MIT on 2026-11-15; see LICENSE. A source reference is
not incorporation or a third-party license decision. No reference implementation
was incorporated in the first increment. TypeScript (Apache-2.0) and Prettier
(MIT) are development tools and are absent from the runtime tarball.

If code is copied or adapted, retain immutable origin, license, notices,
modifications and required attribution. Review actual files and transitive
artifacts. Distinguish conceptual inspiration from incorporated implementation.
Record any long-lived fork/patch with its owner and reassessment condition.

Do not assume that a WASM distribution or graphical export has the same asset
closure as the TypeScript sources. Include workers, WASM, fonts, styles and
their notices in artifact review.

## Delivery shape

The first target is a portable web library with explicit public types,
production assets and no host-specific dependency. ESM/type declarations are
the initial package direction. The private development package is
`@uibcdf/molsyssketcher`, with `dist/index.js` and `dist/index.d.ts`; its `0.0.0`
is a tooling placeholder, not a chosen release version. `npm run example`
is an executable synthetic consumer of this surface. A visual demo is pending.

The maintainer selected Conda distribution. npm is currently an internal
development/build boundary. The draft `devtools/conda-build/` recipe proposes
`noarch: generic` resources under `$PREFIX/share/molsyssketcher` and a separate
prefix-layout/relocation check. The official suite profiles require central
receiving for this artifact kind under suite #199. No unused Python facade is
introduced. Actual conda-build tooling, rendered recipe/archive, installed
candidate, release plan, publisher/credentials and public verification remain
P5 receiving work. Library versions, public tags and release titles must be
canonical `X.Y.Z` with no prefix or suffix; CI checks package/lock/tag equality.

The first real scientific route is unshipped Python source tooling under
`devtools/rdkit_adapter`, documented in RDKIT_PROVIDER.md. It uses the existing
Python 3.14 shared environment locally without changing its prefix. Its Conda
YAML is an explicit clean CI/bootstrap fixture; the separate provider job
checks installed SDK origins and executes the actual engine and pytest-receptor.
ArgDigest/DepDigest/SMonitor own the argument/dependency/diagnostic boundaries.
PyUnitWizard policy preservation is tested; nonphysical drawing coordinates
do not introduce a quantity-conversion boundary. Neither the core npm tarball
nor the draft resource recipe includes this source tool or new Python runtime
dependencies. A distributed companion/host adapter still needs its own receiving.

Receive a built artifact in an independent consumer to detect accidental
source-checkout imports. Test asset URLs, readiness, worker/WASM loading when
selected, resize and disposal. Keep controlled source integration distinct
from public package availability.

Publish an optional Python companion only if it provides an actual supported
boundary. Its metadata, environments, recipes and installed tests must agree
with the registered suite policy.

## Security and privacy boundaries

Validate format and payload limits at ingress. Handle external text/labels
without executable HTML. Review SVG imports separately from the component's
own generated SVG. Reject executable content in saved/exported graphics.

The host controls scientific data access and networking. A local service uses
bounded authenticated routes and an explicit process owner. Do not log
credentials or include private structures/source material in public reports,
fixtures or exported examples.

## CI, commits and release

Select local checks by changed behavior. Keep applicable quality, chemical,
browser, native-host, governance and artifact checks distinct. Record deferred
checks, owning issue and recovery route when the accepted CI policy permits
them; a skip marker is not an exemption from required gates.

Commit/push authority for a different repository is not implied by Sabueso
authority. This documentation task writes local files; future publication
follows the repository's applicable authorization.

Choose a release version after a substantial accepted milestone, independently
of Sabueso's version. Public GitHub Release titles use the canonical version.
Receive licenses, exact candidate, claimed platforms, installed artifacts and
public installation route before advertising delivery. Follow the suite's
applicable package/publication notice and archival policies.

## Platforms and temporary resources

Linux browser/QWebEngine is the first qualification target. Windows, macOS and
notebook support remain prospective until actual receiving. No platform is
currently qualified; portability is a design requirement.

Use task-owned temporary paths, retain useful scoped evidence and dispose
owned runtimes/workers after use. Preserve other sessions, worktrees and shared
environments. Benchmarks must respect the executing infrastructure's resource
controls and current shared-load conditions.

## Delivering two primary surfaces

Expose and document both product surfaces from the received library/artifact.
Implement common scene infrastructure once. Independent mounting or lazy
loading of selected providers is compatible with equal product status.

Package/type/asset checks must cover molecular and interaction views. A clean
consumer imports the production surfaces and exercises both finite minimums.
Record shared, molecular, interaction and editor readiness separately; a
successful molecular-only build does not qualify the joint product.
