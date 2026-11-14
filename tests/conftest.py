from pathlib import Path

import pytest

from freal.leagues.models import Season

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def season_2025() -> Season:
    return Season.model_validate_json((FIXTURES / "season_2025.json").read_text())
