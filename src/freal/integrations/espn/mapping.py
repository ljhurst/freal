from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from freal.leagues.models import Matchup, MatchupKind, Season, Side, Slot, Team

MAX_PARALLEL_FETCHES = 8
PENDING_OUTCOME = "U"

MATCHUP_KINDS = {
    "NONE": MatchupKind.REGULAR,
    "WINNERS_BRACKET": MatchupKind.PLAYOFF,
}


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
    owner = (team.owners or [{}])[0]
    return Team(
        team_id=team.team_id,
        name=team.team_name,
        owner=owner.get("displayName", ""),
        owner_id=owner.get("id", ""),
    )


def _to_matchup(period: int, box: Any) -> Matchup | None:
    if not (_is_team(box.home_team) and _is_team(box.away_team)):
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


def _is_team(side: Any) -> bool:
    return getattr(side, "team_id", None) is not None


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
