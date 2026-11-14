import pytest

from freal.leagues.models import MatchupKind, Season
from freal.metrics.standings import standings
from tests.factories import matchup, season, side


def test_record_and_points_come_from_regular_season_games_only() -> None:
    games = season(
        [
            matchup(1, side(1, 100), side(2, 90)),
            matchup(2, side(1, 80), side(2, 80)),
            matchup(3, side(2, 120), side(1, 70)),
            matchup(15, side(1, 500), side(2, 1), kind=MatchupKind.PLAYOFF),
        ],
        team_ids=(1, 2),
    )

    one, two = standings(games)

    assert (one.wins, one.losses, one.ties) == (1, 1, 1)
    assert (two.wins, two.losses, two.ties) == (1, 1, 1)
    assert one.points_for == pytest.approx(250)
    assert one.points_against == pytest.approx(290)


def test_every_win_is_someone_elses_loss(season_2025: Season) -> None:
    table = standings(season_2025)

    assert sum(row.wins for row in table) == sum(row.losses for row in table)
    assert sum(row.points_for for row in table) == pytest.approx(
        sum(row.points_against for row in table)
    )
    assert all(row.wins + row.losses + row.ties == 14 for row in table)
