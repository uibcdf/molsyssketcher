"""Record actual runtime and binary identity without restamping a provider."""

import argparse
import hashlib
import importlib
import importlib.metadata
import json
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--installed-support", action="store_true")
    options = parser.parse_args()
    source, destination = options.source.resolve(), options.destination.resolve()
    import molsysmt as msm
    import molsysmt._rust as native

    assert Path(msm.__file__).resolve().is_relative_to(source)
    dependencies = {}
    for name, distribution in [
        ("argdigest", "argdigest"),
        ("depdigest", "depdigest"),
        ("smonitor", "smonitor"),
        ("pyunitwizard", "pyunitwizard"),
        ("pytest_receptor", "pytest-receptor"),
        ("rdkit", "rdkit"),
    ]:
        module = importlib.import_module(name)
        if options.installed_support:
            assert Path(module.__file__).resolve().is_relative_to(Path(sys.prefix).resolve()), name
        dependencies[distribution] = {
            "version": importlib.metadata.version(distribution),
            "origin": str(Path(module.__file__).resolve()),
        }
    binary = Path(native.__file__).resolve()
    record = {
        "sourceHead": subprocess.check_output(
            ["git", "-C", str(source), "rev-parse", "HEAD"], text=True
        ).strip(),
        "sourceStatus": subprocess.check_output(
            ["git", "-C", str(source), "status", "--porcelain"], text=True
        ),
        "runtimeVersion": msm.__version__,
        "metadataVersion": importlib.metadata.version("molsysmt"),
        "moduleOrigin": str(Path(msm.__file__).resolve()),
        "nativeBinary": str(binary),
        "nativeBinarySha256": hashlib.sha256(binary.read_bytes()).hexdigest(),
        "python": sys.version,
        "support": dependencies,
        "scope": "Separate source/runtime/binary observations; source HEAD alone does not authenticate a pre-existing native build",
    }
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(record, indent=2) + "\n")
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
