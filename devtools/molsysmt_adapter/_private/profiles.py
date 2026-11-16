"""Received method/definition and physical field contracts, not detection rules."""

from .smonitor import UnsupportedProfileError

HBOND_UNITS = {
    "donor_hydrogen_distance": "nm",
    "donor_acceptor_distance": "nm",
    "hydrogen_acceptor_distance": "nm",
    "dha_angle": "radians",
    "hda_angle": "radians",
}
PROFILES = {
    "molsysmt.interactions.ionic.get_ionic_interactions": (
        "minimum_distance",
        "native",
        "molsysmt.ionic.minimum_distance.native@1",
        {"distance": "nm", "positive_charge": "e", "negative_charge": "e"},
    ),
    "molsysmt.interactions.pi_pi.get_pi_pi_interactions": (
        "centroid_angle_offset",
        "least_squares",
        "molsysmt.pi_pi.centroid_angle_offset.least_squares@1",
        {
            "distance": "nm",
            "plane_angle": "radians",
            "offset_a": "nm",
            "offset_b": "nm",
            "rms_deviation_a": "nm",
            "rms_deviation_b": "nm",
            "max_deviation_a": "nm",
            "max_deviation_b": "nm",
        },
    ),
    "molsysmt.interactions.hbonds.get_hbonds": (
        "baker_hubbard",
        "nitrogen_oxygen",
        "molsysmt.hbonds.baker_hubbard.nitrogen_oxygen@1",
        HBOND_UNITS,
    ),
}


def physical_fields(method, parameters):
    expected = PROFILES.get(method)
    if expected is None and method == "molsysmt.interactions.water_bridges.get_water_bridges":
        order = parameters.get("mediator_order")
        legs = parameters.get("hbond_parameters", {})
        if type(order) is not int or order not in (1, 2):
            raise UnsupportedProfileError(reason="exact mediator order one or two")
        if not isinstance(legs, dict) or any(
            legs.get(key) != value
            for key, value in zip(
                ("method", "profile", "method_definition"),
                PROFILES["molsysmt.interactions.hbonds.get_hbonds"][:3],
            )
        ):
            raise UnsupportedProfileError(reason="the received Baker-Hubbard water-leg definition")
        expected = (
            "hbond_water_path",
            "indexed_water",
            "molsysmt.water_bridges.hbond_water_path.indexed_water@1",
            {
                f"leg_{leg}_{field}": unit
                for leg in range(1, order + 2)
                for field, unit in HBOND_UNITS.items()
            },
        )
    if expected is None or any(
        parameters.get(key) != value
        for key, value in zip(("method", "profile", "method_definition"), expected[:3])
    ):
        raise UnsupportedProfileError(
            reason="the received native method/profile/definition inventory"
        )
    return expected[3]
