# Working on this developer guide

Read [../AGENTS.md](../AGENTS.md), [reporting_protocol.md](reporting_protocol.md), the repository README, this directory's README, CHECKPOINT.md and
IMPLEMENTATION_PLAN.md before changing the project plan. Consult the
[canonical MolSysSuite guide](https://github.com/uibcdf/molsyssuite/blob/main/MOLSYSSUITE_GUIDE.md)
for shared ownership, reporting and admission rules.

Keep repository prose in English. Preserve the distinction between agreed
direction, proposed contracts, implementation and executed validation.
Update the task ledger and checkpoint together when progress changes.

Put technical decisions and findings in the maintained technical documents and
their owning issues. Use DECISIONS.md for decisions and
RISKS_AND_OPEN_QUESTIONS.md for unresolved questions. Do not convert every
technical finding into a contributor instruction.

The suite-owned proposal is
[MolSysSuite #199](https://github.com/uibcdf/molsyssuite/issues/199).
Route provider defects to their owners and cross-link consumer work. Existing
internal reporting authorization retains its scope; publication outside UIBCDF
requires explicit permission for the destination, action and concrete material.

Follow [the common working-instruction rules](../MOLSYSSUITE_GUIDE.md#durable-working-instructions).
Queued reports use `pending_bugs/` and `pending_proposals/`; permanent history
uses `archive/`. Start from `templates/report.md`, regenerate indexes with
`python devtools/devguide_index.py`, then run `npm run check:reports`. Preserve
archived claims and append dated corrections. Published registration and eight
canonical guide copies are separate from executed engineering, product, resource
and original/public artifact receiving under component #8.
