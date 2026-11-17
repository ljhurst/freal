import pytest

from freal.metrics.luck import Luck
from freal.metrics.rating import Rating
from freal.metrics.verdict import Strength, Verdict, strength_for, verdict_for


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


def _rating(contender: float, bottom: float) -> Rating:
    return Rating(
        team_id=1,
        points_above_average=0.0,
        contender_probability=contender,
        bottom_probability=bottom,
    )


@pytest.mark.parametrize(
    ("contender", "bottom", "expected"),
    [
        (0.5, 0.0, Strength.GOOD),
        (0.49, 0.1, Strength.AVERAGE),
        (0.1, 0.49, Strength.AVERAGE),
        (0.0, 0.5, Strength.BAD),
        (0.9, 0.0, Strength.GOOD),
        (0.0, 0.9, Strength.BAD),
    ],
)
def test_strength_is_whether_a_team_is_more_likely_than_not_a_threat_or_a_weakling(
    contender: float, bottom: float, expected: Strength
) -> None:
    assert strength_for(_rating(contender, bottom)) is expected
