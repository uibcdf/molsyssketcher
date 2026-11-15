# First RDKit preparation route

Implemented under [component #2](https://github.com/uibcdf/molsyssketcher/issues/2).
This is a source-development Python adapter in `devtools/rdkit_adapter`, not a
published/installed Python companion or host service. The TypeScript runtime
and draft Conda resource payload remain independent of Python and RDKit.

## Executable boundary

`prepare_smiles(request)` returns a `prepared-molecule` document accepted by the
built TypeScript molecular controller, plus attributed owner-native isomeric
SMILES, MOL and SVG reference outputs. The CLI explicitly receives two paths:

```bash
python -m devtools.rdkit_adapter request.json prepared.json
```

The request has exactly `smiles`, `documentId`, `source` and `context`.
`source` is an owner/id/generation reference. `context` declares molecule,
chemicalState, structure and preparation using the same exact references as
the TypeScript profile. `request_for` in the corpus module provides complete
examples. Caller context is retained; names or canonical strings never create
cross-component identity. Corpus structure tokens explicitly indicate that no
physical structure was supplied.

The source route accepts one SMILES token of at most 4,096 characters, a
1,000,000-byte request JSON file and at most 256 parsed atoms. It performs no
networking or automatic engine substitution. It is serial: scoped RDKit log
suppression, provider capacity, hard timeouts and concurrent host execution need
their own receiving before a service/production transport is introduced.
CLI output uses exclusive creation; a failed request leaves an existing output
artifact unchanged.

## Selected scientific policies

| Operation | Received API/policy |
| --- | --- |
| Interpret SMILES | RDKit `SmilesParserParams`: sanitize, retain explicit H atoms, disable name/CXSMILES interpretation; original text remains unchanged |
| Generate layout | `Compute2DCoords` with recorded options, RDKit forced explicitly regardless of global CoordGen preference |
| Prepare drawing | Owned `PrepareMolForDrawing` copy, kekulization/wedging enabled, chiral-H insertion disabled |
| Correspondence | Atom/bond origin properties carried through actual preparation, verified as complete bijections; endpoints checked against the original semantic bonds |
| Verify chemistry | Sanitize an owned verification copy with RDKit before comparing isomeric SMILES; drawing representation/ranking alone is not a chemical difference |
| Native MOL reference | RDKit writer with kekulization enabled on the verified copy; admitted cases round-trip through the native reader with explicit H retained |
| Native SVG reference | RDKit draws the already prepared copy with automatic drawing preparation disabled; this reference does not qualify our future renderer |

The engine version, its provider-reported build tag and every parser/layout/preparation option travel
in `document.provider`. Chemical fields/H counts come from RDKit. Plain supplied
label text is a first-profile label declaration; coherent typographic layout,
font metrics and hit geometry still belong to the future scene.

The inspected MolSysMT SMILES converter at
`6deb0200cd7e384128eded46caaf751a57e65bc6` uses RDKit's default parser policy;
no 2D drawing-preparation route was found in the inspected local source.
The chosen first route calls RDKit's supported public operations directly with
explicit H/parser/drawing policies. It does not implement another perception,
layout or scientific detector. MolSysMT integration and owner-native interaction
results remain separate pending work.

## Finite matrix and native evidence

Twelve synthetic SMILES controls cover methanol, benzene, disconnected charged
ions, an isotope, an explicit H atom, a tetrahedral stereo pair, an alkene
stereo pair, aromatic `[nH]`, fused rings and a macrocycle. Inputs and expected
atom/bond counts are in `tests/data/rdkit-corpus.json`; generated documents and
native reference figures are in `tests/data/rdkit-prepared.json`.
No private input or third-party implementation was incorporated.

The initial route refuses dummy/query atoms, radicals, non-admitted bond types,
non-tetrahedral atom stereo, unknown/unassigned potential stereo, generated or
non-bijective drawing objects, names/CXSMILES and over-limit inputs. This is an
explicit first-profile limitation, not a claim that RDKit cannot handle them.
There is no silent chemical simplification to make an input drawable.

`npm run corpus:prepare` regenerates the attributed corpus deliberately;
`npm run corpus:check` executes the selected live RDKit version and checks every
recorded result, including native references. Generated data is excluded from
Prettier so its native output is preserved. A provider/version difference needs
review rather than blindly accepting a new snapshot.

The native MOL writer's aromatic policy matters: writing aromatic `[nH]` with
`kekulize=False` did not round-trip in the selected engine. The received route
uses the standard kekulized export and verifies all twelve round trips. This
is a route/option finding, not an asserted upstream defect.

## Support tools and qualification limits

ArgDigest declares the closed call and registered bounded request pipeline.
DepDigest checks only the selected lazy RDKit operation, distinguishing absence
from a broken import. SMonitor supplies catalog-backed diagnostics and scoped
metadata-only capture; provider registration preserves the application's policy.
Its source controls cover templates, all profiles, args/pickle reconstruction,
reserved attributes and a same-process support bundle. Configuration validation
invokes the installed SMonitor CLI entry from the source module context; it does
not claim an installed adapter wheel.

Drawing coordinates have no physical unit. PyUnitWizard conversion is therefore
not applicable to this data; a non-default host-unit-policy regression confirms
the adapter leaves it unchanged. Physical interaction measures will use the
provider's quantity boundary when implemented. No unused quantity dependency
is added to the web runtime or the adapter.

Local execution uses the existing verified Python 3.14 shared environment;
`devtools/conda-envs/rdkit-provider-py314.yaml` is a clean CI/bootstrap fixture,
not a second daily environment or a change to a shared prefix. It pins the
selected published RDKit/support/test tools. Local support libraries are
controlled editables; hosted installed-provider evidence is recorded separately.

```bash
npm run build
python -m pytest --receptor=llm devtools/tests
ruff check devtools/rdkit_adapter devtools/tests
ruff format --check devtools/rdkit_adapter devtools/tests
npm run corpus:check
npm run check
```

The current controls are 40 Python tests and 23 Node tests. They receive actual
native preparation, its admitted chemical round trips, exact mappings and JSON
handoff into the built TypeScript boundary. They do not qualify another RDKit
version, a published companion/Conda archive, an own SVG renderer, actual browser/
Qt behavior, 3D correspondence, native interactions or upstream numerical science.
