import pytest

from freal.metrics.luck import Luck
from freal.metrics.verdict import Verdict, verdict_for


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
