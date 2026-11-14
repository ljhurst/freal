from collections import defaultdict
from statistics import fmean

from freal.leagues.models import Season
from freal.metrics.results import games_by_team
from freal.metrics.standings import standings
from freal.models import FrozenModel


class Luck(FrozenModel):
    team_id: int
    expected_wins: float
    luck: float
    all_play_wins: int
    all_play_ties: int
    all_play_losses: int


class ScheduleStrength(FrozenModel):
    team_id: int
    average_opponent_points: float


def luck_table(season: Season) -> tuple[Luck, ...]:
    """Actual wins against the wins a team would expect playing every other team each week."""
    games_of = games_by_team(season)
    points_by_week: dict[int, dict[int, float]] = defaultdict(dict)
    for team_id, games in games_of.items():
        for game in games:
            points_by_week[game.week][team_id] = game.points

    standing_of = {standing.team_id: standing for standing in standings(season)}
    table = []
    for team_id, games in games_of.items():
        all_play_wins = all_play_ties = all_play_losses = 0
        expected_wins = 0.0
        for game in games:
            others = [p for t, p in points_by_week[game.week].items() if t != team_id]
            beaten = sum(game.points > p for p in others)
            tied = sum(game.points == p for p in others)
            all_play_wins += beaten
            all_play_ties += tied
            all_play_losses += len(others) - beaten - tied
            expected_wins += (beaten + tied / 2) / len(others)
        table.append(
            Luck(
                team_id=team_id,
                expected_wins=expected_wins,
                luck=standing_of[team_id].wins + standing_of[team_id].ties / 2 - expected_wins,
                all_play_wins=all_play_wins,
                all_play_ties=all_play_ties,
                all_play_losses=all_play_losses,
            )
        )
    return tuple(table)


def strength_of_schedule(season: Season) -> tuple[ScheduleStrength, ...]:
    """The average of each opponent's average weekly points, over a team's games."""
    games_of = games_by_team(season)
    average_points = {
        team_id: fmean(game.points for game in games) for team_id, games in games_of.items()
    }
    return tuple(
        ScheduleStrength(
            team_id=team_id,
            average_opponent_points=fmean(average_points[game.opponent_id] for game in games),
        )
        for team_id, games in games_of.items()
    )
