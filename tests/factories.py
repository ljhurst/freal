from freal.leagues.models import Matchup, MatchupKind, Season, Side, Slot, Team

NO_LINEUP: tuple[Slot, ...] = ()


def slot(
    slot_name: str,
    points: float,
    eligible: tuple[str, ...] | None = None,
    player_id: int = 1,
) -> Slot:
    return Slot(
        player_id=player_id,
        name=f"Player {player_id}",
        position=slot_name,
        slot=slot_name,
        eligible_slots=eligible if eligible is not None else (slot_name, "BE", "IR"),
        points=points,
        projected_points=points,
    )


def side(team_id: int, points: float, lineup: tuple[Slot, ...] = NO_LINEUP) -> Side:
    return Side(team_id=team_id, points=points, projected_points=points, lineup=lineup)


def matchup(week: int, home: Side, away: Side, kind: MatchupKind = MatchupKind.REGULAR) -> Matchup:
    return Matchup(week=week, kind=kind, home=home, away=away)


def season(matchups: list[Matchup], team_ids: tuple[int, ...] = (1, 2, 3, 4)) -> Season:
    return Season(
        league_id=1,
        year=2025,
        name="Test League",
        regular_season_weeks=14,
        playoff_team_count=4,
        teams=tuple(
            Team(team_id=i, name=f"Team {i}", owner=f"Owner {i}", owner_id=f"owner-{i}")
            for i in team_ids
        ),
        matchups=tuple(matchups),
    )
