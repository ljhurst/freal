import pytest

from freal.leagues.models import MatchupKind, Season
from freal.metrics.efficiency import lineup_efficiency, optimal_points
from tests.factories import matchup, season, side, slot

RB = ("RB", "RB/WR", "BE", "IR")
WR = ("WR", "RB/WR", "BE", "IR")


def test_a_flex_slot_listed_first_does_not_waste_the_best_back() -> None:
    lineup = (
        slot("RB/WR", 8, eligible=WR, player_id=1),
        slot("RB", 20, eligible=RB, player_id=2),
        slot("WR", 10, eligible=WR, player_id=3),
        slot("BE", 15, eligible=WR, player_id=4),
        slot("BE", 5, eligible=RB, player_id=5),
    )

    assert optimal_points(side(1, 38, lineup)) == pytest.approx(45)


def test_an_already_optimal_lineup_is_fully_efficient() -> None:
    lineup = (
        slot("QB", 30, player_id=1),
        slot("BE", 12, eligible=("QB", "BE", "IR"), player_id=2),
    )
    games = season([matchup(1, side(1, 30, lineup), side(2, 0))], team_ids=(1, 2))

    efficiency = {row.team_id: row for row in lineup_efficiency(games)}

    assert efficiency[1].efficiency == pytest.approx(1.0)
    assert efficiency[1].left_on_bench == pytest.approx(0.0)


def test_points_left_on_the_bench_are_the_gap_to_the_best_lineup() -> None:
    lineup = (
        slot("QB", 10, player_id=1),
        slot("BE", 25, eligible=("QB", "BE", "IR"), player_id=2),
    )
    games = season([matchup(1, side(1, 10, lineup), side(2, 0))], team_ids=(1, 2))

    row = lineup_efficiency(games)[0]

    assert row.optimal_points == pytest.approx(25)
    assert row.left_on_bench == pytest.approx(15)
    assert row.efficiency == pytest.approx(0.4)


def test_players_on_injured_reserve_are_never_started() -> None:
    lineup = (
        slot("QB", 10, player_id=1),
        slot("IR", 40, eligible=("QB", "BE", "IR"), player_id=2),
    )

    assert optimal_points(side(1, 10, lineup)) == pytest.approx(10)


def test_playoff_matchups_are_ignored() -> None:
    lineup = (slot("QB", 10, player_id=1),)
    games = season(
        [matchup(15, side(1, 10, lineup), side(2, 0), kind=MatchupKind.PLAYOFF)],
        team_ids=(1, 2),
    )

    assert lineup_efficiency(games) == ()


def test_the_best_lineup_never_scores_less_than_the_real_one(season_2025: Season) -> None:
    rows = lineup_efficiency(season_2025)

    assert len(rows) == 8
    assert all(row.optimal_points >= row.points - 1e-6 for row in rows)
    assert all(0 < row.efficiency <= 1 + 1e-9 for row in rows)
