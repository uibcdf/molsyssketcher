# MolSysSketcher developer guide

This guide records two equally important product pillars: molecular
representation/exploration and molecular interaction diagrams. It contains
their shared architecture, independent acceptance, stages and continuation
checkpoint. An experimental supplied-document and replacement-controller
foundation, a bounded RDKit source adapter and a first molecular SVG surface
are implemented; full primary views and production scientific adapters remain pending.

Read [PROJECT.md](PROJECT.md), [CHECKPOINT.md](CHECKPOINT.md) and
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) first. The plan is the single
task ledger; the checkpoint identifies the next work and received evidence.

## Guide map

| Document | Question it answers |
| --- | --- |
| [Project](PROJECT.md) | What are we building, for whom, and within which boundaries? |
| [Architecture](ARCHITECTURE.md) | How are the document, scene, interaction, chemistry and hosts separated? |
| [Conceptual review](CONCEPTUAL_REVIEW.md) | What did source inspection reveal, and which refinements need receiving? |
| [Final design review](FINAL_DESIGN_REVIEW.md) | Is the whole design ready for implementation, and which bounded consistency fixes were made? |
| [Document model](DOCUMENT_MODEL.md) | What must remain identifiable and reproducible across changes? |
| [Prepared depiction](DEPICTION_CONTRACT.md) | How does interpreted chemistry become a correctly mapped drawing? |
| [Chemical providers](CHEMISTRY_PROVIDERS.md) | Which chemistry is delegated, through which contracts? |
| [Rendering and interaction](RENDERING_AND_INTERACTION.md) | How should the viewer look and behave? |
| [Integration](INTEGRATION.md) | How do web, desktop, notebook and suite consumers connect? |
| [Interaction diagrams](INTERACTION_DIAGRAMS.md) | What does the second primary pillar do, and how is its scientific/visual scope received? |
| [Editor](EDITOR.md) | How do we preserve a later editing path without building it first? |
| [Implementation plan](IMPLEMENTATION_PLAN.md) | Which stages and microsteps are done or pending? |
| [Roadmap](ROADMAP.md) | What are the usable delivery milestones and future directions? |
| [Checkpoint](CHECKPOINT.md) | Where do we resume, and what has actually been verified? |
| [Decisions](DECISIONS.md) | What has been agreed, and what remains provisional? |
| [Risks and open questions](RISKS_AND_OPEN_QUESTIONS.md) | Which uncertainties need an explicit decision or experiment? |
| [Tests and validation](TESTS_AND_VALIDATION.md) | What would establish chemical, interactive and integration correctness? |
| [Engineering](ENGINEERING.md) | How will tooling, dependencies, qualification and distribution be introduced? |
| [Supplied-input profile](SUPPLIED_INPUT_PROFILE.md) | What does the first executable foundation actually accept and guarantee? |
| [RDKit preparation](RDKIT_PROVIDER.md) | Which real chemical preparation route and native controls have been executed? |
| [Interaction SVG](INTERACTION_SVG_PROFILE.md) | Which first two-mode composition, exact mapped fragments and browser/native drawing controls are received? |
| [Participant topology](INTERACTION_TOPOLOGY_PROFILE.md) | How do compound/directed/mediated participants retain complete native membership through reversible grouping? |
| [Native interaction inspection](MOLSYSMT_INTERACTIONS_PROFILE.md) | Which bounded native MolSysMT page, mapping, coverage and quantity handshakes have been received? |
| [Molecular SVG profile](MOLECULAR_SVG_PROFILE.md) | Which measured drawing, selection, export and actual-browser controls have been received? |
| [Local workspace](WORKSPACE.md) | Where are the maintainer-provided source references and support tools? |
| [Reporting](reporting_protocol.md) | Which owning issues and executable checks apply to current TypeScript work? |
| [References](REFERENCES.md) | Which sources and owning issues informed the design? |
| [Historical records](archive/README.md) | Which earlier scope/evaluation records have been superseded? |

## Document authority and maintenance

Project direction agreed with the maintainer is distinguished from provisional
technical choices, prospective APIs and executed results. An API illustrated in
this guide is a design requirement until implemented and tested.

MolSysSuite owns suite-member admission, shared engineering rules and
cross-member contracts. Read its
[canonical component guide](https://github.com/uibcdf/molsyssuite/blob/main/MOLSYSSUITE_GUIDE.md)
and [starter/admission route](https://github.com/uibcdf/molsyssuite/blob/main/devguide/new_component_starter_kit.md).
The existence of this repository does not establish registration or compliance.

Keep this guide in English. Update the affected contract, task ledger, decisions
and checkpoint with the implementation that changes them. Record a result's
exact source/provider/artifact scope. Keep an unexecuted check pending.

This guide was established and conceptually reviewed on **2026-11-14**.
The checkpoint records documentation/review, executed contract work and the
remaining scientific/visual receiving separately.
