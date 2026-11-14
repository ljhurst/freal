from freal.leagues.models import FrozenModel, Season
from freal.metrics.results import games_by_team


class Standing(FrozenModel):
    team_id: int
    wins: int
    losses: int
    ties: int
    points_for: float
    points_against: float


def standings(season: Season) -> tuple[Standing, ...]:
    """Regular-season record and points for and against, per team."""
    return tuple(
        Standing(
            team_id=team_id,
            wins=sum(game.points > game.opponent_points for game in games),
            losses=sum(game.points < game.opponent_points for game in games),
            ties=sum(game.points == game.opponent_points for game in games),
            points_for=sum(game.points for game in games),
            points_against=sum(game.opponent_points for game in games),
        )
        for team_id, games in games_by_team(season).items()
    )
