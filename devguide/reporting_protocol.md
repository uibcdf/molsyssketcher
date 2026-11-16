# Reporting and local validation profile

The common lifecycle is owned by
[MolSysSuite](https://github.com/uibcdf/molsyssuite/blob/main/devguide/reporting_protocol.md).
Formal TypeScript-first admission and the centrally received non-Python selector
profile remain in [suite #199](https://github.com/uibcdf/molsyssuite/issues/199).
This local route supports current implementation without claiming admission.

Use `uibcdf/molsyssketcher#<number>` for component implementation and provider
repositories for provider behavior. Check existing owning issues before filing.
Issue #1 owns the first toolchain/document increment. Plans and checkpoints can
link that issue directly; no queued proposal document is required for a plan.
If a queued bug/proposal is introduced, open its issue first and receive the
common front matter, index and permanent archive lifecycle. Preserve the current
historical archive and its dated evidence.

The maintainer authorizes issue publication in UIBCDF repositories and direct
commits/pushes to this component. Third-party issue publication requires prior
explicit permission and confirmation for its destination and concrete content.
Package publication and cross-owner source changes retain separate authorization.

## Executable selectors

For a TypeScript contract guard use one explicit module path under `tests/`,
ending in `.test.mjs`, for example:

```bash
npm run build
node --test --test-isolation=none tests/controller.test.mjs
```

The current test command imports the built public ESM module and runs named
tests in one process. This explicit Node runner mode exposes individual test
counts in the local environment. Preserve its native exit status and failure
evidence. Tests exercise independent instance ownership without relying on
separate test-file processes. Python tests use pytest-receptor when introduced.

Run `npm run check` for strict types/compiler code checks, formatting, all
contract tests and local Markdown link/anchor/task-ledger consistency.
`npm run pack:check` builds and installs a tarball offline into a task-owned
temporary consumer, verifies public imports and declarations, then removes it.
`npm run example` executes the supplied-data journey. These checks do not
qualify chemistry, rendering, browser, Qt or a published package.

`npm run pack:conda:check` receives the proposed installed asset-prefix layout,
relocation, version/digests and imports. Conda distribution, canonical X.Y.Z
versions and a draft generic-resource recipe are recorded; no Conda archive
or public channel is qualified by that layout check.

For the finite molecular browser boundary use `npm run test:browser` with
Playwright's installed Chromium, or an explicit `MOLSYSSKETCHER_BROWSER_EXECUTABLE`.
Preserve its native Node exit status. Receive extracted DOM bond geometry using
`python devtools/check_svg_chemistry.py <evidence-directory>/drawings.json` in
the provisioned native RDKit environment. Browser evidence, the native chemical
oracle and graphical review have different scopes; none qualifies Qt or the
complete primary views. See [the profile](MOLECULAR_SVG_PROFILE.md).

The P2.5 internal selector is `devtools/editor_experiment/session.test.mjs`,
compiled/type-checked and run by `npm run test:experiment`. `npm run check`
includes that runner. Native controls live in `devtools/tests/test_editor_experiment.py`
and use pytest-receptor; browser receiving stays in `tests/browser/svg.browser.mjs`.
These selectors receive a developer experiment, not a shipped editing API.
