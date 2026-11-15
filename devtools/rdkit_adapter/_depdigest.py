"""Dependencies of the source-development adapter, separate from the web core."""

LIBRARIES = {
    "rdkit": {"type": "soft", "pypi": None, "conda": "rdkit", "channel": "conda-forge"},
    "argdigest": {"type": "hard", "pypi": None, "conda": "argdigest", "channel": "uibcdf"},
    "depdigest": {"type": "hard", "pypi": None, "conda": "depdigest", "channel": "uibcdf"},
    "smonitor": {"type": "hard", "pypi": None, "conda": "smonitor", "channel": "uibcdf"},
}
