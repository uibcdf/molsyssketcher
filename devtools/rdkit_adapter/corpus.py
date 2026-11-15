"""Reproducible, synthetic SMILES controls and attributed native references."""

import argparse
import hashlib
import json
from pathlib import Path

from . import prepare_smiles

ROOT = Path(__file__).resolve().parents[2]
INPUTS = ROOT / "tests/data/rdkit-corpus.json"
OUTPUT = ROOT / "tests/data/rdkit-prepared.json"


def request_for(case):
    source = {"owner": "molsyssketcher-synthetic-corpus", "id": case["id"], "generation": "1"}
    return {
        "smiles": case["smiles"],
        "documentId": case["id"],
        "source": source,
        "context": {
            "molecule": dict(source),
            "chemicalState": "declared-smiles",
            "structure": "no-physical-structure",
            "preparation": {
                "owner": "molsyssketcher-rdkit-corpus",
                "id": case["id"],
                "generation": "1",
            },
        },
    }


def generate():
    inputs = INPUTS.read_bytes()
    cases = [{"id": case["id"], **prepare_smiles(request_for(case))} for case in json.loads(inputs)]
    return {
        "schemaVersion": 1,
        "scope": "Synthetic SMILES controls prepared by real RDKit; no renderer/host qualification",
        "inputSha256": hashlib.sha256(inputs).hexdigest(),
        "cases": cases,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    options = parser.parse_args()
    serialized = json.dumps(generate(), ensure_ascii=False, allow_nan=False, indent=2) + "\n"
    if options.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != serialized:
            raise SystemExit(
                "The prepared corpus differs from the selected RDKit output; review before regenerating."
            )
        print("RDKit corpus matches all 12 recorded native preparations.")
    else:
        OUTPUT.write_text(serialized, encoding="utf-8")
        print("Prepared 12 RDKit controls and native reference figures.")


if __name__ == "__main__":
    main()
