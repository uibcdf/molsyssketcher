from copy import deepcopy

from argdigest import register_pipeline

from .smonitor import ArgumentError


def identifier(value):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= 256


def integer(value, maximum=9007199254740991):
    return type(value) is int and 0 <= value <= maximum


def reference(value):
    return (
        type(value) is dict
        and set(value) == {"owner", "id", "generation"}
        and all(identifier(v) for v in value.values())
    )


def context(value):
    return (
        type(value) is dict
        and set(value) == {"molecule", "chemicalState", "structure", "preparation"}
        and reference(value["molecule"])
        and reference(value["preparation"])
        and identifier(value["chemicalState"])
        and identifier(value["structure"])
    )


@register_pipeline(kind="molsyssketcher_molsysmt", name="request")
def validate_request(value, ctx):
    def invalid():
        raise ArgumentError(
            reason="expected exact attributed document, native analysis, one frame, bounded page and explicit correspondences"
        )

    if type(value) is not dict or set(value) != {
        "document",
        "analysis",
        "structureIndex",
        "correspondence",
        "offset",
        "limit",
    }:
        invalid()
    document = value["document"]
    if type(document) is not dict or set(document) != {
        "schemaVersion",
        "kind",
        "id",
        "mode",
        "parents",
        "analyses",
    }:
        invalid()
    if (
        document["schemaVersion"] != 1
        or document["kind"] != "interaction-document"
        or not identifier(document["id"])
        or document["mode"] not in {"ligand-centered", "interface-centered"}
    ):
        invalid()
    parents = document["parents"]
    if (
        type(parents) is not list
        or not 1 <= len(parents) <= 8
        or not all(context(parent) for parent in parents)
    ):
        invalid()
    if (
        not reference(value["analysis"])
        or type(document["analyses"]) is not list
        or not any(
            type(a) is dict
            and set(a) == {"result", "parents"}
            and a["result"] == value["analysis"]
            and a["parents"] == parents
            for a in document["analyses"]
        )
    ):
        invalid()
    if (
        not integer(value["structureIndex"], 4095)
        or not integer(value["offset"])
        or not integer(value["limit"], 256)
    ):
        invalid()
    bindings = value["correspondence"]
    if (
        type(bindings) is not dict
        or set(bindings) != {"authority", "atoms", "frames"}
        or bindings["authority"] != "caller-declared@1"
    ):
        invalid()
    if (
        type(bindings["atoms"]) is not list
        or len(bindings["atoms"]) > 4096
        or type(bindings["frames"]) is not list
        or len(bindings["frames"]) != len(parents)
    ):
        invalid()
    for atom in bindings["atoms"]:
        if (
            type(atom) is not dict
            or set(atom) != {"index", "sourceIndex", "parentIndex", "atomId"}
            or not integer(atom["index"], 4095)
            or not integer(atom["sourceIndex"])
            or not integer(atom["parentIndex"], len(parents) - 1)
            or not identifier(atom["atomId"])
        ):
            invalid()
    for frame in bindings["frames"]:
        if (
            type(frame) is not dict
            or set(frame) != {"parentIndex", "index", "sourceIndex", "structure"}
            or not integer(frame["parentIndex"], len(parents) - 1)
            or frame["index"] != value["structureIndex"]
            or not integer(frame["sourceIndex"])
            or frame["structure"] != parents[frame["parentIndex"]]["structure"]
        ):
            invalid()
    return deepcopy(value)
