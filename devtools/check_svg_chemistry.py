"""Receive actual browser SVG bond geometry with native RDKit (source tooling).

This is a finite corpus oracle, not a production chemical image interpreter.
Atom identities/attributes and endpoint membership are supplied; bond orders and
wedge polarity/origin come from DOM primitives, never depiction style/from tags.
RDKit alone interprets the reconstructed graph and its nonphysical 2D geometry.
"""

import copy
import json
import math
import sys
from pathlib import Path

from rdkit import Chem, rdBase
from rdkit.Geometry import Point3D


def distance(a, b):
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])


def midpoint(a, b):
    return {key: (a[key] + b[key]) / 2 for key in ("x", "y")}


def reconstruct(item):
    document = item["document"]
    molecule = Chem.RWMol()
    indices = {}
    for atom in document["atoms"]:
        native = Chem.Atom(atom["element"])
        native.SetFormalCharge(atom["formalCharge"])
        native.SetIsotope(atom["isotope"] or 0)
        indices[atom["id"]] = molecule.AddAtom(native)
    positions = {atom["semanticId"]: atom["position"] for atom in item["sceneAtoms"]}
    drawings = {bond["semanticId"]: bond["shapes"] for bond in item["bonds"]}
    assert len(drawings) == len(document["bonds"])
    for bond in document["bonds"]:
        shapes = drawings[bond["id"]]
        first, second = bond["atoms"]
        direction = None
        order = 1
        if len(shapes) == 1 and shapes[0]["tag"] == "polygon":
            points = shapes[0]["points"]
            assert len(points) == 3

            def angle(index):
                a, b, c = points[index], points[(index + 1) % 3], points[(index + 2) % 3]
                return math.acos(
                    max(
                        -1,
                        min(
                            1,
                            sum((b[k] - a[k]) * (c[k] - a[k]) for k in ("x", "y"))
                            / (distance(a, b) * distance(a, c)),
                        ),
                    )
                )

            apex = min(range(3), key=angle)
            narrow = points[apex]
            wide = midpoint(points[(apex + 1) % 3], points[(apex + 2) % 3])
            direction = Chem.BondDir.BEGINWEDGE
        elif len(shapes) == 8 and all(shape["tag"] == "line" for shape in shapes):
            bars = sorted(shapes, key=lambda s: distance(*s["points"]))
            start, end = bars[0]["points"], bars[-1]["points"]
            a, b = midpoint(*start), midpoint(*end)
            small, large = distance(*start), distance(*end)
            assert 0 < small < large
            # Extrapolate the actual hatch width gradient to zero width.
            narrow = {k: a[k] - (b[k] - a[k]) * small / (large - small) for k in ("x", "y")}
            wide = b
            direction = Chem.BondDir.BEGINDASH
        else:
            assert len(shapes) in (1, 2, 3)
            assert all(shape["tag"] == "line" for shape in shapes)
            order = len(shapes)
            narrow, wide = [
                {k: sum(shape["points"][i][k] for shape in shapes) / order for k in ("x", "y")}
                for i in (0, 1)
            ]
        if distance(narrow, positions[second]) < distance(narrow, positions[first]):
            first, second = second, first
        assert distance(narrow, positions[first]) < 0.001
        # Final hatch is intentionally inset; all other centers meet endpoints.
        assert distance(wide, positions[second]) < (4 if len(shapes) == 8 else 0.001)
        molecule.AddBond(
            indices[first],
            indices[second],
            (None, Chem.BondType.SINGLE, Chem.BondType.DOUBLE, Chem.BondType.TRIPLE)[order],
        )
        if direction is not None:
            molecule.GetBondBetweenAtoms(indices[first], indices[second]).SetBondDir(direction)
    native = molecule.GetMol()
    Chem.SanitizeMol(native)
    conformer = Chem.Conformer(native.GetNumAtoms())
    conformer.Set3D(False)
    for atom_id, index in indices.items():
        point = positions[atom_id]
        conformer.SetAtomPosition(index, Point3D(point["x"], -point["y"], 0))
    native.AddConformer(conformer)
    Chem.AssignChiralTypesFromBondDirs(native)
    # Native coordinate receiving used by RDKit's own MOL parser; the pinned
    # Python binding labels this function deprecated but still exposes it.
    Chem.DetectBondStereochemistry(native)
    Chem.AssignStereochemistry(native, cleanIt=True, force=True)
    block = Chem.MolToMolBlock(native)
    received = Chem.MolFromMolBlock(block, removeHs=False)
    assert received is not None
    return Chem.MolToSmiles(received, isomericSmiles=True)


def verify(path):
    drawings = json.loads(Path(path).read_text())
    assert len(drawings) == 12, "Receive every declared native control"
    results = {}
    for item in drawings:
        result = reconstruct(item)
        assert result == item["referenceSmiles"], (item["id"], result, item["referenceSmiles"])
        results[item["id"]] = result

    # Meaningful adverse controls: mirroring actual geometry must invert the
    # tetrahedron, while mirroring an alkene keeps its relative E/Z relationship.
    for case_id in ("tetra-a", "tetra-b", "alkene-a", "alkene-b"):
        mirrored = copy.deepcopy(next(item for item in drawings if item["id"] == case_id))
        for atom in mirrored["sceneAtoms"]:
            atom["position"]["x"] *= -1
        for bond in mirrored["bonds"]:
            for shape in bond["shapes"]:
                for point in shape["points"]:
                    point["x"] *= -1
        comparison = reconstruct(mirrored) == results[case_id]
        assert comparison == case_id.startswith("alkene"), case_id
    assert results["tetra-a"] != results["tetra-b"]
    assert results["alkene-a"] != results["alkene-b"]
    print(
        json.dumps(
            {"rdkit": rdBase.rdkitVersion, "received": results, "mirrorControls": 4}, indent=2
        )
    )


if __name__ == "__main__":
    verify(sys.argv[1])
