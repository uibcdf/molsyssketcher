# MolSysSketcher working instructions

Read `README.md`, `devguide/CHECKPOINT.md` and `devguide/IMPLEMENTATION_PLAN.md`
before implementation. Keep code, tests, documentation and commits in English.
Preserve both primary views and their independent acceptance; production chemical
editing is the final stage.

Read and follow the applicable
[canonical MolSysSuite guide](https://github.com/uibcdf/molsyssuite/blob/main/MOLSYSSUITE_GUIDE.md),
including its [modular reusable tools](https://github.com/uibcdf/molsyssuite/blob/main/MOLSYSSUITE_GUIDE.md#modular-reusable-tools)
and durable working-instruction rules. The local checkout is `../molsyssuite`.
Formal admission, registered guide synchronization and the TypeScript-first
profile remain tracked in `uibcdf/molsyssuite#199`. This file does not establish
membership or waive applicable common rules. Local instructions refine the
common rules within their scope; explicit human/session instructions retain
their authority.

## Implementation and checks

Use the pinned Node/npm tools, `npm ci`, `npm run check` and `npm run pack:check`.
Conda is the intended public distribution route; receive its actual artifact
profile before publication. Library versions, public tags and release titles
use exactly `X.Y.Z`, without prefixes or suffixes.
Tests import the built public module. Follow `devguide/reporting_protocol.md`
for owning issues and local test selectors. Update the ledger and checkpoint
together, distinguishing synthetic contract tests from provider, browser, Qt,
scientific and installed-package evidence.

The core is framework-independent TypeScript. Delegate chemical interpretation,
layout preparation and scientific calculations to their owners. Use exact
context references and mappings; retain original declarations and explicit
missing/unsupported states. Preserve accepted data on failed replacement.

Consult the local sources in `devguide/WORKSPACE.md`. Use PyUnitWizard,
ArgDigest, SMonitor and DepDigest at the corresponding Python boundaries.
Use pytest-receptor for pytest and gh-run-receptor for applicable Actions
inspection. Keep native TypeScript/browser tests and their exit statuses.

## Authorization

The maintainer authorized direct commits/pushes to this repository and issue
publication in UIBCDF repositories for this work. Obtain explicit permission
and confirmation before publishing an issue in a third-party repository.
Preserve unrelated work and shared environments. This authorization does not
authorize a package release or changes to another owner's repository.
