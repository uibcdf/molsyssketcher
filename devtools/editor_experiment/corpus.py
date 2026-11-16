"""Generate native RDKit receipts for the internal ethanol bond-order experiment."""

import argparse
import json
from copy import deepcopy
from pathlib import Path

from devtools.rdkit_adapter import prepare_smiles

OUTPUT = Path(__file__).resolve().parents[2] / "tests/data/editor-experiment.json"


def request(smiles, state):
    source = {"owner": "molsyssketcher-edit-experiment", "id": "ethanol-draft", "generation": state}
    return {
        "smiles": smiles,
        "documentId": "ethanol-draft",
        "source": source,
        "context": {
            "molecule": dict(source),
            "chemicalState": state,
            "structure": "no-physical-structure",
            "preparation": {"owner": source["owner"], "id": "native-layout", "generation": state},
        },
    }


def graph(molecule):
    return {
        "atoms": [
            {
                "id": f"atom:{a.GetIdx()}",
                "element": a.GetSymbol(),
                "isotope": a.GetIsotope() or None,
                "formalCharge": a.GetFormalCharge(),
            }
            for a in molecule.GetAtoms()
        ],
        "bonds": [
            {
                "id": f"bond:{b.GetIdx()}",
                "atoms": [f"atom:{b.GetBeginAtomIdx()}", f"atom:{b.GetEndAtomIdx()}"],
                "order": int(b.GetBondTypeAsDouble()),
            }
            for b in molecule.GetBonds()
        ],
    }


def rotated(record, Chem):
    result = deepcopy(record)
    molecule = Chem.MolFromMolBlock(record["reference"]["molBlock"], removeHs=False)
    conformer = molecule.GetConformer()
    # An explicit rigid presentation transform of native prepared coordinates.
    # It is not a chemical edit or a second chemical-layout algorithm.
    for index in range(molecule.GetNumAtoms()):
        p = conformer.GetAtomPosition(index)
        conformer.SetAtomPosition(index, (-p.y, p.x, p.z))
    for atom in result["document"]["depiction"]["atoms"]:
        index = next(
            a["providerIndex"] for a in result["document"]["atoms"] if a["id"] == atom["atomId"]
        )
        p = conformer.GetAtomPosition(index)
        atom.update(x=p.x, y=p.y)
    generation = result["document"]["context"]["preparation"]["generation"] + "-rotated"
    result["document"]["context"]["preparation"]["generation"] = generation
    result["document"]["depiction"]["generation"] = generation
    result["document"]["provider"]["options"]["experimentPresentation"] = {"rotationDegrees": 90}
    result["reference"]["molBlock"] = Chem.MolToMolBlock(molecule)
    assert (
        Chem.MolToSmiles(Chem.MolFromMolBlock(result["reference"]["molBlock"], removeHs=False))
        == record["reference"]["isomericSmiles"]
    )
    # The original SVG is a reference to the unrotated preparation, not this layout.
    result["reference"].pop("svg")
    return result


def generate():
    source = prepare_smiles(request("CCO\n", "original"))
    # prepare_smiles owns lazy dependency checks and the support-library boundary.
    from rdkit import Chem, rdBase

    original = Chem.MolFromSmiles("CCO")
    cases = {}
    for name, orders in {
        "single": (1, 1),
        "double": (2, 1),
        "carbonyl": (1, 2),
        "invalid-oxygen": (1, 3),
    }.items():
        molecule = Chem.RWMol(original)
        for bond, order in zip(molecule.GetBonds(), orders, strict=True):
            bond.SetBondType(
                {1: Chem.BondType.SINGLE, 2: Chem.BondType.DOUBLE, 3: Chem.BondType.TRIPLE}[order]
            )
        candidate = molecule.GetMol()
        projection = graph(candidate)
        provider = {"name": "RDKit", "version": rdBase.rdkitVersion, "operation": "SanitizeMol"}
        with rdBase.BlockLogs():
            try:
                Chem.SanitizeMol(candidate)
            except Chem.MolSanitizeException as error:
                cases[name] = {
                    "graph": projection,
                    "validation": {
                        "status": "invalid",
                        "graph": projection,
                        "provider": provider,
                        "reason": type(error).__name__,
                    },
                    "layouts": [],
                }
                continue
        # Noncanonical traversal preserves the finite source ordering; actual maps
        # below are verified rather than assumed for a general chemical class.
        smiles = Chem.MolToSmiles(candidate, canonical=False)
        prepared = source if name == "single" else prepare_smiles(request(smiles, name))
        received = Chem.MolFromMolBlock(prepared["reference"]["molBlock"], removeHs=False)
        assert graph(received) == projection
        assert [a["element"] for a in prepared["document"]["atoms"]] == ["C", "C", "O"]
        assert [b["atoms"] for b in prepared["document"]["bonds"]] == [
            b["atoms"] for b in projection["bonds"]
        ]
        cases[name] = {
            "graph": projection,
            "validation": {
                "status": "valid",
                "graph": projection,
                "provider": provider,
                "isomericSmiles": Chem.MolToSmiles(candidate),
            },
            "layouts": [prepared, rotated(prepared, Chem)],
        }
    return {
        "schemaVersion": 1,
        "scope": "fixed implicit-H ethanol developer experiment; native receipts, no live editing transport",
        "source": source["document"],
        "initialGraph": graph(original),
        "cases": cases,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    options = parser.parse_args()
    serialized = json.dumps(generate(), allow_nan=False, indent=2) + "\n"
    if options.check:
        if not OUTPUT.is_file() or OUTPUT.read_text() != serialized:
            raise SystemExit(
                "The internal editor native corpus differs; inspect before regenerating."
            )
        print("Editor experiment matches four native validation states and six prepared layouts.")
    else:
        OUTPUT.write_text(serialized)
        print("Prepared four native editor validation controls and six attributed layouts.")


if __name__ == "__main__":
    main()
