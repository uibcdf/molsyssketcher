"""Actual native observations joined to mapped public RDKit fragment depictions."""

import argparse
import copy
import json
from pathlib import Path

from devtools.rdkit_adapter import prepare_smiles

from . import project_interactions
from .participant_corpus import native_cases

OUTPUT = Path(__file__).resolve().parents[2] / "tests/data/interaction-diagrams.json"


def _depictions(name, analysis, request):
    from rdkit import Chem

    smiles = (
        "c1ccccc1.c1ccccc1"
        if name.startswith("rings")
        else "N.N.O"
        if name == "hydrogen-bonds"
        else "N.O.C=O"
        if name == "one-water"
        else "N.O.O.C=O"
    )
    original = Chem.MolFromSmiles(smiles)
    if not name.startswith("rings"):
        original = Chem.AddHs(original)
    assert original.GetNumAtoms() == analysis.n_atoms
    for atom in original.GetAtoms():
        atom.SetAtomMapNum(atom.GetIdx() + 1)
    mappings = []
    fragments = Chem.GetMolFrags(original, asMols=True, fragsMolAtomMapping=mappings)
    parents = []
    references = []
    mapping = {}
    labels = (
        ["Benzene A", "Benzene B"]
        if name.startswith("rings")
        else ["Ammonia A", "Ammonia B", "Water"]
        if name == "hydrogen-bonds"
        else ["Ammonia", *[f"Water {i + 1}" for i in range(len(fragments) - 2)], "Formaldehyde"]
    )
    for i, fragment in enumerate(fragments):
        text = Chem.MolToSmiles(fragment, canonical=False, isomericSmiles=True, allHsExplicit=True)
        prepared = prepare_smiles(
            {
                "smiles": text,
                "documentId": f"{name}-parent-{i}",
                "source": request["document"]["parents"][i]["molecule"],
                "context": request["document"]["parents"][i],
            }
        )
        document = prepared["document"]
        parser = Chem.SmilesParserParams()
        for key, value in document["provider"]["options"]["parser"].items():
            setattr(parser, key, value)
        parsed = Chem.MolFromSmiles(document["original"]["data"], parser)
        received = []
        for atom in document["atoms"]:
            native = parsed.GetAtomWithIdx(atom["providerIndex"])
            source = native.GetAtomMapNum() - 1
            assert source in mappings[i] and source not in mapping
            expected = original.GetAtomWithIdx(source)
            assert (
                native.GetSymbol() == expected.GetSymbol()
                and native.GetFormalCharge() == expected.GetFormalCharge()
                and native.GetIsotope() == expected.GetIsotope()
            )
            mapping[source] = (i, atom["id"])
            received.append(source)
        assert set(received) == set(mappings[i])

        # Receive the complete original fragment bond graph through retained atom
        # map labels; matching counts or element labels alone is insufficient.
        def bonds(mol):
            return {
                tuple(sorted((b.GetBeginAtom().GetAtomMapNum(), b.GetEndAtom().GetAtomMapNum()))): (
                    str(b.GetBondType()),
                    b.GetIsAromatic(),
                )
                for b in mol.GetBonds()
            }

        assert bonds(parsed) == bonds(fragment)
        reference = Chem.MolFromMolBlock(prepared["reference"]["molBlock"], removeHs=False)
        for atom in reference.GetAtoms():
            atom.SetAtomMapNum(0)
        parents.append({"parentIndex": i, "label": labels[i], "molecule": document})
        references.append(
            {
                "parentIndex": i,
                "referenceSmiles": Chem.MolToSmiles(reference, isomericSmiles=True),
                "molBlock": prepared["reference"]["molBlock"],
                "sourceAtoms": received,
            }
        )
    for binding in request["correspondence"]["atoms"]:
        parent, identifier = mapping[binding["index"]]
        assert parent == binding["parentIndex"] and binding["sourceIndex"] == binding["index"]
        binding["atomId"] = identifier
    return parents, references, smiles


def generate():
    cases = []
    for name, analysis, request in native_cases():
        request = copy.deepcopy(request)
        parents, references, smiles = _depictions(name, analysis, request)
        modes = (
            ["ligand-centered", "interface-centered"]
            if name == "rings-parallel"
            else ["interface-centered"]
        )
        for mode in modes:
            request["document"]["mode"] = mode
            projection = project_interactions(analysis, request)
            n = len(parents)
            composition = (
                {"mode": mode, "focusParentIndex": 0}
                if mode == "ligand-centered"
                else {
                    "mode": mode,
                    "left": [0, 1] if name == "hydrogen-bonds" else [0],
                    "right": [n - 1],
                    "mediators": [] if name == "hydrogen-bonds" else list(range(1, n - 1)),
                }
            )
            groups = []
            if "water" in name:
                page = projection["native"]["page"]
                by_atom = {a["index"]: a for a in projection["correspondence"]["atoms"]}
                for parent in range(1, n - 1):
                    members = []
                    for row, occurrence in enumerate(page["occurrence_indices"]):
                        relation = page["relation_catalog_indices"].index(
                            page["relation_indices"][row]
                        )
                        start, end = page["relation_participant_offsets"][relation : relation + 2]
                        for part in range(start, end):
                            a, b = page["participant_atom_offsets"][part : part + 2]
                            if all(
                                by_atom[index]["parentIndex"] == parent
                                for index in page["participant_atoms"][a:b]
                            ):
                                members.append(
                                    {
                                        "occurrenceIndex": occurrence,
                                        "participantIndex": part - start,
                                    }
                                )
                    if members:
                        groups.append(
                            {
                                "id": f"mediator-{parent}",
                                "label": parents[parent]["label"],
                                "members": members,
                            }
                        )
            identifier = f"{name}-{mode}"
            cases.append(
                {
                    "id": identifier,
                    "sourceSmiles": smiles,
                    "input": {
                        "schemaVersion": 1,
                        "kind": "interaction-diagram",
                        "id": identifier,
                        "page": projection,
                        "parents": parents,
                        "composition": composition,
                        "groups": groups,
                    },
                    "references": references,
                }
            )
    return {
        "schemaVersion": 1,
        "scope": "Analytical native observations and mapped actual RDKit 2D fragment depictions; not a real complex/Qt/production transport qualification",
        "mapping": "Standard atom-map labels in retained derived fragment SMILES; actual parsed atom and bond correspondence verified",
        "cases": cases,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    options = parser.parse_args()
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_text(json.dumps(generate(), allow_nan=False, indent=2) + "\n")
    print("Prepared nine native two-mode diagram controls with exact RDKit fragment maps.")


if __name__ == "__main__":
    main()
