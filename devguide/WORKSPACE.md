# Local source and tool map

Locations supplied by the maintainer and verified on 2026-11-15. Relative paths
below start at the MolSysSketcher repository root. These are development sources,
not implicit runtime dependencies or supported public installation routes.

| Local source | Use |
| --- | --- |
| `../molsysmt` | Molecular interoperability, supported chemistry and owner-native interaction results |
| `../molsysviewer` | Separate 3D view, current-model correspondence and host integration |
| `$HOME/repos@others/rdkit` | Chemical provider and prepared-depiction reference |
| `$HOME/repos@others/smilesDrawer` | Molecular drawing, typography and geometry reference |
| `$HOME/repos@others/ketcher` | Editing, document and interaction reference |
| `$HOME/repos@others/molstar` | 3D/scientific interaction implementation reference |
| `../pharmacophoremt` | Pharmacophore definitions, hypotheses and quantities |
| `../bindingmt` | Binding-specific analysis and characterization |
| `../topomt` | Pocket/topography and physical projection context |
| `../peptidemt` | Peptide-specific chemical/detail workflows |
| `../molsyssuite` | Canonical governance, admission, reusable tooling and guide synchronization |

The local RDKit, SmilesDrawer and Ketcher heads match the commits in the dated
conceptual review. Inspect the actual source state before a new experiment.
No third-party implementation was copied into this first increment.

## Required support boundaries

The maintainer requires using the supported libraries where their boundary
exists. Read their canonical `standards/*_GUIDE.md` before integration:

- `../pyunitwizard`: physical quantity validation, conversion and interchange;
- `../argdigest`: Python public argument contracts and normalization;
- `../smonitor`: structured diagnostics and preservation of application policy;
- `../depdigest`: selected optional dependencies and lazy loading;
- `../pytest-receptor`: `python -m pytest --receptor=llm` locally and the CI
  profile for hosted pytest;
- `../gh-run-receptor`: applicable first Actions inspection with native evidence
  fallback when information is incomplete.

The current code is TypeScript with no Python runtime boundary. The four Python
support libraries and pytest-receptor are not installed into a manufactured
Python package. Their runtime integration becomes applicable with the first
Python/provider adapter. TypeScript consumes explicit serialized quantities
and diagnostics from that boundary; it does not reimplement these providers.
Native Node/browser tests retain their selected tools.

Preserve sibling checkouts, shared environments and human work. Consult owning
instructions and supported APIs before proposing a provider change. Record exact
versions and source/artifact scope for each executed integration experiment.
