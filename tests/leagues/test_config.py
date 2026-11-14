import pytest
from pydantic import ValidationError

from freal.leagues.config import parse_leagues


def test_leagues_are_parsed_and_list_every_year_since_the_first() -> None:
    raw = '[{"league_id": 1, "name": "L", "account": "luke", "first_year": 2024}]'

    (league,) = parse_leagues(raw)

    assert league.years(2026) == (2024, 2025, 2026)


@pytest.mark.parametrize("account", ["../other", "UPPER", "has space", ""])
def test_account_names_cannot_escape_the_parameter_prefix(account: str) -> None:
    raw = f'[{{"league_id": 1, "name": "L", "account": "{account}", "first_year": 2024}}]'

    with pytest.raises(ValidationError):
        parse_leagues(raw)
