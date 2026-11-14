from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from espn_api.football import League as EspnLeague
from pydantic import BaseModel, SecretStr

from freal.leagues.models import Matchup, MatchupKind, Season, Side, Slot, Team

MAX_PARALLEL_FETCHES = 8
PENDING_OUTCOME = "U"

MATCHUP_KINDS = {
    "NONE": MatchupKind.REGULAR,
    "WINNERS_BRACKET": MatchupKind.PLAYOFF,
}


class EspnCredentials(BaseModel):
    espn_s2: SecretStr
    swid: SecretStr


def load_season(league_id: int, year: int, credentials: EspnCredentials | None = None) -> Season:
    """Fetch one season of a league from ESPN: teams plus every completed matchup."""
    espn = EspnLeague(
        league_id=league_id,
        year=year,
        espn_s2=credentials.espn_s2.get_secret_value() if credentials else None,
        swid=credentials.swid.get_secret_value() if credentials else None,
    )
    return build_season(espn, league_id, year, espn.box_scores)


def build_season(
    espn: Any, league_id: int, year: int, fetch_box_scores: Callable[[int], list[Any]]
) -> Season:
    settings = espn.settings
    periods = _completed_matchup_periods(espn.teams)
    scoring_periods = [
        _scoring_period(period, settings.reg_season_count, settings.playoff_matchup_period_length)
        for period in periods
    ]
    with ThreadPoolExecutor(MAX_PARALLEL_FETCHES) as pool:
        box_scores_by_period = list(pool.map(fetch_box_scores, scoring_periods))

    matchups = tuple(
        matchup
        for period, box_scores in zip(periods, box_scores_by_period, strict=True)
        for box in box_scores
        if (matchup := _to_matchup(period, box)) is not None
    )
    return Season(
        league_id=league_id,
        year=year,
        name=settings.name,
        regular_season_weeks=settings.reg_season_count,
        playoff_team_count=settings.playoff_team_count,
        teams=tuple(_to_team(team) for team in espn.teams),
        matchups=matchups,
    )


def _completed_matchup_periods(teams: list[Any]) -> list[int]:
    period_count = max(len(team.outcomes) for team in teams)
    return [
        period
        for period in range(1, period_count + 1)
        if any(
            len(team.outcomes) >= period and team.outcomes[period - 1] != PENDING_OUTCOME
            for team in teams
        )
    ]


def _scoring_period(matchup_period: int, regular_season_weeks: int, playoff_length: int) -> int:
    if matchup_period <= regular_season_weeks:
        return matchup_period
    playoff_round = matchup_period - regular_season_weeks - 1
    return regular_season_weeks + playoff_round * playoff_length + 1


def _to_team(team: Any) -> Team:
    owners = team.owners or []
    owner = owners[0]["displayName"] if owners else ""
    return Team(team_id=team.team_id, name=team.team_name, owner=owner)


def _to_matchup(period: int, box: Any) -> Matchup | None:
    if isinstance(box.home_team, int) or isinstance(box.away_team, int):
        return None
    return Matchup(
        week=period,
        kind=MATCHUP_KINDS.get(box.matchup_type, MatchupKind.CONSOLATION),
        home=Side(
            team_id=box.home_team.team_id,
            points=box.home_score,
            projected_points=box.home_projected,
            lineup=tuple(_to_slot(player) for player in box.home_lineup),
        ),
        away=Side(
            team_id=box.away_team.team_id,
            points=box.away_score,
            projected_points=box.away_projected,
            lineup=tuple(_to_slot(player) for player in box.away_lineup),
        ),
    )


def _to_slot(player: Any) -> Slot:
    return Slot(
        player_id=player.playerId,
        name=player.name,
        position=player.position,
        slot=player.slot_position,
        eligible_slots=tuple(player.eligibleSlots),
        points=player.points,
        projected_points=player.projected_points,
    )
