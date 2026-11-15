from enum import StrEnum

from freal.metrics.luck import Luck

LUCK_THRESHOLD = 1.0


class Verdict(StrEnum):
    LUCKY = "lucky"
    UNLUCKY = "unlucky"
    AS_EXPECTED = "as_expected"


def verdict_for(luck: Luck) -> Verdict:
    """Whether a team's record flatters it, sells it short, or is what its scoring earned.

    The line is a full win of luck over the season, one in fourteen games.
    """
    if luck.luck >= LUCK_THRESHOLD:
        return Verdict.LUCKY
    if luck.luck <= -LUCK_THRESHOLD:
        return Verdict.UNLUCKY
    return Verdict.AS_EXPECTED
