from enum import StrEnum

from freal.metrics.luck import Luck
from freal.metrics.rating import Rating

LUCK_THRESHOLD = 1.0
LIKELY = 0.5


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


def strength_for(rating: Rating) -> Strength:
    """Good when a team is more likely than not one of the league's real threats, Bad when it is
    more likely than not one of its weakest."""
    if rating.contender_probability >= LIKELY:
        return Strength.GOOD
    if rating.bottom_probability >= LIKELY:
        return Strength.BAD
    return Strength.AVERAGE
