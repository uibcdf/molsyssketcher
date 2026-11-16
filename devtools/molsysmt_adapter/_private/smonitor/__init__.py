from smonitor.integrations import CatalogException, DiagnosticBundle

from .catalog import CATALOG, META, PACKAGE_ROOT

bundle = DiagnosticBundle(CATALOG, META, PACKAGE_ROOT, bootstrap_policy=False)


class AdapterError(CatalogException):
    def __init__(self, message=None, *, reason="unspecified", **context):
        super().__init__(message, catalog=CATALOG, meta=META, extra={"reason": reason, **context})


class ArgumentError(AdapterError, ValueError):
    catalog_key = "argument"


class MissingProviderError(AdapterError, ImportError):
    catalog_key = "missing"


class UnsupportedProfileError(AdapterError):
    catalog_key = "unsupported"


class CorrespondenceError(AdapterError, ValueError):
    catalog_key = "correspondence"


class QuantityError(AdapterError, ValueError):
    catalog_key = "quantity"


class ProviderError(AdapterError):
    catalog_key = "execution"
