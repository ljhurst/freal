from datetime import date

import pytest
from pydantic import ValidationError

from freal.leagues.config import latest_season, parse_leagues


def test_leagues_are_parsed_and_list_every_year_since_the_first() -> None:
    raw = '[{"league_id": 1, "name": "L", "account": "luke", "first_year": 2024}]'

    (league,) = parse_leagues(raw)

    assert league.years(2026) == (2024, 2025, 2026)


@pytest.mark.parametrize("account", ["../other", "UPPER", "has space", ""])
def test_account_names_cannot_escape_the_parameter_prefix(account: str) -> None:
    raw = f'[{{"league_id": 1, "name": "L", "account": "{account}", "first_year": 2024}}]'

    with pytest.raises(ValidationError):
        parse_leagues(raw)


@pytest.mark.parametrize(
    ("today", "season"),
    [
        (date(2026, 7, 31), 2025),
        (date(2026, 8, 1), 2026),
        (date(2026, 11, 14), 2026),
        (date(2027, 1, 15), 2026),
        (date(2027, 2, 20), 2026),
    ],
)
def test_the_latest_season_runs_into_the_following_january(today: date, season: int) -> None:
    assert latest_season(today) == season
