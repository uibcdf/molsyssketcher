"""Actual source-native observations joined to verified source-atom depictions."""

import copy
import json
import subprocess
from pathlib import Path

import pytest
import pyunitwizard as puw
from rdkit import Chem

from devtools.molsysmt_adapter import project_interactions, verify_quantity_records
from devtools.molsysmt_adapter.diagram_corpus import OUTPUT, generate
from devtools.molsysmt_adapter.participant_corpus import hydrogen_bonds

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(scope="module")
def corpus():
    return generate()


def test_actual_fragment_atom_map_labels_and_native_bindings_are_bijective(corpus):
    assert len(corpus["cases"]) == 9
    assert sum(len(c["input"]["parents"]) for c in corpus["cases"]) == 26
    for case in corpus["cases"]:
        diagram = case["input"]
        for parent, reference in zip(diagram["parents"], case["references"]):
            molecule = parent["molecule"]
            parser = Chem.SmilesParserParams()
            parser.removeHs = False
            parsed = Chem.MolFromSmiles(molecule["original"]["data"], parser)
            mapping = {a.GetIdx(): a.GetAtomMapNum() - 1 for a in parsed.GetAtoms()}
            bindings = [
                b
                for b in diagram["page"]["correspondence"]["atoms"]
                if b["parentIndex"] == parent["parentIndex"]
            ]
            assert len(bindings) == len(molecule["atoms"])
            for atom in molecule["atoms"]:
                binding = next(b for b in bindings if b["atomId"] == atom["id"])
                assert binding["index"] == mapping[atom["providerIndex"]] == binding["sourceIndex"]
            assert set(mapping.values()) == set(reference["sourceAtoms"])
            assert (
                molecule["context"] == diagram["page"]["document"]["parents"][parent["parentIndex"]]
            )


def test_actual_chemistry_survives_fragment_parser_and_original_layout_preparation(corpus):
    for case in corpus["cases"]:
        for parent, reference in zip(case["input"]["parents"], case["references"]):
            molecule = Chem.MolFromMolBlock(reference["molBlock"], removeHs=False)
            assert molecule is not None
            assert molecule.GetNumAtoms() == len(parent["molecule"]["atoms"])
            for atom in molecule.GetAtoms():
                atom.SetAtomMapNum(0)
            assert Chem.MolToSmiles(molecule, isomericSmiles=True) == reference["referenceSmiles"]


def test_fresh_and_recorded_diagrams_cross_built_atomic_contract_and_scene(corpus, tmp_path):
    for data in (corpus, json.loads(OUTPUT.read_text())):
        for case in data["cases"]:
            native = case["input"]["page"]["native"]
            verify_quantity_records(native["page"], native["quantityRecords"])
        path = tmp_path / "diagrams.json"
        path.write_text(json.dumps(data, allow_nan=False))
        subprocess.run(
            [
                "node",
                "--input-type=module",
                "-e",
                "import fs from 'node:fs'; import {prepareInteractionDiagram,buildInteractionDiagramScene} from './dist/index.js'; const measure=(t,s)=>({x:0,y:-s,width:t.length*s*.55,height:s}); for(const c of JSON.parse(fs.readFileSync(process.argv[1])).cases) buildInteractionDiagramScene(prepareInteractionDiagram(c.input),measure,{instanceId:'fresh',generation:1});",
                str(path),
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
        )


def test_nondefault_policy_survives_full_native_to_depiction_composition():
    with puw.context(standard_units=["angstrom", "degrees", "ps", "e"]):
        before = puw.configure.report()
        data = generate()
        for case in data["cases"]:
            native = case["input"]["page"]["native"]
            verify_quantity_records(native["page"], native["quantityRecords"])
            assert all(
                p["molecule"]["provider"]["options"]["drawingCoordinates"] == "nonphysical"
                for p in case["input"]["parents"]
            )
        after = puw.configure.report()
        assert (
            before["standard_units"] == after["standard_units"]
            and before["provenance"] == after["provenance"]
        )


def test_actual_last_native_page_stays_partial_in_the_public_diagram_scene(corpus, tmp_path):
    diagram = copy.deepcopy(
        next(c["input"] for c in corpus["cases"] if c["id"] == "hydrogen-bonds-interface-centered")
    )
    analysis, _ = hydrogen_bonds()
    page = diagram["page"]
    diagram["page"] = project_interactions(
        analysis,
        {
            "document": page["document"],
            "analysis": page["analysis"],
            "correspondence": page["correspondence"],
            "structureIndex": 0,
            "offset": 1,
            "limit": 1,
        },
    )
    assert diagram["page"]["native"]["page"]["occurrence_indices"] == [1]
    path = tmp_path / "partial.json"
    path.write_text(json.dumps(diagram, allow_nan=False))
    subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            "import fs from 'node:fs'; import {buildInteractionDiagramScene} from './dist/index.js'; const s=buildInteractionDiagramScene(JSON.parse(fs.readFileSync(process.argv[1])),(t,n)=>({x:0,y:-n,width:t.length*n*.55,height:n}),{instanceId:'partial',generation:1}); if(!s.topology.partial || s.observations.length!==1 || s.observations[0].occurrenceIndex!==1 || !s.header[0].text.includes('partial page')) process.exit(1);",
            str(path),
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
