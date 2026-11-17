# Reporting and local validation profile

The common lifecycle is owned by
[MolSysSuite](https://github.com/uibcdf/molsyssuite/blob/main/devguide/reporting_protocol.md).
Published policy-v1.6.0 registers this component and provides its immutable native
TypeScript engineering gate. Component #8 receives actual adoption and the remaining
original artifact/profile acceptance; suite #199 owns the shared contract.

Use `uibcdf/molsyssketcher#<number>` for component work and provider repositories
for provider behavior. Every queued or archived report has a local owning issue.
An incoming issue or a maintained plan need not acquire a queued report.
Open the owning issue before adding a report from `templates/report.md`.
Open bugs live in `pending_bugs/`, proposals in `pending_proposals/` and all
resolved, withdrawn or superseded records in permanent `archive/`.
Use the common front matter and statuses. A blocked report names `blocked_by`;
a resolved report names a relevant durable `guard` or `normative` document and
an ISO closing date. Move closed reports to the archive and synchronize the
owning issue's outcome. Archive, never delete; append dated historical corrections.

Regenerate and validate metadata/identity/status/guard/index consistency offline:

```bash
python devtools/devguide_index.py
npm run check:reports
```

`check:reports` runs the policy-generated administrative Python validator/index
checker; `check:docs` retains the existing Markdown link/anchor and task-ledger
checks. `npm run check` executes both. Python 3.14 is administrative tooling,
not a distributed Python package, scientific runtime or facade.

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

The first MolSysMT source-provider selector is
`devtools/molsysmt_adapter/tests/test_projection.py`, using pytest-receptor via
`npm run test:interactions`. Its recorded native pages cross
`tests/interaction-page.test.mjs`; Python also sends freshly calculated pages to
the built public Node module. CI builds the exact native provider source and
retains its runtime/binary identity separately. See the
[native profile](MOLSYSMT_INTERACTIONS_PROFILE.md); this receives inspection,
not interaction drawings, a published provider pair or Qt.

The I1.3 selectors are `tests/interaction-topology.test.mjs` and
`devtools/molsysmt_adapter/tests/test_participants.py`. The latter uses the same
pytest-receptor command/CI native source build. Fresh native participant pages
cross the built public topology API; these are analytical membership controls,
not graphical interaction evidence. See the
[topology profile](INTERACTION_TOPOLOGY_PROFILE.md).

The first interaction SVG selectors are `tests/interaction-diagram.test.mjs`,
`tests/browser/interactions.browser.mjs` and
`devtools/molsysmt_adapter/tests/test_diagrams.py`. Browser drawing evidence is
received by `python -m devtools.check_interaction_svg <path>/drawings.json`,
reusing the established RDKit primitive oracle. CI runs both stored diagrams and
fresh diagrams generated after the exact native provider build. See the
[SVG profile](INTERACTION_SVG_PROFILE.md) for their independent finite scopes.

## Local Node guard profile

This TypeScript starter uses one regular module selector under `tests/`, ending
in `.test.mjs`. `devtools/check-node-guard.mjs` parses the module with the pinned
TypeScript compiler, resolves an imported `node:test` binding and at least one
top-level named static test call. Comments, unrelated calls, dynamic wrappers,
symlinks, traversal and shell/node suffixes do not establish addressability.
Run `npm run build` and `node --test --test-isolation=none <module>` for actual
execution; static addressability never proves relevance or scientific validity.
Administrative Python/index tooling calls this resolver after npm ci, offline.
It is not shipped or installed as a Python package or scientific runtime.
