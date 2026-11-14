from collections import defaultdict
from statistics import fmean

from freal.leagues.models import FrozenModel, Season
from freal.metrics.results import TeamWeek, team_weeks


class Luck(FrozenModel):
    team_id: int
    wins: int
    ties: int
    expected_wins: float
    all_play_wins: int
    all_play_ties: int
    all_play_losses: int

    @property
    def luck(self) -> float:
        return self.wins + self.ties / 2 - self.expected_wins


class ScheduleStrength(FrozenModel):
    team_id: int
    average_opponent_points: float


def luck_table(season: Season) -> tuple[Luck, ...]:
    """Actual wins against the wins a team would expect playing every other team each week."""
    rows = team_weeks(season)
    points_by_week: dict[int, dict[int, float]] = defaultdict(dict)
    for row in rows:
        points_by_week[row.week][row.team_id] = row.points

    games_by_team = _group_by_team(rows)
    table = []
    for team_id, games in sorted(games_by_team.items()):
        wins = sum(game.points > game.opponent_points for game in games)
        ties = sum(game.points == game.opponent_points for game in games)
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
                wins=wins,
                ties=ties,
                expected_wins=expected_wins,
                all_play_wins=all_play_wins,
                all_play_ties=all_play_ties,
                all_play_losses=all_play_losses,
            )
        )
    return tuple(table)


def strength_of_schedule(season: Season) -> tuple[ScheduleStrength, ...]:
    """The average of each opponent's average weekly points, over a team's games."""
    games_by_team = _group_by_team(team_weeks(season))
    average_points = {
        team_id: fmean(game.points for game in games) for team_id, games in games_by_team.items()
    }
    return tuple(
        ScheduleStrength(
            team_id=team_id,
            average_opponent_points=fmean(average_points[game.opponent_id] for game in games),
        )
        for team_id, games in sorted(games_by_team.items())
    )


def _group_by_team(rows: tuple[TeamWeek, ...]) -> dict[int, list[TeamWeek]]:
    grouped: dict[int, list[TeamWeek]] = defaultdict(list)
    for row in rows:
        grouped[row.team_id].append(row)
    return grouped
