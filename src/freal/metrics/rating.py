import random
from collections import defaultdict
from math import sqrt
from statistics import fmean, variance

from freal.leagues.models import Season
from freal.metrics.results import team_weeks
from freal.models import FrozenModel

DRAWS = 4000
SEED = 20260101


class Rating(FrozenModel):
    team_id: int
    points_above_average: float
    contender_probability: float
    bottom_probability: float


def rate_teams(season: Season) -> tuple[Rating, ...]:
    """How strong each team's scoring is, and how sure we can be that it is among the league's best.

    Strength is a team's points above that week's league average, pulled toward zero the less
    its weekly scores separate it from noise. The probabilities come from drawing each team's
    true strength from what we know about it, many times, and counting how often it lands in
    the top (or bottom) group.
    """
    weekly = _points_above_week_average(season)
    team_ids = sorted(weekly)
    if not team_ids:
        return ()
    group = contender_count(len(team_ids))
    if len(team_ids) < 2 or min(len(scores) for scores in weekly.values()) < 2:
        return _no_evidence(team_ids, group)

    games = {team_id: len(weekly[team_id]) for team_id in team_ids}
    means = {team_id: fmean(weekly[team_id]) for team_id in team_ids}
    noise = _pooled_variance(weekly)
    spread = variance(means.values()) - fmean(noise / games[team_id] for team_id in team_ids)
    if spread <= 0:
        return _no_evidence(team_ids, group)

    weight = {team_id: spread / (spread + noise / games[team_id]) for team_id in team_ids}
    strength = {team_id: weight[team_id] * means[team_id] for team_id in team_ids}
    uncertainty = {team_id: sqrt(weight[team_id] * noise / games[team_id]) for team_id in team_ids}
    top, bottom = _group_odds(strength, uncertainty, group)
    return tuple(
        Rating(
            team_id=team_id,
            points_above_average=strength[team_id],
            contender_probability=top[team_id],
            bottom_probability=bottom[team_id],
        )
        for team_id in team_ids
    )


def contender_count(team_count: int) -> int:
    """How many teams count as the league's real threats: the top quarter, and at least one."""
    return max(1, team_count // 4)


def _points_above_week_average(season: Season) -> dict[int, list[float]]:
    rows = sorted(team_weeks(season), key=lambda row: row.week)
    week_points: dict[int, list[float]] = defaultdict(list)
    for row in rows:
        week_points[row.week].append(row.points)
    average = {week: fmean(points) for week, points in week_points.items()}
    above: dict[int, list[float]] = defaultdict(list)
    for row in rows:
        above[row.team_id].append(row.points - average[row.week])
    return dict(above)


def _pooled_variance(weekly: dict[int, list[float]]) -> float:
    degrees = sum(len(scores) - 1 for scores in weekly.values())
    return sum(variance(scores) * (len(scores) - 1) for scores in weekly.values()) / degrees


def _group_odds(
    strength: dict[int, float], uncertainty: dict[int, float], group: int
) -> tuple[dict[int, float], dict[int, float]]:
    rng = random.Random(SEED)
    top = dict.fromkeys(strength, 0)
    bottom = dict.fromkeys(strength, 0)
    for _ in range(DRAWS):
        drawn = sorted((rng.gauss(strength[t], uncertainty[t]), t) for t in strength)
        for _, team_id in drawn[-group:]:
            top[team_id] += 1
        for _, team_id in drawn[:group]:
            bottom[team_id] += 1
    return (
        {team_id: count / DRAWS for team_id, count in top.items()},
        {team_id: count / DRAWS for team_id, count in bottom.items()},
    )


def _no_evidence(team_ids: list[int], group: int) -> tuple[Rating, ...]:
    share = group / len(team_ids)
    return tuple(
        Rating(
            team_id=team_id,
            points_above_average=0.0,
            contender_probability=share,
            bottom_probability=share,
        )
        for team_id in team_ids
    )
