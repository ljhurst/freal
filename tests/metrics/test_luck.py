import pytest

from freal.leagues.models import MatchupKind, Season
from freal.metrics.luck import luck_table, strength_of_schedule
from tests.factories import matchup, season, side


def test_expected_wins_are_the_share_of_the_league_outscored() -> None:
    games = season(
        [
            matchup(1, side(1, 100), side(4, 70)),
            matchup(1, side(2, 90), side(3, 80)),
        ]
    )

    table = {row.team_id: row for row in luck_table(games)}

    assert table[1].expected_wins == pytest.approx(1.0)
    assert table[2].expected_wins == pytest.approx(2 / 3)
    assert table[3].expected_wins == pytest.approx(1 / 3)
    assert table[4].expected_wins == pytest.approx(0.0)
    assert table[2].luck == pytest.approx(1 / 3)
    assert table[3].luck == pytest.approx(-1 / 3)
    assert (table[2].all_play_wins, table[2].all_play_losses) == (2, 1)


def test_equal_scores_elsewhere_in_the_league_count_half_a_win() -> None:
    games = season(
        [
            matchup(1, side(1, 100), side(3, 80)),
            matchup(1, side(2, 100), side(4, 60)),
        ]
    )

    table = {row.team_id: row for row in luck_table(games)}

    assert table[1].expected_wins == pytest.approx(2.5 / 3)
    assert table[1].all_play_ties == 1


def test_a_drawn_matchup_is_a_tie_and_not_luck() -> None:
    drawn = season([matchup(1, side(1, 90), side(2, 90))], team_ids=(1, 2))
    assert [row.ties for row in luck_table(drawn)] == [1, 1]
    assert [row.luck for row in luck_table(drawn)] == [0.0, 0.0]


def test_a_bye_week_only_compares_teams_that_played() -> None:
    games = season(
        [matchup(1, side(1, 100), side(2, 90))],
        team_ids=(1, 2, 3),
    )

    table = luck_table(games)

    assert [row.team_id for row in table] == [1, 2]
    assert table[0].expected_wins == pytest.approx(1.0)


def test_luck_is_included_when_the_table_is_serialized() -> None:
    games = season([matchup(1, side(1, 100), side(2, 90))], team_ids=(1, 2))

    assert luck_table(games)[0].model_dump()["luck"] == pytest.approx(0.0)


def test_luck_across_the_league_sums_to_zero(season_2025: Season) -> None:
    assert sum(row.luck for row in luck_table(season_2025)) == pytest.approx(0.0)


def test_playoff_games_are_ignored() -> None:
    games = season(
        [
            matchup(1, side(1, 100), side(2, 90)),
            matchup(15, side(1, 10), side(2, 200), kind=MatchupKind.PLAYOFF),
        ],
        team_ids=(1, 2),
    )

    assert [row.wins for row in luck_table(games)] == [1, 0]


def test_strength_of_schedule_is_the_average_points_of_opponents() -> None:
    games = season(
        [
            matchup(1, side(1, 100), side(2, 60)),
            matchup(2, side(1, 100), side(3, 80)),
            matchup(2, side(2, 140), side(4, 50)),
        ],
        team_ids=(1, 2, 3, 4),
    )

    strength = {row.team_id: row.average_opponent_points for row in strength_of_schedule(games)}

    assert strength[1] == pytest.approx((100 + 80) / 2)
    assert strength[3] == pytest.approx(100.0)
    assert set(strength) == {1, 2, 3, 4}
