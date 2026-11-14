from statistics import fmean, pstdev

from freal.leagues.models import FrozenModel, Season
from freal.metrics.results import team_weeks


class Consistency(FrozenModel):
    team_id: int
    mean: float
    stdev: float


def consistency(season: Season) -> tuple[Consistency, ...]:
    """Average weekly points and how much they swing, over the regular season."""
    points_by_team: dict[int, list[float]] = {}
    for game in team_weeks(season):
        points_by_team.setdefault(game.team_id, []).append(game.points)
    return tuple(
        Consistency(team_id=team_id, mean=fmean(points), stdev=pstdev(points))
        for team_id, points in sorted(points_by_team.items())
    )
