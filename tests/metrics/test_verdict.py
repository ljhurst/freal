import pytest

from freal.metrics.luck import Luck
from freal.metrics.rating import Rating
from freal.metrics.standings import Standing
from freal.metrics.verdict import (
    Stamp,
    Strength,
    Verdict,
    stamp_for,
    strength_for,
    verdict_for,
)


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


def _rating(contender: float, bottom: float = 0.0, points: float = 5.0) -> Rating:
    return Rating(
        team_id=1,
        points_above_average=points,
        contender_probability=contender,
        bottom_probability=bottom,
    )


def _standing(wins: int, losses: int) -> Standing:
    return Standing(
        team_id=1, wins=wins, losses=losses, ties=0, points_for=1000.0, points_against=1000.0
    )


@pytest.mark.parametrize(
    ("contender", "bottom", "expected"),
    [
        (0.9, 0.0, Strength.GOOD),
        (0.35, 0.0, Strength.GOOD),
        (0.349, 0.1, Strength.AVERAGE),
        (0.1, 0.49, Strength.AVERAGE),
        (0.1, 0.5, Strength.BAD),
        (0.0, 0.9, Strength.BAD),
    ],
)
def test_strength_is_whether_a_team_has_a_real_shot_or_is_likely_a_weakling(
    contender: float, bottom: float, expected: Strength
) -> None:
    assert strength_for(_rating(contender, bottom)) is expected


@pytest.mark.parametrize(
    ("contender", "expected"),
    [
        (0.9, Stamp.FOR_REAL),
        (0.5, Stamp.FOR_REAL),
        (0.49, Stamp.IN_THE_HUNT),
        (0.35, Stamp.IN_THE_HUNT),
        (0.349, None),
        (0.0, None),
    ],
)
def test_a_team_is_for_real_or_in_the_hunt_by_its_chance_of_being_a_top_quarter_team(
    contender: float, expected: Stamp | None
) -> None:
    stamp = stamp_for(_rating(contender), Verdict.AS_EXPECTED, _standing(7, 7))

    assert stamp is expected


def _fraud_check(
    wins: int = 9,
    losses: int = 5,
    verdict: Verdict = Verdict.LUCKY,
    points: float = -1.0,
    contender: float = 0.1,
) -> Stamp | None:
    return stamp_for(_rating(contender, points=points), verdict, _standing(wins, losses))


def test_a_winning_record_that_luck_explains_on_weak_scoring_is_a_fraud() -> None:
    assert _fraud_check() is Stamp.FRAUD
    assert _fraud_check(points=-0.1) is Stamp.FRAUD


@pytest.mark.parametrize(
    "overrides",
    [
        {"wins": 7, "losses": 7},
        {"wins": 5, "losses": 9},
        {"verdict": Verdict.AS_EXPECTED},
        {"verdict": Verdict.UNLUCKY},
        {"points": 0.1},
        {"points": 0.0},
    ],
)
def test_it_takes_all_three_to_be_a_fraud(overrides: dict[str, object]) -> None:
    assert _fraud_check(**overrides) is None  # type: ignore[arg-type]


def test_a_team_that_is_for_real_or_in_the_hunt_is_never_a_fraud() -> None:
    assert _fraud_check(contender=0.6) is Stamp.FOR_REAL
    assert _fraud_check(contender=0.4) is Stamp.IN_THE_HUNT
