"""Analytical participant controls through public RDKit and MolSysMT APIs."""

import argparse
import json
from pathlib import Path

from . import project_interactions

OUTPUT = Path(__file__).resolve().parents[2] / "tests/data/molsysmt-participants.json"


def _prepare(smiles, *, explicit_hydrogens=True):
    import molsysmt as msm
    from rdkit import Chem

    molecule = Chem.MolFromSmiles(smiles)
    if explicit_hydrogens:
        molecule = Chem.AddHs(molecule)
    source = msm.convert(molecule, to_form="molsysmt.MolSys")
    # Receive the converter's actual atom identities before the fixture host
    # declares source indices/fragments; matching element labels is insufficient.
    assert msm.get(source, element="atom", atom_id=True) == [
        str(a.GetIdx()) for a in molecule.GetAtoms()
    ]
    assert msm.get(source, element="atom", atom_name=True) == [
        f"{a.GetSymbol()}{a.GetIdx()}" for a in molecule.GetAtoms()
    ]
    assert msm.get(source, element="atom", atom_type=True) == [
        a.GetSymbol() for a in molecule.GetAtoms()
    ]
    fragments = Chem.GetMolFrags(molecule)
    return molecule, source, fragments


def _request(name, molecule, fragments, frame=0):
    def reference(identifier):
        return {"owner": "analytical-participant-fixture", "id": identifier, "generation": "1"}

    parents = [
        {
            "molecule": reference(f"{name}-fragment-{i}"),
            "chemicalState": "rdkit-declared",
            "structure": f"frame-{frame}",
            "preparation": reference(f"{name}-preparation"),
        }
        for i in range(len(fragments))
    ]
    analysis = reference(f"{name}-analysis")
    parent_by_atom = {atom: i for i, fragment in enumerate(fragments) for atom in fragment}
    return {
        "document": {
            "schemaVersion": 1,
            "kind": "interaction-document",
            "id": name,
            "mode": "interface-centered",
            "parents": parents,
            "analyses": [{"result": analysis, "parents": parents}],
        },
        "analysis": analysis,
        "structureIndex": frame,
        "offset": 0,
        "limit": 50,
        "correspondence": {
            "authority": "caller-declared@1",
            "atoms": [
                {
                    "index": a.GetIdx(),
                    "sourceIndex": a.GetIdx(),
                    "parentIndex": parent_by_atom[a.GetIdx()],
                    "atomId": f"{a.GetSymbol()}{a.GetIdx()}",
                }
                for a in molecule.GetAtoms()
            ],
            "frames": [
                {
                    "parentIndex": i,
                    "index": frame,
                    "sourceIndex": frame,
                    "structure": f"frame-{frame}",
                }
                for i in range(len(parents))
            ],
        },
    }


def rings():
    import molsysmt as msm
    import numpy as np
    import pyunitwizard as puw

    molecule, source, fragments = _prepare("c1ccccc1.c1ccccc1", explicit_hydrogens=False)
    angle = np.arange(6) * np.pi / 3
    ring = np.column_stack([0.14 * np.cos(angle), 0.14 * np.sin(angle), np.zeros(6)])
    coordinates = np.array(
        [
            np.concatenate([ring, ring + [0, 0, 0.35]]),
            np.concatenate([ring, ring[:, [2, 1, 0]] + [0, 0, 0.4]]),
            np.concatenate([ring, ring + [0, 0, 2]]),
        ]
    )
    source.structures.append(coordinates=puw.quantity(coordinates, "nm"))
    analysis = msm.interactions.pi_pi.get_pi_pi_interactions(
        source,
        method="centroid_angle_offset",
        profile="least_squares",
        pbc=False,
        distance_threshold=".6 nm",
        angle_threshold="30 degrees",
        offset_threshold=".2 nm",
        planarity_threshold=".02 nm",
    )
    return analysis, [_request("rings", molecule, fragments, f) for f in range(3)]


def hydrogen_bonds():
    import molsysmt as msm
    import numpy as np
    import pyunitwizard as puw

    molecule, source, fragments = _prepare("N.N.O")
    xyz = np.zeros((molecule.GetNumAtoms(), 3))
    xyz[:3] = [[-0.1, 0, 0], [0.1, 0, 0], [0, 0.3, 0]]
    for heavy in range(3):
        hs = [a.GetIdx() for a in molecule.GetAtomWithIdx(heavy).GetNeighbors()]
        for j, h in enumerate(hs):
            xyz[h] = xyz[heavy] + [0, 0, (j + 1) * 0.1]
        if heavy < 2:
            direction = xyz[2] - xyz[heavy]
            xyz[hs[0]] = xyz[heavy] + 0.1 * direction / np.linalg.norm(direction)
    source.structures.append(coordinates=puw.quantity(xyz[None], "nm"))
    analysis = msm.interactions.hbonds.get_hbonds(source, method="baker_hubbard", pbc=False)
    return analysis, _request("two-donors", molecule, fragments)


def water_path(order=1, *, reverse_middle=False, periodic=False):
    import molsysmt as msm
    import numpy as np
    import pyunitwizard as puw

    molecule, source, fragments = _prepare("N." + "O." * order + "C=O")
    xyz = np.zeros((molecule.GetNumAtoms(), 3))
    carbon, acceptor = order + 1, order + 2
    xyz[0] = [-0.3, 0, 0]
    for i in range(1, order + 1):
        xyz[i] = [0.3 * (i - 1), 0, 0]
    xyz[carbon] = [0.3 * order, 0.13, 0]
    xyz[acceptor] = [0.3 * order, 0, 0]
    hs_by_heavy = {}
    for atom in molecule.GetAtoms():
        if atom.GetSymbol() == "H":
            continue
        hs = [a.GetIdx() for a in atom.GetNeighbors() if a.GetSymbol() == "H"]
        hs_by_heavy[atom.GetIdx()] = hs
        for j, h in enumerate(hs):
            xyz[h] = xyz[atom.GetIdx()] + [0, 0.1 * (j + 1), 0]
    xyz[hs_by_heavy[0][0]] = [-0.2, 0, 0]
    for i in range(1, order + 1):
        xyz[hs_by_heavy[i][0]] = xyz[i] + [0.1, 0, 0]
    if reverse_middle:
        assert order == 2
        xyz[hs_by_heavy[1][0]] = xyz[1] + [0, -0.1, 0]
        xyz[hs_by_heavy[2][1]] = xyz[2] + [-0.1, 0, 0]
    options = {}
    if periodic:
        # Whole fragments are translated by known integer images, preserving
        # covalent geometry; MolSysMT owns MIC and repeated-mediator image joins.
        for i, fragment in enumerate(fragments):
            xyz[list(fragment)] += [i % 2, -(i % 3), 0]
        options["box"] = puw.quantity(np.eye(3)[None], "nm")
    source.structures.append(coordinates=puw.quantity(xyz[None], "nm"), **options)
    analysis = msm.interactions.water_bridges.get_water_bridges(
        source,
        order=order,
        method="hbond_water_path",
        profile="indexed_water",
        hbond_method="baker_hubbard",
        pbc=periodic,
    )
    name = f"water-{order}" + ("-reverse" if reverse_middle else "") + ("-pbc" if periodic else "")
    return analysis, _request(name, molecule, fragments)


def native_cases():
    analysis, requests = rings()
    cases = [
        (name, analysis, request)
        for name, request in zip(("rings-parallel", "rings-edge", "rings-empty"), requests)
    ]
    cases.append(("hydrogen-bonds", *hydrogen_bonds()))
    cases.extend(
        (name, *water_path(order, **options))
        for name, order, options in [
            ("one-water", 1, {}),
            ("two-water", 2, {}),
            ("two-water-reverse", 2, {"reverse_middle": True}),
            ("two-water-periodic", 2, {"periodic": True}),
        ]
    )
    return cases


def generate():
    from rdkit import rdBase

    return {
        "schemaVersion": 1,
        "scope": "Analytical compound/directed/mediated controls calculated by public MolSysMT/RDKit; no molecular benchmark or graphical diagram qualification",
        "inputPreparation": {
            "tool": "RDKit",
            "version": rdBase.rdkitVersion,
            "build": rdBase.rdkitBuild,
            "route": "SMILES -> explicit H (except rings) -> public MolSysMT conversion",
            "declaredInputs": {
                "rings": "c1ccccc1.c1ccccc1",
                "hydrogen-bonds": "N.N.O",
                "one-water": "N.O.C=O",
                "two-water": "N.O.O.C=O",
            },
        },
        "cases": [
            {"id": name, "projection": project_interactions(analysis, request)}
            for name, analysis, request in native_cases()
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    options = parser.parse_args()
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_text(json.dumps(generate(), allow_nan=False, indent=2) + "\n")
    print("Prepared eight native participant controls; original roles/constituents retained.")


if __name__ == "__main__":
    main()
