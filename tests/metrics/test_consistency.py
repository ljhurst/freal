import pytest

from freal.metrics.consistency import consistency
from tests.factories import matchup, season, side


def test_consistency_is_the_mean_and_spread_of_weekly_points() -> None:
    games = season(
        [
            matchup(1, side(1, 100), side(2, 90)),
            matchup(2, side(1, 80), side(2, 90)),
            matchup(3, side(1, 120), side(2, 90)),
        ],
        team_ids=(1, 2),
    )

    rows = {row.team_id: row for row in consistency(games)}

    assert rows[1].mean == pytest.approx(100)
    assert rows[1].stdev == pytest.approx((800 / 3) ** 0.5)
    assert rows[2].stdev == pytest.approx(0)
