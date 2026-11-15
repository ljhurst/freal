import tomllib
from pathlib import Path

from freal.operations.version import app_version


def test_the_version_matches_the_project_version() -> None:
    pyproject = tomllib.loads(Path("pyproject.toml").read_text())

    assert app_version() == pyproject["project"]["version"]
