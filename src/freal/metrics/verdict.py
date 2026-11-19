from enum import StrEnum

from freal.metrics.luck import Luck
from freal.metrics.rating import Rating
from freal.metrics.standings import Standing

LUCK_THRESHOLD = 1.0
LIKELY = 0.5
REAL_SHOT = 0.35


class Verdict(StrEnum):
    LUCKY = "lucky"
    UNLUCKY = "unlucky"
    AS_EXPECTED = "as_expected"


class Strength(StrEnum):
    GOOD = "good"
    AVERAGE = "average"
    BAD = "bad"


class Stamp(StrEnum):
    FOR_REAL = "for_real"
    IN_THE_HUNT = "in_the_hunt"
    FRAUD = "fraud"


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
    """Good when a team has at least a real shot at being one of the league's real threats, Bad
    when it is more likely than not one of the weakest."""
    if rating.contender_probability >= REAL_SHOT:
        return Strength.GOOD
    if rating.bottom_probability >= LIKELY:
        return Strength.BAD
    return Strength.AVERAGE


def stamp_for(rating: Rating, standing: Standing) -> Stamp | None:
    """The verdict on a team: a likely threat, a team with a real shot, or a winning record on a
    team that is more likely than not one of the league's weakest."""
    if rating.contender_probability >= LIKELY:
        return Stamp.FOR_REAL
    if rating.contender_probability >= REAL_SHOT:
        return Stamp.IN_THE_HUNT
    if standing.wins > standing.losses and rating.bottom_probability >= LIKELY:
        return Stamp.FRAUD
    return None
