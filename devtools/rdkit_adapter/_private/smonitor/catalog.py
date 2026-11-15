"""Stable adapter diagnostics; raw molecular input is never interpolated."""

from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[2]
META = {"issues_url": "https://github.com/uibcdf/molsyssketcher/issues/2"}
CATALOG = {
    "argument": {
        "code": "MSS-RDKIT-ARGUMENT",
        "source": "molsyssketcher.rdkit",
        "category": "argument",
        "level": "ERROR",
    },
    "malformed": {
        "code": "MSS-RDKIT-MALFORMED",
        "source": "molsyssketcher.rdkit",
        "category": "chemistry",
        "level": "ERROR",
    },
    "unsupported": {
        "code": "MSS-RDKIT-UNSUPPORTED",
        "source": "molsyssketcher.rdkit",
        "category": "capability",
        "level": "ERROR",
    },
    "execution": {
        "code": "MSS-RDKIT-EXECUTION",
        "source": "molsyssketcher.rdkit",
        "category": "provider",
        "level": "ERROR",
    },
    "missing": {
        "code": "MSS-RDKIT-MISSING",
        "source": "molsyssketcher.rdkit",
        "category": "dependency",
        "level": "ERROR",
    },
}
CODES = {
    "MSS-RDKIT-ARGUMENT": {
        "message": "Invalid preparation request: {reason}.",
        "hint": "Use the documented bounded SMILES request and exact context references.",
    },
    "MSS-RDKIT-MALFORMED": {
        "message": "RDKit could not interpret the submitted SMILES.",
        "hint": "Correct the original input; the previous accepted document can remain available.",
    },
    "MSS-RDKIT-UNSUPPORTED": {
        "message": "The selected drawing profile does not support {reason}.",
        "hint": "Retain the original input and choose an explicitly supported profile.",
    },
    "MSS-RDKIT-EXECUTION": {
        "message": "RDKit preparation failed during {stage}.",
        "hint": "Inspect the provider failure cause; no fallback method was selected.",
    },
    "MSS-RDKIT-MISSING": {
        "message": "The requested RDKit engine is unavailable.",
        "hint": "Provision the declared conda-forge RDKit dependency for this source tool.",
    },
}
SIGNALS = {}

_METADATA_MESSAGES = {
    "MSS-RDKIT-ARGUMENT": "Invalid bounded RDKit preparation request.",
    "MSS-RDKIT-MALFORMED": "RDKit could not interpret the submitted input.",
    "MSS-RDKIT-UNSUPPORTED": "Input is outside the selected RDKit drawing profile.",
    "MSS-RDKIT-EXECUTION": "The selected RDKit preparation operation failed.",
    "MSS-RDKIT-MISSING": "The explicitly requested RDKit engine is unavailable.",
}
for _code, _message in _METADATA_MESSAGES.items():
    CODES[_code]["metadata_message"] = _message
