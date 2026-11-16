"""Analytical ionic controls calculated by the actual public MolSysMT API."""

import argparse
import json
from pathlib import Path

from . import project_interactions

OUTPUT = Path(__file__).resolve().parents[2] / "tests/data/molsysmt-interactions.json"


def native_analysis(*, periodic=False):
    import molsysmt as msm
    import numpy as np
    import pyunitwizard as puw
    from molsysmt.native import MolSys

    system = MolSys(n_atoms=2 if periodic else 3)
    system.topology.atoms["atom_type"] = ["Na", "Cl"] if periodic else ["Na", "Cl", "K"]
    msm.set(system, element="atom", formal_charge=[1, -1] if periodic else [1, -1, 1])
    coordinates = (
        [[[0.1, 0, 0], [0.9, 0, 0]]]
        if periodic
        else [
            [[0, 0, 0], [0.3, 0, 0], [0.6, 0, 0]],
            [[0, 0, 0], [2, 0, 0], [4, 0, 0]],
            [[0, 0, 0], [0.2, 0, 0], [0.8, 0, 0]],
        ]
    )
    options = {"box": puw.quantity(np.eye(3)[None, :, :], "nm")} if periodic else {}
    system.structures.append(coordinates=puw.quantity(np.array(coordinates), "nm"), **options)
    return msm.interactions.ionic.get_ionic_interactions(
        system,
        "4 angstrom",
        structure_indices=[0] if periodic else [0, 1],
        pbc=periodic,
        assume_complete_connectivity=True,
    )


def request_for(frame=0, *, offset=0, limit=50, periodic=False):
    def reference(owner, identifier):
        return {"owner": owner, "id": identifier, "generation": "1"}

    case = "periodic-ions" if periodic else "three-ions"
    # The fixture host explicitly declares the cation/anion subsets. Their
    # identities are not inferred by the adapter from indices or source_id.
    parents = [
        {
            "molecule": reference("analytical-ion-fixture", f"{case}-{role}"),
            "chemicalState": "declared-formal-ions",
            "structure": f"frame-{frame}",
            "preparation": reference("analytical-ion-fixture", f"{case}-preparation"),
        }
        for role in ("cations", "anions")
    ]
    analysis = reference("analytical-ion-fixture", f"{case}-ionic-analysis")
    return {
        "document": {
            "schemaVersion": 1,
            "kind": "interaction-document",
            "id": case,
            "mode": "interface-centered",
            "parents": parents,
            "analyses": [{"result": analysis, "parents": parents}],
        },
        "analysis": analysis,
        "structureIndex": frame,
        "correspondence": {
            "authority": "caller-declared@1",
            "atoms": [
                {"index": i, "sourceIndex": i, "parentIndex": int(i == 1), "atomId": name}
                for i, name in enumerate(["Na", "Cl"] if periodic else ["Na", "Cl", "K"])
            ],
            "frames": [
                {
                    "parentIndex": i,
                    "index": frame,
                    "sourceIndex": frame,
                    "structure": f"frame-{frame}",
                }
                for i in range(2)
            ],
        },
        "offset": offset,
        "limit": limit,
    }


def generate():
    analysis = native_analysis()
    cases = [
        ("observed", request_for()),
        ("first-page", request_for(limit=1)),
        ("last-page", request_for(offset=1, limit=1)),
        ("evaluated-empty", request_for(1)),
        ("unevaluated", request_for(2)),
        ("zero-limit", request_for(limit=0)),
    ]
    return {
        "schemaVersion": 1,
        "scope": "Analytical ionic controls calculated by real MolSysMT; source-development inspection only",
        "cases": [
            {"id": name, "projection": project_interactions(analysis, request)}
            for name, request in cases
        ]
        + [
            {
                "id": "periodic",
                "projection": project_interactions(
                    native_analysis(periodic=True), request_for(periodic=True)
                ),
            }
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    options = parser.parse_args()
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_text(json.dumps(generate(), allow_nan=False, indent=2) + "\n")
    print("Prepared seven native MolSysMT inspection controls; producer versions retained.")


if __name__ == "__main__":
    main()
