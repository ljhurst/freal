from enum import StrEnum

from freal.metrics.luck import Luck
from freal.metrics.standings import Standing

LUCK_THRESHOLD = 1.0
GOOD_SHARE = 0.6
BAD_SHARE = 0.4


class Verdict(StrEnum):
    LUCKY = "lucky"
    UNLUCKY = "unlucky"
    AS_EXPECTED = "as_expected"


class Strength(StrEnum):
    GOOD = "good"
    AVERAGE = "average"
    BAD = "bad"


def verdict_for(luck: Luck) -> Verdict:
    """Whether a team's record flatters it, sells it short, or is what its scoring earned.

    The line is a full win of luck over the season.
    """
    if luck.luck >= LUCK_THRESHOLD:
        return Verdict.LUCKY
    if luck.luck <= -LUCK_THRESHOLD:
        return Verdict.UNLUCKY
    return Verdict.AS_EXPECTED


def strength_for(luck: Luck, standing: Standing) -> Strength:
    """How good a team is by what its scoring earned, whatever its record says."""
    games = standing.wins + standing.losses + standing.ties
    if games == 0:
        return Strength.AVERAGE
    share = luck.expected_wins / games
    if share >= GOOD_SHARE:
        return Strength.GOOD
    if share <= BAD_SHARE:
        return Strength.BAD
    return Strength.AVERAGE


def is_for_real(strength: Strength, verdict: Verdict) -> bool:
    """The stamp: scoring that is good whatever the record, or decent and held back by luck."""
    return strength is Strength.GOOD or (
        strength is Strength.AVERAGE and verdict is Verdict.UNLUCKY
    )
