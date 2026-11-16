"""Receive composed fragment DOM geometry through the existing native RDKit oracle."""

import json
import sys
from pathlib import Path

from devtools.check_svg_chemistry import reconstruct


def verify(path):
    drawings = json.loads(Path(path).read_text())
    assert len(drawings) == 26, "Receive all nine diagram controls and their 26 parent fragments"
    results = {}
    for item in drawings:
        received = reconstruct(item)
        assert received == item["referenceSmiles"], (item["id"], received, item["referenceSmiles"])
        results[item["id"]] = received
    print(
        json.dumps(
            {
                "scope": "Composed DOM fragment bonds/coordinates received by native RDKit; no interaction detector revalidation",
                "receivedFragments": len(results),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    verify(sys.argv[1])
