from importlib import import_module, metadata


def app_version() -> str:
    """The API's version; the Lambda package carries no metadata, so its build writes a module."""
    try:
        return str(import_module("freal._version").VERSION)
    except ModuleNotFoundError:
        return metadata.version("freal")
