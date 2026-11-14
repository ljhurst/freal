from collections import defaultdict

from freal.leagues.models import FrozenModel, Matchup, MatchupKind, Season


class TeamWeek(FrozenModel):
    team_id: int
    week: int
    points: float
    opponent_id: int
    opponent_points: float


def regular_matchups(season: Season) -> tuple[Matchup, ...]:
    return tuple(m for m in season.matchups if m.kind is MatchupKind.REGULAR)


def team_weeks(season: Season) -> tuple[TeamWeek, ...]:
    """Every team's regular-season games, one row per team per week."""
    return tuple(
        row
        for matchup in regular_matchups(season)
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


def games_by_team(season: Season) -> dict[int, list[TeamWeek]]:
    grouped: dict[int, list[TeamWeek]] = defaultdict(list)
    for game in team_weeks(season):
        grouped[game.team_id].append(game)
    return dict(sorted(grouped.items()))
