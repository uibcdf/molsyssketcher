"""Metadata-only source-adapter diagnostics; no native payload interpolation."""

from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[2]
META = {"issues_url": "https://github.com/uibcdf/molsyssketcher/issues/7"}
CATALOG = {
    name: {
        "code": f"MSS-MSM-{name.upper()}",
        "source": "molsyssketcher.molsysmt",
        "category": category,
        "level": "ERROR",
    }
    for name, category in {
        "argument": "argument",
        "missing": "dependency",
        "unsupported": "capability",
        "correspondence": "identity",
        "quantity": "unit",
        "execution": "provider",
    }.items()
}
CODES = {
    "MSS-MSM-ARGUMENT": {
        "message": "Invalid native-page request: {reason}.",
        "hint": "Use the finite documented frame/page and correspondence profile.",
    },
    "MSS-MSM-MISSING": {
        "message": "The requested MolSysMT provider is unavailable.",
        "hint": "Provision the explicitly selected source/provider route.",
    },
    "MSS-MSM-UNSUPPORTED": {
        "message": "Unsupported native-page profile: {reason}.",
        "hint": "Retain the native result and select a received method/schema.",
    },
    "MSS-MSM-CORRESPONDENCE": {
        "message": "The declared native correspondence does not match the page.",
        "hint": "Supply exact parent/analysis generations and explicit atom/frame links.",
    },
    "MSS-MSM-QUANTITY": {
        "message": "Native physical columns failed the declared unit/record handshake.",
        "hint": "Preserve field names, native units and sealed records; no default unit is assumed.",
    },
    "MSS-MSM-EXECUTION": {
        "message": "The native page operation failed.",
        "hint": "Inspect the preserved provider cause; no fallback calculation was selected.",
    },
}
for value in CODES.values():
    value["metadata_message"] = (
        value["message"].split(":")[0].replace("{reason}", "the admitted scope")
    )
SIGNALS = {}
