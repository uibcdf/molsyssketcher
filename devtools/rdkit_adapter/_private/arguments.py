"""The input request pipeline; no scientific interpretation is implemented here."""

from copy import deepcopy

from argdigest import register_pipeline

from .smonitor import ArgumentError

MAX_SMILES_LENGTH = 4096
MAX_ATOMS = 256


def _identifier(value):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= 256


def _reference(value):
    return (
        type(value) is dict
        and set(value) == {"owner", "id", "generation"}
        and all(_identifier(item) for item in value.values())
    )


@register_pipeline(kind="molsyssketcher_rdkit", name="request")
def validate_request(value, ctx):
    if type(value) is not dict or set(value) != {"smiles", "documentId", "source", "context"}:
        raise ArgumentError(reason="expected smiles, documentId, source and context")
    smiles = value["smiles"]
    if (
        not isinstance(smiles, str)
        or not 0 < len(smiles) <= MAX_SMILES_LENGTH
        or len(smiles.split()) != 1
    ):
        raise ArgumentError(reason="expected one nonempty SMILES token within the size limit")
    if not _identifier(value["documentId"]) or not _reference(value["source"]):
        raise ArgumentError(reason="invalid document or original-source reference")
    context = value["context"]
    if (
        type(context) is not dict
        or set(context) != {"molecule", "chemicalState", "structure", "preparation"}
        or not _reference(context["molecule"])
        or not _reference(context["preparation"])
        or not _identifier(context["chemicalState"])
        or not _identifier(context["structure"])
    ):
        raise ArgumentError(reason="invalid molecular state/structure/preparation context")
    return deepcopy(value)
