"""Catalog-backed adapter errors with reconstructible messages."""

from smonitor.integrations import CatalogException, DiagnosticBundle

from .catalog import CATALOG, META, PACKAGE_ROOT

bundle = DiagnosticBundle(CATALOG, META, PACKAGE_ROOT, bootstrap_policy=False)


class AdapterError(CatalogException):
    """Preserving structured reason/stage while supporting args-only rebuilds."""

    def __init__(self, message=None, *, reason="unspecified", stage="preparation", **context):
        super().__init__(
            message,
            catalog=CATALOG,
            meta=META,
            extra={"reason": reason, "stage": stage, **context},
        )


class ArgumentError(AdapterError, ValueError):
    catalog_key = "argument"


class MalformedInputError(AdapterError, ValueError):
    catalog_key = "malformed"


class UnsupportedFeatureError(AdapterError):
    catalog_key = "unsupported"


class PreparationError(AdapterError):
    catalog_key = "execution"


class MissingEngineError(AdapterError, ImportError):
    catalog_key = "missing"
