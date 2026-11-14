from datetime import date

import pytest

from freal.leagues.seasons import latest_season


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
