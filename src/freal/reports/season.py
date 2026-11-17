from freal.leagues.models import Season
from freal.metrics.consistency import Consistency, consistency
from freal.metrics.efficiency import LineupEfficiency, lineup_efficiency
from freal.metrics.luck import Luck, ScheduleStrength, luck_table, strength_of_schedule
from freal.metrics.playoffs import PlayoffRecord, playoff_records
from freal.metrics.results import TeamWeek, team_weeks
from freal.metrics.standings import Standing, standings
from freal.metrics.verdict import Strength, Verdict, is_for_real, strength_for, verdict_for
from freal.models import FrozenModel


class TeamReport(FrozenModel):
    team_id: int
    name: str
    final_rank: int | None
    standing: Standing
    playoffs: PlayoffRecord | None
    luck: Luck
    verdict: Verdict
    strength: Strength
    for_real: bool
    schedule: ScheduleStrength
    efficiency: LineupEfficiency
    consistency: Consistency


class SeasonReport(FrozenModel):
    league_id: int
    year: int
    name: str
    teams: tuple[TeamReport, ...]
    weeks: tuple[TeamWeek, ...]


def build_season_report(season: Season) -> SeasonReport:
    """Everything the dashboard shows for one season, safe to publish: team names only, no owners."""
    standing_of = {row.team_id: row for row in standings(season)}
    luck_of = {row.team_id: row for row in luck_table(season)}
    schedule_of = {row.team_id: row for row in strength_of_schedule(season)}
    efficiency_of = {row.team_id: row for row in lineup_efficiency(season)}
    consistency_of = {row.team_id: row for row in consistency(season)}
    playoffs_of = {row.team_id: row for row in playoff_records(season)}
    verdict_of = {team_id: verdict_for(row) for team_id, row in luck_of.items()}
    strength_of = {
        team_id: strength_for(luck_of[team_id], standing)
        for team_id, standing in standing_of.items()
    }
    return SeasonReport(
        league_id=season.league_id,
        year=season.year,
        name=season.name,
        teams=tuple(
            TeamReport(
                team_id=team.team_id,
                name=team.name,
                final_rank=team.final_rank,
                standing=standing_of[team.team_id],
                playoffs=playoffs_of.get(team.team_id),
                luck=luck_of[team.team_id],
                verdict=verdict_of[team.team_id],
                strength=strength_of[team.team_id],
                for_real=is_for_real(strength_of[team.team_id], verdict_of[team.team_id]),
                schedule=schedule_of[team.team_id],
                efficiency=efficiency_of[team.team_id],
                consistency=consistency_of[team.team_id],
            )
            for team in season.teams
            if team.team_id in standing_of
        ),
        weeks=team_weeks(season),
    )
