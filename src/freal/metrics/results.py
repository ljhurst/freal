from freal.leagues.models import FrozenModel, MatchupKind, Season


class TeamWeek(FrozenModel):
    team_id: int
    week: int
    points: float
    opponent_id: int
    opponent_points: float


def team_weeks(season: Season) -> tuple[TeamWeek, ...]:
    """Every team's regular-season games, one row per team per week."""
    return tuple(
        row
        for matchup in season.matchups
        if matchup.kind is MatchupKind.REGULAR
        for row in (
            TeamWeek(
                team_id=matchup.home.team_id,
                week=matchup.week,
                points=matchup.home.points,
                opponent_id=matchup.away.team_id,
                opponent_points=matchup.away.points,
            ),
            TeamWeek(
                team_id=matchup.away.team_id,
                week=matchup.week,
                points=matchup.away.points,
                opponent_id=matchup.home.team_id,
                opponent_points=matchup.home.points,
            ),
        )
    )
