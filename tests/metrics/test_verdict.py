import pytest

from freal.metrics.luck import Luck
from freal.metrics.standings import Standing
from freal.metrics.verdict import Strength, Verdict, is_for_real, strength_for, verdict_for


def _luck(value: float) -> Luck:
    return Luck(
        team_id=1,
        expected_wins=7.0,
        luck=value,
        all_play_wins=50,
        all_play_ties=0,
        all_play_losses=48,
    )


@pytest.mark.parametrize(
    ("luck", "expected"),
    [
        (2.3, Verdict.LUCKY),
        (1.0, Verdict.LUCKY),
        (0.99, Verdict.AS_EXPECTED),
        (0.0, Verdict.AS_EXPECTED),
        (-0.99, Verdict.AS_EXPECTED),
        (-1.0, Verdict.UNLUCKY),
        (-2.0, Verdict.UNLUCKY),
    ],
)
def test_a_full_win_of_luck_either_way_is_the_line(luck: float, expected: Verdict) -> None:
    assert verdict_for(_luck(luck)) is expected


def _standing(wins: int, losses: int) -> Standing:
    return Standing(
        team_id=1, wins=wins, losses=losses, ties=0, points_for=1000.0, points_against=1000.0
    )


@pytest.mark.parametrize(
    ("expected_wins", "expected"),
    [
        (8.4, Strength.GOOD),
        (8.39, Strength.AVERAGE),
        (5.61, Strength.AVERAGE),
        (5.6, Strength.BAD),
        (2.0, Strength.BAD),
    ],
)
def test_strength_is_the_share_of_games_scoring_earned(
    expected_wins: float, expected: Strength
) -> None:
    luck = _luck(0.0).model_copy(update={"expected_wins": expected_wins})
    assert strength_for(luck, _standing(7, 7)) is expected


def test_a_team_with_no_games_is_average() -> None:
    assert strength_for(_luck(0.0), _standing(0, 0)) is Strength.AVERAGE


@pytest.mark.parametrize(
    ("strength", "verdict", "stamped"),
    [
        (Strength.GOOD, Verdict.AS_EXPECTED, True),
        (Strength.GOOD, Verdict.UNLUCKY, True),
        (Strength.GOOD, Verdict.LUCKY, True),
        (Strength.AVERAGE, Verdict.UNLUCKY, True),
        (Strength.AVERAGE, Verdict.AS_EXPECTED, False),
        (Strength.AVERAGE, Verdict.LUCKY, False),
        (Strength.BAD, Verdict.UNLUCKY, False),
        (Strength.BAD, Verdict.AS_EXPECTED, False),
        (Strength.BAD, Verdict.LUCKY, False),
    ],
)
def test_the_stamp_goes_to_good_teams_and_to_decent_teams_luck_hurt(
    strength: Strength, verdict: Verdict, stamped: bool
) -> None:
    assert is_for_real(strength, verdict) is stamped
