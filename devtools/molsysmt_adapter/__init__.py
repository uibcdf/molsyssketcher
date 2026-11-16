"""Unshipped native interaction-page adapter; importing it loads no engine."""

from .projection import project_interactions, verify_quantity_records

__all__ = ["project_interactions", "verify_quantity_records"]
