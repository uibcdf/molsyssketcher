"""Receive an existing native result; never classify or calculate an interaction."""

import json

from argdigest import arg_digest
from depdigest import check_dependency
from smonitor import METADATA_ONLY, signal

from ._private import arguments  # noqa: F401  # registers bounded request digestion
from ._private.smonitor import (
    CorrespondenceError,
    MissingProviderError,
    ProviderError,
    QuantityError,
    UnsupportedProfileError,
)

METHOD = "molsysmt.interactions.ionic.get_ionic_interactions"
UNITS = {"distance": "nm", "positive_charge": "e", "negative_charge": "e"}


def _json(value, np):
    if isinstance(value, np.ndarray):
        return _json(value.tolist(), np)
    if isinstance(value, np.generic):
        return _json(value.item(), np)
    if type(value) is dict:
        return {key: _json(item, np) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json(item, np) for item in value]
    if value is None or type(value) in (str, bool, int, float):
        if type(value) is int and abs(value) > 9007199254740991:
            raise UnsupportedProfileError(reason="integers outside exact JavaScript range")
        return value
    raise UnsupportedProfileError(reason="non-JSON native metadata")


@signal(tags=["molsyssketcher", "molsysmt", "quantities"], capture_policy=METADATA_ONLY)
@arg_digest(config="devtools.molsysmt_adapter._argdigest", capture_policy=METADATA_ONLY)
def verify_quantity_records(page, records):
    """Read sealed records with explicit receiver field/unit contracts, preserving native units."""
    import numpy as np
    import pyunitwizard as puw

    try:
        if (
            set(page["measurements"]) != set(UNITS)
            or set(page["measure_units"]) != set(UNITS)
            or set(records) != set(UNITS)
        ):
            raise ValueError("physical column contract")
        for name, unit in UNITS.items():
            record = puw.QuantityRecord.from_dict(records[name])
            verified = record.to_quantity(field=name, unit=unit, form="pint")
            native = puw.quantity(
                page["measurements"][name], page["measure_units"][name], form="pint"
            )
            expected = np.asarray(puw.get_value(native, to_unit=unit))
            observed = np.asarray(puw.get_value(verified, to_unit=unit))
            if (
                expected.shape != observed.shape
                or not np.array_equal(expected, observed)
                or not np.all(np.isfinite(observed))
            ):
                raise ValueError("physical column correspondence")
    except Exception as error:
        raise QuantityError() from error


@signal(tags=["molsyssketcher", "molsysmt", "inspection"], capture_policy=METADATA_ONLY)
@arg_digest(
    config="devtools.molsysmt_adapter._argdigest",
    capture_policy=METADATA_ONLY,
    map={"request": {"kind": "molsyssketcher_molsysmt", "rules": ["request"]}},
)
def project_interactions(analysis, request):
    """Project one frame/page with caller-declared exact parent and source bindings.

    MolSysMT owns calculation/query/page semantics. The caller owns correspondence
    authority and analysis identity. Native source maps do not authenticate origin.
    Quantity seals and explicit physical-unit handshakes are received in Python;
    browser retention is opaque until a supported reader profile is received.
    """
    check_dependency(
        "molsysmt",
        caller="molsyssketcher.molsysmt.project_interactions",
        conda_name="molsysmt",
        conda_channel="uibcdf",
        exception_class=MissingProviderError,
    )
    import molsysmt as msm
    import numpy as np
    import pyunitwizard as puw

    if not isinstance(analysis, msm.Interactions) or not callable(
        getattr(analysis, "to_page", None)
    ):
        raise UnsupportedProfileError(reason="the selected native result/page API")
    if (
        not 0 < analysis.n_atoms <= 4096
        or not 0 < analysis.n_structures <= 4096
        or request["structureIndex"] >= analysis.n_structures
    ):
        raise UnsupportedProfileError(reason="native axis extent")
    if (
        analysis.method != METHOD
        or analysis.parameters.get("method") != "minimum_distance"
        or analysis.parameters.get("profile") != "native"
        or analysis.parameters.get("method_definition")
        != "molsysmt.ionic.minimum_distance.native@1"
    ):
        raise UnsupportedProfileError(reason="the first ionic minimum-distance inspection profile")
    try:
        page = analysis.query(structure_indices=[request["structureIndex"]]).to_page(
            offset=request["offset"], limit=request["limit"], max_participant_atoms=2048
        )
    except Exception as error:
        raise ProviderError() from error
    if page.get("schema") != "molsysmt.interactions.page@1":
        raise UnsupportedProfileError(reason="native page schema")
    atoms = request["correspondence"]["atoms"]
    if len({a["index"] for a in atoms}) != len(atoms) or len(
        {(a["parentIndex"], a["atomId"]) for a in atoms}
    ) != len(atoms):
        raise CorrespondenceError()
    by_index = {a["index"]: a for a in atoms}
    for atom in atoms:
        if atom["index"] >= page["n_atoms"] or atom["sourceIndex"] != int(
            page["atom_source_indices"][atom["index"]]
        ):
            raise CorrespondenceError()
    if any(int(index) not in by_index for index in page["participant_atoms"]):
        raise CorrespondenceError()
    frames = request["correspondence"]["frames"]
    if len({f["parentIndex"] for f in frames}) != len(request["document"]["parents"]):
        raise CorrespondenceError()
    if any(f["sourceIndex"] != int(page["structure_source_indices"][f["index"]]) for f in frames):
        raise CorrespondenceError()
    records = {}
    try:
        if set(page["measurements"]) != set(UNITS) or set(page["measure_units"]) != set(UNITS):
            raise ValueError("physical columns")
        for name, values in page["measurements"].items():
            records[name] = puw.QuantityRecord.from_quantity(
                puw.quantity(values, page["measure_units"][name], form="pint"), field=name
            ).to_dict()
        verify_quantity_records(page, records)
    except QuantityError:
        raise
    except Exception as error:
        raise QuantityError() from error
    result = _json(
        {
            "schemaVersion": 1,
            "kind": "interaction-page",
            "document": request["document"],
            "analysis": request["analysis"],
            "structureIndex": request["structureIndex"],
            "correspondence": request["correspondence"],
            "native": {
                "page": page,
                "evaluationScope": analysis.evaluation_scope,
                "quantityRecords": records,
            },
            "reader": {
                "name": "MolSysMT",
                "version": msm.__version__,
                "quantityVerification": "python-only",
            },
        },
        np,
    )
    encoded = json.dumps(result, allow_nan=False)
    if len(encoded) > 1_000_000:
        raise UnsupportedProfileError(reason="serialized inspection payload extent")
    return result
