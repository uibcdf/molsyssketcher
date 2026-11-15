"""Prepare bounded JSON files explicitly; stdout contains no molecular input."""

import argparse
import json
import sys
from pathlib import Path

from . import prepare_smiles
from ._private.smonitor import AdapterError, ArgumentError


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request", type=Path)
    parser.add_argument("output", type=Path)
    options = parser.parse_args()
    try:
        with options.request.open("rb") as stream:
            raw = stream.read(1_000_001)
        if len(raw) > 1_000_000:
            raise ArgumentError(reason="request-file byte limit exceeded")
        result = prepare_smiles(json.loads(raw))
    except (AdapterError, json.JSONDecodeError) as error:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "code": getattr(error, "code", "MSS-RDKIT-ARGUMENT"),
                    "message": str(error)
                    if isinstance(error, AdapterError)
                    else "Malformed request JSON.",
                }
            ),
            file=sys.stderr,
        )
        return 2
    # Exclusive creation preserves an existing artifact on failed/repeated work.
    with options.output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, ensure_ascii=False, allow_nan=False, indent=2)
        stream.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
