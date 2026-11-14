from statistics import fmean, pstdev

from freal.leagues.models import FrozenModel, Season
from freal.metrics.results import games_by_team


class Consistency(FrozenModel):
    team_id: int
    mean: float
    stdev: float


def consistency(season: Season) -> tuple[Consistency, ...]:
    """Average weekly points and how much they swing, over the regular season."""
    rows = []
    for team_id, games in games_by_team(season).items():
        points = [game.points for game in games]
        rows.append(Consistency(team_id=team_id, mean=fmean(points), stdev=pstdev(points)))
    return tuple(rows)
