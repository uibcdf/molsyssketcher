"""Actual RDKit execution and the bounded Python-to-TypeScript preparation route."""

import copy
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest
from rdkit import Chem
from rdkit.Chem import rdDepictor
from rdkit.Chem.Draw import rdMolDraw2D

from devtools.rdkit_adapter import prepare_smiles
from devtools.rdkit_adapter._private.smonitor import (
    ArgumentError,
    MalformedInputError,
    MissingEngineError,
    PreparationError,
    UnsupportedFeatureError,
)
from devtools.rdkit_adapter.corpus import INPUTS, request_for
from devtools.rdkit_adapter.preparation import ATOM_ORIGIN, BOND_ORIGIN, _mapped_objects

ROOT = Path(__file__).resolve().parents[2]
CASES = json.loads(INPUTS.read_text())


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["id"])
def test_native_preparation_retains_input_maps_and_admitted_mol_round_trip(case):
    request = request_for(case)
    original = copy.deepcopy(request)
    result = prepare_smiles(request)
    document, reference = result["document"], result["reference"]
    assert request == original
    assert document["original"]["data"] == case["smiles"]
    assert document["context"] == request["context"]
    assert len(document["atoms"]) == case["atoms"]
    assert len(document["bonds"]) == case["bonds"]
    assert len({atom["providerIndex"] for atom in document["atoms"]}) == case["atoms"]
    assert {atom["atomId"] for atom in document["depiction"]["atoms"]} == {
        atom["id"] for atom in document["atoms"]
    }
    restored = Chem.MolFromMolBlock(reference["molBlock"], sanitize=True, removeHs=False)
    assert restored is not None and restored.GetNumAtoms() == case["atoms"]
    assert Chem.MolToSmiles(restored, isomericSmiles=True) == reference["isomericSmiles"]
    assert ET.fromstring(reference["svg"]).tag.endswith("svg")
    assert document["provider"]["options"]["drawingCoordinates"] == "nonphysical"


def test_native_charges_isotopes_explicit_hydrogens_and_stereo_are_distinct():
    prepared = {case["id"]: prepare_smiles(request_for(case)) for case in CASES}

    def atoms(name):
        return prepared[name]["document"]["atoms"]

    assert sorted(atom["formalCharge"] for atom in atoms("salt")) == [-1, 1]
    assert atoms("isotope")[0]["isotope"] == 13
    assert atoms("isotope")[0]["hydrogenCount"] == 3
    assert sum(atom["element"] == "H" for atom in atoms("explicit-hydrogen")) == 1
    assert (
        prepared["tetra-a"]["reference"]["isomericSmiles"]
        != prepared["tetra-b"]["reference"]["isomericSmiles"]
    )
    assert (
        prepared["alkene-a"]["reference"]["isomericSmiles"]
        != prepared["alkene-b"]["reference"]["isomericSmiles"]
    )
    for name in ("tetra-a", "tetra-b"):
        wedges = [
            bond
            for bond in prepared[name]["document"]["depiction"]["bonds"]
            if bond["style"].endswith("wedge")
        ]
        assert wedges and all(bond["from"] in bond["atoms"] for bond in wedges)


def test_actual_origin_maps_survive_provider_atom_reordering_and_reject_generated_atoms():
    original = Chem.MolFromSmiles("CCO")
    for atom in original.GetAtoms():
        atom.SetIntProp(ATOM_ORIGIN, atom.GetIdx())
    for bond in original.GetBonds():
        bond.SetIntProp(BOND_ORIGIN, bond.GetIdx())
    reordered = Chem.RenumberAtoms(original, [2, 0, 1])
    atom_map, _ = _mapped_objects(original, reordered)
    assert atom_map == {2: 0, 0: 1, 1: 2}
    with pytest.raises(UnsupportedFeatureError, match="generated"):
        _mapped_objects(original, Chem.AddHs(original))


@pytest.mark.parametrize(
    "smiles", ["*CC", "[CH3]", "CC(O)F", "CC=CC", "[NH3]->[Cu+2]", "F[Pt@SP1](Cl)(Br)I"]
)
def test_unsupported_chemistry_is_not_simplified(smiles):
    with pytest.raises(UnsupportedFeatureError) as captured:
        prepare_smiles(request_for({"id": "unsupported", "smiles": smiles}))
    assert captured.value.code == "MSS-RDKIT-UNSUPPORTED"


def test_argument_contract_runs_before_engine_availability(monkeypatch):
    import devtools.rdkit_adapter.preparation as module

    def unexpected(*args, **kwargs):
        pytest.fail("Invalid request reached the engine boundary")

    monkeypatch.setattr(module, "check_dependency", unexpected)
    for value in ({}, {"smiles": "CO"}, request_for({"id": "bad", "smiles": "C" * 4097})):
        with pytest.raises(ArgumentError):
            prepare_smiles(value)
    with pytest.raises(TypeError):
        prepare_smiles(request_for(CASES[0]), undeclared=True)


def test_malformed_input_has_a_safe_catalog_diagnostic_and_no_native_input_log(capfd):
    private_control = "C1PRIVATE_INVALID_TOKEN"
    with pytest.raises(MalformedInputError) as captured:
        prepare_smiles(request_for({"id": "bad", "smiles": private_control}))
    assert captured.value.code == "MSS-RDKIT-MALFORMED"
    assert private_control not in str(captured.value)
    assert private_control not in capfd.readouterr().err


def test_missing_engine_is_distinct_from_a_broken_transitive_import(monkeypatch):
    import builtins

    import depdigest.core.checker as checker

    original_availability = checker.is_installed
    monkeypatch.setattr(checker, "is_installed", lambda name: False)
    with pytest.raises(MissingEngineError) as captured:
        prepare_smiles(request_for(CASES[0]))
    assert captured.value.code == "MSS-RDKIT-MISSING"
    monkeypatch.setattr(checker, "is_installed", original_availability)
    original_import = builtins.__import__

    def broken(name, *args, **kwargs):
        if name == "rdkit":
            raise ImportError("transitive provider failure")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", broken)
    with pytest.raises(ImportError, match="transitive provider failure"):
        prepare_smiles(request_for(CASES[0]))


def test_provider_execution_failure_retains_its_cause_without_fallback(monkeypatch):
    def failure(*args, **kwargs):
        raise RuntimeError("controlled provider failure")

    monkeypatch.setattr(rdDepictor, "Compute2DCoords", failure)
    with pytest.raises(PreparationError) as captured:
        prepare_smiles(request_for(CASES[0]))
    assert captured.value.code == "MSS-RDKIT-EXECUTION"
    assert isinstance(captured.value.__cause__, RuntimeError)


def test_invalid_bond_origin_mapping_cannot_be_published(monkeypatch):
    original = rdMolDraw2D.PrepareMolForDrawing

    def wrong(*args, **kwargs):
        result = original(*args, **kwargs)
        result.GetBondWithIdx(0).SetIntProp(BOND_ORIGIN, 1)
        result.GetBondWithIdx(1).SetIntProp(BOND_ORIGIN, 0)
        return result

    monkeypatch.setattr(rdMolDraw2D, "PrepareMolForDrawing", wrong)
    with pytest.raises(PreparationError) as captured:
        prepare_smiles(request_for({"id": "bond-control", "smiles": "CCO"}))
    assert captured.value.code == "MSS-RDKIT-EXECUTION"
    assert captured.value.extra["stage"] == "bond endpoint correspondence"


def test_cli_preserves_existing_output_on_failure_and_native_json_is_received_by_node(tmp_path):
    request, output = tmp_path / "request.json", tmp_path / "prepared.json"
    request.write_text(json.dumps(request_for(CASES[4])))
    subprocess.run(
        [sys.executable, "-m", "devtools.rdkit_adapter", str(request), str(output)],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    received = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            "import fs from 'node:fs'; import {prepareSuppliedMolecule} from './dist/index.js'; const x=JSON.parse(fs.readFileSync(process.argv[1])); const d=prepareSuppliedMolecule(x.document); if(d.atoms.length!==3 || d.original.data!=='[H]OC') process.exit(1);",
            str(output),
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    assert received.returncode == 0
    original = output.read_bytes()
    request.write_text(json.dumps(request_for({"id": "bad", "smiles": "C1CCC"})))
    failed = subprocess.run(
        [sys.executable, "-m", "devtools.rdkit_adapter", str(request), str(output)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert failed.returncode == 2
    assert output.read_bytes() == original
    assert json.loads(failed.stderr.splitlines()[-1])["code"] == "MSS-RDKIT-MALFORMED"


def test_import_is_lazy_and_preserves_application_diagnostics_and_unit_policy():
    script = """
import sys, smonitor, pyunitwizard as puw
smonitor.configure(profile='agent', handlers=[], level='ERROR', codes={'HOST-PROFILE': {'user_message': 'host-user', 'agent_message': 'host-agent'}})
before_message = smonitor.resolve(code='HOST-PROFILE')[0]
assert before_message == 'host-agent'
puw.configure.set_standard_units(['angstrom', 'degree'], provenance='host-control')
before = puw.configure.report()
from devtools.rdkit_adapter import prepare_smiles
assert 'rdkit' not in sys.modules
from devtools.rdkit_adapter.corpus import request_for
prepare_smiles(request_for({'id': 'control', 'smiles': 'CO'}))
after = puw.configure.report()
assert before['standard_units'] == after['standard_units']
assert before['provenance'] == after['provenance']
assert smonitor.resolve(code='HOST-PROFILE')[0] == before_message
"""
    subprocess.run([sys.executable, "-c", script], cwd=ROOT, check=True, capture_output=True)
