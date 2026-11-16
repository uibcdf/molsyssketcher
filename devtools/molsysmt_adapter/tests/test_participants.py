"""Actual compound/directed/mediated participants; no detector is reimplemented."""

import copy
import json
import subprocess
from pathlib import Path

import molsysmt as msm
import numpy as np
import pytest
import pyunitwizard as puw

from devtools.molsysmt_adapter import project_interactions, verify_quantity_records
from devtools.molsysmt_adapter._private.smonitor import (
    CorrespondenceError,
    QuantityError,
    UnsupportedProfileError,
)
from devtools.molsysmt_adapter.participant_corpus import OUTPUT, native_cases

ROOT = Path(__file__).resolve().parents[3]
NAMES = [
    "rings-parallel",
    "rings-edge",
    "rings-empty",
    "hydrogen-bonds",
    "one-water",
    "two-water",
    "two-water-reverse",
    "two-water-periodic",
]


@pytest.fixture(scope="module")
def cases():
    return {name: (analysis, request) for name, analysis, request in native_cases()}


@pytest.mark.parametrize("name", NAMES)
def test_actual_native_profiles_cross_projection_with_original_method_units_and_role_membership(
    cases, name
):
    analysis, request = cases[name]
    before = copy.deepcopy(request)
    native = project_interactions(analysis, request)["native"]
    page = native["page"]
    expected = analysis.query(structure_indices=[request["structureIndex"]]).to_page()
    assert request == before
    assert page["method"] == expected["method"] == analysis.method
    assert page["parameters"] == analysis.parameters
    assert page["software"] == analysis.software
    assert page["participant_roles"] == list(expected["participant_roles"])
    assert page["participant_atoms"] == expected["participant_atoms"].tolist()
    assert page["measure_units"] == analysis.measure_units
    verify_quantity_records(page, native["quantityRecords"])


def test_compound_ring_geometry_and_evaluated_empty_have_analytical_meaning(cases):
    pages = {name: project_interactions(*cases[name])["native"]["page"] for name in NAMES[:3]}
    parallel, edge, empty = (pages[name] for name in NAMES[:3])
    assert parallel["participant_atom_offsets"] == [0, 6, 12]
    assert parallel["participant_atoms"] == list(range(12))
    assert parallel["measurements"]["distance"] == pytest.approx([0.35])
    assert parallel["measurements"]["plane_angle"] == pytest.approx([0], abs=1e-14)
    assert edge["measurements"]["distance"] == pytest.approx([0.4])
    assert edge["measurements"]["plane_angle"] == pytest.approx([np.pi / 2])
    assert parallel["relation_indices"] == edge["relation_indices"] == [0]
    assert parallel["occurrence_indices"] == [0] and edge["occurrence_indices"] == [1]
    assert empty["total_count"] == 0 and empty["evaluated_structure_indices"] == [2]


def test_two_actual_directed_contacts_keep_distinct_donors_and_shared_acceptor(cases):
    page = project_interactions(*cases["hydrogen-bonds"])["native"]["page"]
    assert page["total_count"] == 2
    assert page["participant_roles"] == ["donor", "hydrogen", "acceptor"] * 2
    assert page["participant_atoms"][0] == 0 and page["participant_atoms"][3] == 1
    assert page["participant_atoms"][2] == page["participant_atoms"][5] == 2
    assert len(set(page["relation_indices"])) == 2
    np.testing.assert_allclose(
        page["measurements"]["donor_acceptor_distance"], np.sqrt(0.1**2 + 0.3**2)
    )
    np.testing.assert_allclose(page["measurements"]["dha_angle"], np.pi)


@pytest.mark.parametrize(
    "name,order",
    [("one-water", 1), ("two-water", 2), ("two-water-reverse", 2), ("two-water-periodic", 2)],
)
def test_native_water_paths_have_exact_order_simultaneous_directed_legs_and_retained_images(
    cases, name, order
):
    page = project_interactions(*cases[name])["native"]["page"]
    assert page["total_count"] == 1
    assert page["parameters"]["mediator_order"] == order
    assert len(page["participant_roles"]) == 3 * (order + 1)
    atoms = page["participant_atoms"]
    for water in range(1, order + 1):
        assert atoms.count(water) == 2
    for leg in range(1, order + 2):
        assert page["measurements"][f"leg_{leg}_donor_acceptor_distance"] == pytest.approx([0.3])
        assert page["measurements"][f"leg_{leg}_hydrogen_acceptor_distance"] == pytest.approx([0.2])
        assert page["measurements"][f"leg_{leg}_dha_angle"] == pytest.approx([np.pi])
    if name.endswith("periodic"):
        assert page["image_offsets"] == [0, 9]
        assert len(page["image_vectors"]) == 9
        for water in (1, 2):
            matches = [page["image_vectors"][i] for i, atom in enumerate(atoms) if atom == water]
            assert matches[0] == matches[1]
    if name == "two-water-reverse":
        assert atoms[3] == 2 and atoms[5] == 1


def test_new_profiles_use_public_sealed_quantity_contract_and_nondefault_host_units(cases):
    with puw.context(standard_units=["angstrom", "degrees", "ps", "e"]):
        before = puw.configure.report()
        for analysis, request in cases.values():
            native = project_interactions(analysis, request)["native"]
            verify_quantity_records(native["page"], native["quantityRecords"])
            for name, record in native["quantityRecords"].items():
                assert record["manifest"]["unit"] == ("radian" if "angle" in name else "nanometer")
        after = puw.configure.report()
        assert before["standard_units"] == after["standard_units"]
        assert before["provenance"] == after["provenance"]


def test_unknown_definitions_orders_leg_profiles_missing_constituents_and_wrong_units_refuse(cases):
    analysis, request = cases["two-water"]
    for patch in (
        {"method_definition": "unreceived@1"},
        {"mediator_order": 3},
        {"hbond_parameters": {}},
    ):
        other = copy.deepcopy(analysis)
        other.parameters.update(patch)
        with pytest.raises(UnsupportedProfileError):
            project_interactions(other, request)
    ring, request = cases["rings-parallel"]
    partial = copy.deepcopy(request)
    partial["correspondence"]["atoms"].pop()
    with pytest.raises(CorrespondenceError):
        project_interactions(ring, partial)
    native = project_interactions(ring, request)["native"]
    native["page"]["measure_units"]["plane_angle"] = "ps"
    with pytest.raises(QuantityError):
        verify_quantity_records(native["page"], native["quantityRecords"])


def test_native_page_route_remains_bounded_and_preserves_historical_producer(cases, monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Consumer materialized unbounded occurrence dictionaries")

    monkeypatch.setattr(msm.Interactions, "to_dict", forbidden)
    analysis, request = cases["hydrogen-bonds"]
    historical = copy.deepcopy(analysis)
    historical.software = {"molsysmt": "declared-historical-producer"}
    result = project_interactions(historical, {**request, "offset": 1, "limit": 1})
    assert result["native"]["page"]["occurrence_indices"] == [1]
    assert result["native"]["page"]["software"] == historical.software
    assert result["reader"]["version"] == msm.__version__


def test_fresh_and_recorded_native_participant_pages_cross_public_topology_and_quantity_boundary(
    cases, tmp_path
):
    recorded = json.loads(OUTPUT.read_text())
    fresh = {
        "cases": [
            {"id": name, "projection": project_interactions(analysis, request)}
            for name, (analysis, request) in cases.items()
        ]
    }
    for corpus in (recorded, fresh):
        for case in corpus["cases"]:
            native = case["projection"]["native"]
            verify_quantity_records(native["page"], native["quantityRecords"])
        path = tmp_path / "native-participants.json"
        path.write_text(json.dumps(corpus, allow_nan=False))
        subprocess.run(
            [
                "node",
                "--input-type=module",
                "-e",
                "import fs from 'node:fs'; import {buildInteractionTopology,inspectInteractionTopology} from './dist/index.js'; for(const c of JSON.parse(fs.readFileSync(process.argv[1])).cases) { const t=buildInteractionTopology(c.projection,{instanceId:'native',generation:1}); for(const o of t.observations) if(inspectInteractionTopology(t,o.id).memberships.length!==o.participants.length) process.exit(1); }",
                str(path),
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
        )
