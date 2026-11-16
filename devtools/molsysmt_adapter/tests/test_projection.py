"""Actual native ionic calculations and the finite page/unit/context boundary."""

import copy
import json
import subprocess
import sys
from pathlib import Path

import molsysmt as msm
import numpy as np
import pytest

from devtools.molsysmt_adapter import project_interactions, verify_quantity_records
from devtools.molsysmt_adapter._private.smonitor import (
    ArgumentError,
    CorrespondenceError,
    MissingProviderError,
    ProviderError,
    QuantityError,
    UnsupportedProfileError,
)
from devtools.molsysmt_adapter.corpus import OUTPUT, generate, native_analysis, request_for

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(scope="module")
def analysis():
    return native_analysis()


def test_actual_native_ionic_observations_preserve_roles_producer_and_method(analysis):
    request = request_for()
    before = copy.deepcopy(request)
    projected = project_interactions(analysis, request)
    page = projected["native"]["page"]
    assert request == before
    assert page["total_count"] == 2
    np.testing.assert_allclose(page["measurements"]["distance"], [0.3, 0.3], atol=1e-14)
    assert page["measure_units"] == {
        "distance": "nm",
        "positive_charge": "e",
        "negative_charge": "e",
    }
    assert page["participant_roles"] == ["positive", "negative", "positive", "negative"]
    assert page["participant_atoms"] == [0, 1, 2, 1]
    assert page["software"] == analysis.software
    assert page["parameters"] == analysis.parameters
    assert page["parameters"]["method"] == "minimum_distance"
    assert page["parameters"]["profile"] == "native"
    assert page["parameters"]["charge_evidence"]["assume_complete_connectivity"] is True
    assert projected["reader"]["version"] == msm.__version__
    assert projected["document"] == before["document"]
    verify_quantity_records(page, projected["native"]["quantityRecords"])


def test_native_evaluated_empty_is_distinct_from_unevaluated(analysis):
    empty = project_interactions(analysis, request_for(1))["native"]["page"]
    missing = project_interactions(analysis, request_for(2))["native"]["page"]
    assert empty["evaluated_structure_indices"] == [1]
    assert missing["evaluated_structure_indices"] == []
    assert empty["total_count"] == missing["total_count"] == 0
    assert empty["occurrence_indices"] == missing["occurrence_indices"] == []


def test_native_paging_keeps_analysis_local_handles_and_last_page_scope(analysis):
    first = project_interactions(analysis, request_for(limit=1))["native"]["page"]
    last = project_interactions(analysis, request_for(offset=1, limit=1))["native"]["page"]
    zero = project_interactions(analysis, request_for(limit=0))["native"]["page"]
    assert first["occurrence_indices"] == first["relation_catalog_indices"] == [0]
    assert last["occurrence_indices"] == last["relation_catalog_indices"] == [1]
    assert first["next_offset"] == 1 and last["next_offset"] is None
    assert first["total_count"] == last["total_count"] == zero["total_count"] == 2
    assert zero["occurrence_indices"] == []


def test_actual_periodic_native_images_and_distance():
    projected = project_interactions(native_analysis(periodic=True), request_for(periodic=True))
    page = projected["native"]["page"]
    np.testing.assert_allclose(page["measurements"]["distance"], [0.2], atol=1e-14)
    assert page["image_vectors"] == [[0, 0, 0], [-1, 0, 0]]
    assert page["image_offsets"] == [0, 2]
    assert page["parameters"]["pbc"] is True


@pytest.mark.parametrize(
    "mutation", ["missing-atom", "wrong-source", "duplicate", "wrong-frame", "old-analysis"]
)
def test_correspondence_refuses_missing_ambiguous_and_inconsistent_context(analysis, mutation):
    request = request_for()
    expected = CorrespondenceError
    if mutation == "missing-atom":
        request["correspondence"]["atoms"].pop()
    elif mutation == "wrong-source":
        request["correspondence"]["atoms"][0]["sourceIndex"] = 99
    elif mutation == "duplicate":
        request["correspondence"]["atoms"][2]["atomId"] = "Na"
    elif mutation == "wrong-frame":
        request["correspondence"]["frames"][0]["sourceIndex"] = 99
    else:
        # Detach the shared fixture object before changing the native result key.
        request["analysis"] = {**request["analysis"], "generation": "old"}
        expected = ArgumentError
    with pytest.raises(expected):
        project_interactions(analysis, request)


def test_argument_digestion_precedes_dependency_loading(monkeypatch):
    import devtools.molsysmt_adapter.projection as module

    def unexpected(*args, **kwargs):
        pytest.fail("Malformed request reached provider availability")

    monkeypatch.setattr(module, "check_dependency", unexpected)
    for patch in ({"limit": 257}, {"offset": -1}, {"structureIndex": True}, {"undeclared": True}):
        with pytest.raises(ArgumentError):
            project_interactions(None, {**request_for(), **patch})


def test_explicit_provider_absence_is_distinct_from_unsupported_and_execution_failure(
    analysis, monkeypatch
):
    import devtools.molsysmt_adapter.projection as module

    with pytest.raises(UnsupportedProfileError):
        project_interactions(object(), request_for())
    other = copy.deepcopy(analysis)
    other.parameters["profile"] = "unreceived-profile"
    with pytest.raises(UnsupportedProfileError):
        project_interactions(other, request_for())

    def broken(*args, **kwargs):
        raise RuntimeError("private-native-detail")

    monkeypatch.setattr(msm.Interactions, "query", broken)
    with pytest.raises(ProviderError) as captured:
        project_interactions(analysis, request_for())
    assert isinstance(captured.value.__cause__, RuntimeError)
    assert "private-native-detail" not in str(captured.value)

    def unavailable(*args, **kwargs):
        raise kwargs["exception_class"]()

    monkeypatch.setattr(module, "check_dependency", unavailable)
    with pytest.raises(MissingProviderError) as captured:
        project_interactions(analysis, request_for())
    assert captured.value.code == "MSS-MSM-MISSING"


@pytest.mark.parametrize("mutation", ["values", "field", "unit", "missing-column"])
def test_python_reader_refuses_tampered_or_wrong_physical_records(analysis, mutation):
    native = project_interactions(analysis, request_for())["native"]
    records = native["quantityRecords"]
    if mutation == "values":
        records["distance"]["values"][0] = 0.4
    elif mutation == "field":
        records["distance"]["manifest"]["field"] = "energy"
    elif mutation == "unit":
        native["page"]["measure_units"]["distance"] = "ps"
    else:
        del records["distance"]
    with pytest.raises(QuantityError):
        verify_quantity_records(native["page"], records)


def test_query_page_route_never_materializes_full_occurrence_dictionaries(analysis, monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("The adapter used unbounded native serialization")

    monkeypatch.setattr(msm.Interactions, "to_dict", forbidden)
    assert (
        project_interactions(analysis, request_for(limit=1))["native"]["page"]["total_count"] == 2
    )


def test_recorded_native_fixture_and_fresh_calculation_both_cross_the_built_public_boundary(
    tmp_path,
):
    recorded = json.loads(OUTPUT.read_text())
    fresh = generate()
    assert [c["id"] for c in fresh["cases"]] == [c["id"] for c in recorded["cases"]]
    for corpus in (recorded, fresh):
        for case in corpus["cases"]:
            native = case["projection"]["native"]
            verify_quantity_records(native["page"], native["quantityRecords"])
        payload = tmp_path / "native.json"
        payload.write_text(json.dumps(corpus, allow_nan=False))
        subprocess.run(
            [
                "node",
                "--input-type=module",
                "-e",
                "import fs from 'node:fs'; import {inspectInteractionPage} from './dist/index.js'; const x=JSON.parse(fs.readFileSync(process.argv[1])); for(const c of x.cases) inspectInteractionPage(c.projection);",
                str(payload),
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
        )


def test_lazy_import_and_nondefault_host_policies_survive_actual_calculation_and_unit_handshakes():
    script = """
import sys, smonitor, pyunitwizard as puw
smonitor.configure(profile='agent', handlers=[], level='ERROR', codes={'HOST-PROFILE': {'user_message':'host-user', 'agent_message':'host-agent'}})
message = smonitor.resolve(code='HOST-PROFILE')[0]
puw.configure.set_standard_units(['angstrom','ps','K','mole','dalton','e','kilojoule/mole','radian'], provenance='host-native-page-control')
before = puw.configure.report()
from devtools.molsysmt_adapter import project_interactions
assert 'molsysmt' not in sys.modules
from devtools.molsysmt_adapter.corpus import native_analysis, request_for
x = project_interactions(native_analysis(), request_for())
assert x['native']['page']['measure_units']['distance'] == 'nm'
assert x['native']['quantityRecords']['distance']['manifest']['unit'] == 'nanometer'
after = puw.configure.report()
assert before['standard_units'] == after['standard_units']
assert before['provenance'] == after['provenance']
assert smonitor.resolve(code='HOST-PROFILE')[0] == message == 'host-agent'
"""
    subprocess.run([sys.executable, "-c", script], cwd=ROOT, check=True, capture_output=True)
