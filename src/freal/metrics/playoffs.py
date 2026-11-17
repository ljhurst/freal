from collections import defaultdict

from freal.leagues.models import MatchupKind, Season
from freal.models import FrozenModel


class PlayoffRecord(FrozenModel):
    team_id: int
    wins: int
    losses: int


def playoff_records(season: Season) -> tuple[PlayoffRecord, ...]:
    """Winners-bracket record per team; only teams that played a playoff game appear."""
    wins: dict[int, int] = defaultdict(int)
    losses: dict[int, int] = defaultdict(int)
    played: set[int] = set()
    for matchup in season.matchups:
        if matchup.kind is not MatchupKind.PLAYOFF:
            continue
        home, away = matchup.home, matchup.away
        played |= {home.team_id, away.team_id}
        if home.points > away.points:
            wins[home.team_id] += 1
            losses[away.team_id] += 1
        elif away.points > home.points:
            wins[away.team_id] += 1
            losses[home.team_id] += 1
    return tuple(
        PlayoffRecord(team_id=team_id, wins=wins[team_id], losses=losses[team_id])
        for team_id in sorted(played)
    )
