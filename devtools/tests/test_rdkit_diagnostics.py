"""Required source-adapter SMonitor declaration, rendering and rebuild controls."""

import ast
import pickle
import subprocess
import sys
from pathlib import Path

import pytest

from devtools.rdkit_adapter._private.smonitor import (
    ArgumentError,
    MalformedInputError,
    MissingEngineError,
    PreparationError,
    UnsupportedFeatureError,
)
from devtools.rdkit_adapter._private.smonitor.catalog import CATALOG, CODES, PACKAGE_ROOT

ROOT = Path(__file__).resolve().parents[2]


def test_configuration_is_valid_and_all_catalog_codes_have_templates():
    subprocess.run(
        [
            sys.executable,
            "-c",
            "from smonitor.cli import main; raise SystemExit(main())",
            "--validate-config",
            "--config-path",
            str(PACKAGE_ROOT),
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    codes = {item["code"] for item in CATALOG.values()}
    assert codes and codes == set(CODES)


@pytest.mark.parametrize("profile", ["user", "dev", "qa", "agent", "debug"])
def test_every_catalog_code_renders_under_each_application_profile(profile):
    script = """
import sys, smonitor
from devtools.rdkit_adapter._private.smonitor.catalog import CODES
smonitor.configure(profile=sys.argv[1], handlers=[], codes=CODES)
for code in CODES:
    text, _ = smonitor.resolve(code=code, extra={'reason': 'control', 'stage': 'control'})
    assert text.strip(), code
"""
    subprocess.run(
        [sys.executable, "-c", script, profile], cwd=ROOT, check=True, capture_output=True
    )


@pytest.mark.parametrize(
    "error_type",
    [
        ArgumentError,
        MalformedInputError,
        UnsupportedFeatureError,
        PreparationError,
        MissingEngineError,
    ],
)
def test_catalog_exception_messages_survive_args_only_and_pickle_rebuild(error_type):
    original = error_type(reason="control", stage="control")
    assert error_type(*original.args).args == original.args
    assert str(pickle.loads(pickle.dumps(original))) == str(original)


def test_catalog_subclasses_do_not_assign_names_owned_by_smonitor():
    tree = ast.parse((PACKAGE_ROOT / "_private/smonitor/__init__.py").read_text())
    reserved = {"code", "message", "raw_message", "extra", "hint"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                assert not (
                    isinstance(target, ast.Attribute)
                    and isinstance(target.value, ast.Name)
                    and target.value.id == "self"
                    and target.attr in reserved
                )


def test_same_process_support_bundle_contains_triage(tmp_path):
    script = """
import json, sys, smonitor
from devtools.rdkit_adapter import prepare_smiles
try: prepare_smiles({})
except Exception: pass
path = smonitor.export_bundle(sys.argv[1], drop_extra=True, drop_context=True)
assert path.exists()
"""
    destination = tmp_path / "diagnostics"
    subprocess.run(
        [sys.executable, "-c", script, str(destination)], cwd=ROOT, check=True, capture_output=True
    )
    files = list(tmp_path.rglob("*.json"))
    assert files, "No support bundle JSON was written"
    import json

    assert any("triage" in json.loads(path.read_text()) for path in files)
