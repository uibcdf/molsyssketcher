"""Delegate parsing, 2D layout, wedging and native references to RDKit."""

from argdigest import arg_digest
from depdigest import check_dependency
from smonitor import METADATA_ONLY, signal

from ._private.arguments import MAX_ATOMS  # registers the request pipeline
from ._private.smonitor import (
    MalformedInputError,
    MissingEngineError,
    PreparationError,
    UnsupportedFeatureError,
)

ATOM_ORIGIN = "_MolSysSketcherAtomOrigin"
BOND_ORIGIN = "_MolSysSketcherBondOrigin"
PARSER_OPTIONS = {"sanitize": True, "removeHs": False, "parseName": False, "allowCXSMILES": False}
LAYOUT_OPTIONS = {
    "canonOrient": True,
    "clearConfs": True,
    "nFlipsPerSample": 0,
    "nSample": 0,
    "sampleSeed": 0,
    "permuteDeg4Nodes": False,
    "bondLength": -1.0,
    "forceRDKit": True,
    "useRingTemplates": False,
    "usePathAngleExpansion": True,
}
DRAWING_OPTIONS = {
    "kekulize": True,
    "addChiralHs": False,
    "wedgeBonds": True,
    "forceCoords": False,
    "wavyBonds": False,
}


def _label(atom):
    symbol = atom.GetSymbol()
    isotope, charge = atom.GetIsotope(), atom.GetFormalCharge()
    if symbol == "C" and not isotope and not charge:
        return ""
    hydrogens = atom.GetTotalNumHs(includeNeighbors=False)
    label = (str(isotope) if isotope else "") + symbol
    if hydrogens:
        label += "H" + (str(hydrogens) if hydrogens != 1 else "")
    if charge:
        label += (str(abs(charge)) if abs(charge) != 1 else "") + ("+" if charge > 0 else "-")
    return label


def _admit_molecule(molecule, Chem):
    if not 0 < molecule.GetNumAtoms() <= MAX_ATOMS:
        raise UnsupportedFeatureError(reason="the admitted atom-count range")
    if molecule.GetStereoGroups():
        raise UnsupportedFeatureError(reason="enhanced stereochemistry")
    for atom in molecule.GetAtoms():
        if atom.HasQuery() or atom.GetAtomicNum() == 0 or atom.GetNumRadicalElectrons():
            raise UnsupportedFeatureError(reason="queries, dummy atoms or radicals")
        if atom.GetChiralTag() not in (
            Chem.ChiralType.CHI_UNSPECIFIED,
            Chem.ChiralType.CHI_TETRAHEDRAL_CW,
            Chem.ChiralType.CHI_TETRAHEDRAL_CCW,
        ):
            raise UnsupportedFeatureError(reason="non-tetrahedral atom stereochemistry")
    for bond in molecule.GetBonds():
        if bond.HasQuery() or bond.GetBondType() not in (
            Chem.BondType.SINGLE,
            Chem.BondType.DOUBLE,
            Chem.BondType.TRIPLE,
            Chem.BondType.AROMATIC,
        ):
            raise UnsupportedFeatureError(reason="the supplied bond type")
    for stereo in Chem.FindPotentialStereo(molecule, cleanIt=False, flagPossible=True):
        if stereo.specified != Chem.StereoSpecified.Specified:
            raise UnsupportedFeatureError(reason="unassigned or unknown potential stereochemistry")
        if stereo.type not in (Chem.StereoType.Atom_Tetrahedral, Chem.StereoType.Bond_Double):
            raise UnsupportedFeatureError(reason="the supplied stereochemical class")


def _mapped_objects(interpreted, prepared):
    """Read actual retained origin properties rather than equating array positions."""
    maps = []
    for objects, origin, count in (
        (prepared.GetAtoms(), ATOM_ORIGIN, interpreted.GetNumAtoms()),
        (prepared.GetBonds(), BOND_ORIGIN, interpreted.GetNumBonds()),
    ):
        mapping = {}
        for item in objects:
            if not item.HasProp(origin):
                raise UnsupportedFeatureError(
                    reason="generated drawing objects without semantic correspondence"
                )
            semantic = item.GetIntProp(origin)
            if semantic in mapping:
                raise UnsupportedFeatureError(reason="non-bijective drawing correspondence")
            mapping[semantic] = item.GetIdx()
        if set(mapping) != set(range(count)):
            raise UnsupportedFeatureError(reason="incomplete drawing correspondence")
        maps.append(mapping)
    return maps


@signal(tags=["molsyssketcher", "rdkit", "preparation"], capture_policy=METADATA_ONLY)
@arg_digest(
    config="devtools.rdkit_adapter._argdigest",
    capture_policy=METADATA_ONLY,
    map={"request": {"kind": "molsyssketcher_rdkit", "rules": ["request"]}},
)
def prepare_smiles(request):
    """Preparing one bounded SMILES input with explicit context and exact maps.

    Parameters
    ----------
    request : dict
        Original SMILES, documentId, source reference and exact molecular context.

    Returns
    -------
    dict
        Prepared-molecule document plus native RDKit MOL/SVG/SMILES references.

    Raises
    ------
    ArgumentError, MalformedInputError, UnsupportedFeatureError, PreparationError
        Invalid requests, malformed/unsupported chemistry or a failed provider operation.
    MissingEngineError
        The explicitly requested RDKit engine is unavailable.

    Notes
    -----
    This source-development route is serial and does not implement a host service.
    Drawing coordinates have no physical length unit. No unit policy is configured.
    """
    check_dependency(
        "rdkit",
        caller="molsyssketcher.rdkit.prepare_smiles",
        conda_name="rdkit",
        conda_channel="conda-forge",
        exception_class=MissingEngineError,
    )
    # The selected engine is loaded only for this operation. Broken imports propagate.
    from rdkit import Chem, rdBase
    from rdkit.Chem import rdDepictor
    from rdkit.Chem.Draw import rdMolDraw2D

    parameters = Chem.SmilesParserParams()
    for key, value in PARSER_OPTIONS.items():
        setattr(parameters, key, value)
    # Scoped RDKit logs avoid leaking original text in native parser diagnostics.
    with rdBase.BlockLogs():
        interpreted = Chem.MolFromSmiles(request["smiles"].strip(), parameters)
    if interpreted is None:
        raise MalformedInputError()
    _admit_molecule(interpreted, Chem)
    canonical = Chem.MolToSmiles(interpreted, isomericSmiles=True)
    for atom in interpreted.GetAtoms():
        atom.SetIntProp(ATOM_ORIGIN, atom.GetIdx())
    for bond in interpreted.GetBonds():
        bond.SetIntProp(BOND_ORIGIN, bond.GetIdx())

    try:
        rdDepictor.Compute2DCoords(interpreted, **LAYOUT_OPTIONS)
        prepared = rdMolDraw2D.PrepareMolForDrawing(interpreted, **DRAWING_OPTIONS)
    except Exception as error:
        raise PreparationError(stage="2D layout/drawing preparation") from error
    atom_map, bond_map = _mapped_objects(interpreted, prepared)
    # A kekulized drawing copy can have different canonical traversal/ranking.
    # Re-perceive only an owned verification copy before comparing chemistry.
    verification_copy = Chem.Mol(prepared)
    Chem.SanitizeMol(verification_copy)
    if Chem.MolToSmiles(verification_copy, isomericSmiles=True) != canonical:
        raise PreparationError(stage="chemical interpretation preservation")
    atom_ids = {i: f"atom:{i}" for i in atom_map}
    bond_ids = {i: f"bond:{i}" for i in bond_map}
    inverse_atoms = {display: semantic for semantic, display in atom_map.items()}
    display_atoms = {i: f"display-atom:{i}" for i in inverse_atoms}
    conformer = prepared.GetConformer()
    atoms = [
        {
            "id": atom_ids[atom.GetIdx()],
            "providerIndex": atom.GetIdx(),
            "element": atom.GetSymbol(),
            "isotope": atom.GetIsotope() or None,
            "formalCharge": atom.GetFormalCharge(),
            "hydrogenCount": atom.GetTotalNumHs(includeNeighbors=False),
        }
        for atom in interpreted.GetAtoms()
    ]
    bonds = [
        {
            "id": bond_ids[bond.GetIdx()],
            "providerIndex": bond.GetIdx(),
            "atoms": [atom_ids[bond.GetBeginAtomIdx()], atom_ids[bond.GetEndAtomIdx()]],
        }
        for bond in interpreted.GetBonds()
    ]
    depiction_atoms = []
    for semantic, display in atom_map.items():
        position = conformer.GetAtomPosition(display)
        depiction_atoms.append(
            {
                "id": display_atoms[display],
                "atomId": atom_ids[semantic],
                "origin": "mapped",
                "x": position.x,
                "y": position.y,
                "label": _label(prepared.GetAtomWithIdx(display)),
            }
        )
    depiction_bonds = []
    styles = {
        Chem.BondType.SINGLE: "single",
        Chem.BondType.DOUBLE: "double",
        Chem.BondType.TRIPLE: "triple",
    }
    for semantic, display in bond_map.items():
        bond = prepared.GetBondWithIdx(display)
        original_bond = interpreted.GetBondWithIdx(semantic)
        if {inverse_atoms[bond.GetBeginAtomIdx()], inverse_atoms[bond.GetEndAtomIdx()]} != {
            original_bond.GetBeginAtomIdx(),
            original_bond.GetEndAtomIdx(),
        }:
            raise PreparationError(stage="bond endpoint correspondence")
        style = styles.get(bond.GetBondType())
        if style is None:
            raise UnsupportedFeatureError(reason="the prepared bond representation")
        direction = bond.GetBondDir()
        if direction in (Chem.BondDir.EITHERDOUBLE, Chem.BondDir.UNKNOWN):
            raise UnsupportedFeatureError(reason="unknown drawing-bond stereochemistry")
        entry = {
            "id": f"display-bond:{display}",
            "bondId": bond_ids[semantic],
            "atoms": [display_atoms[bond.GetBeginAtomIdx()], display_atoms[bond.GetEndAtomIdx()]],
            "style": style,
        }
        if direction in (Chem.BondDir.BEGINWEDGE, Chem.BondDir.BEGINDASH):
            entry.update(
                style="solid-wedge" if direction == Chem.BondDir.BEGINWEDGE else "hashed-wedge",
                **{"from": display_atoms[bond.GetBeginAtomIdx()]},
            )
        depiction_bonds.append(entry)

    drawer = rdMolDraw2D.MolDraw2DSVG(400, 300)
    drawer.drawOptions().prepareMolsBeforeDrawing = False
    drawer.DrawMolecule(prepared)
    drawer.FinishDrawing()
    document = {
        "schemaVersion": 1,
        "kind": "prepared-molecule",
        "id": request["documentId"],
        "original": {"format": "smiles", "data": request["smiles"], "source": request["source"]},
        "context": request["context"],
        "provider": {
            "name": "RDKit",
            "version": rdBase.rdkitVersion,
            "build": rdBase.rdkitBuild,
            "route": "python-rdkit-source",
            "options": {
                "parser": dict(PARSER_OPTIONS),
                "layout": dict(LAYOUT_OPTIONS),
                "preparation": dict(DRAWING_OPTIONS),
                "drawingCoordinates": "nonphysical",
                "verification": "sanitized-owned-drawing-copy",
                "molBlockExport": {"basis": "sanitized-owned-drawing-copy", "kekulize": True},
                "maxAtoms": MAX_ATOMS,
            },
        },
        "atoms": atoms,
        "bonds": bonds,
        "depiction": {
            "generation": request["context"]["preparation"]["generation"],
            "profile": "supplied-bijective@1",
            "coordinates": "drawing",
            "axes": "x-right-y-up",
            "atoms": depiction_atoms,
            "bonds": depiction_bonds,
            "coverage": {"status": "complete", "missing": []},
        },
    }
    return {
        "schemaVersion": 1,
        "kind": "rdkit-preparation",
        "document": document,
        "reference": {
            "isomericSmiles": canonical,
            "molBlock": Chem.MolToMolBlock(verification_copy, kekulize=True),
            "svg": drawer.GetDrawingText(),
        },
    }
