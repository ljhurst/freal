from types import SimpleNamespace
from typing import Any

from freal.integrations.espn.client import build_season
from freal.leagues.models import MatchupKind


def test_regular_and_playoff_matchups_are_converted() -> None:
    espn = _league(outcomes={1: ["W", "L", "W"], 2: ["L", "W", "L"]})
    boxes = {
        1: [_box("NONE", 100.0, 90.0)],
        3: [_box("WINNERS_BRACKET", 250.0, 240.0)],
    }

    season = build_season(espn, 7, 2025, lambda period: boxes.get(period, []))

    assert [(m.week, m.kind) for m in season.matchups] == [
        (1, MatchupKind.REGULAR),
        (3, MatchupKind.PLAYOFF),
    ]
    first = season.matchups[0]
    assert (first.home.points, first.away.points) == (100.0, 90.0)
    assert first.home.lineup[0].is_starter
    assert not first.home.lineup[1].is_starter
    assert [t.owner for t in season.teams] == ["owner-1", "owner-2"]


def test_consolation_brackets_are_not_playoffs() -> None:
    espn = _league(outcomes={1: ["W"], 2: ["L"]}, regular_season_weeks=1)
    boxes = {1: [_box("LOSERS_CONSOLATION_LADDER", 80.0, 70.0)]}

    season = build_season(espn, 7, 2025, lambda period: boxes[period])

    assert season.matchups[0].kind is MatchupKind.CONSOLATION


def test_in_progress_weeks_are_not_fetched() -> None:
    espn = _league(outcomes={1: ["W", "U"], 2: ["L", "U"]})
    fetched: list[int] = []

    def fetch(period: int) -> list[Any]:
        fetched.append(period)
        return []

    build_season(espn, 7, 2026, fetch)

    assert fetched == [1]


def test_playoff_round_fetches_the_first_scoring_period_of_the_round() -> None:
    espn = _league(
        outcomes={1: ["W", "W", "W", "W"], 2: ["L", "L", "L", "L"]},
        regular_season_weeks=2,
        playoff_length=2,
    )
    fetched: list[int] = []

    def fetch(period: int) -> list[Any]:
        fetched.append(period)
        return []

    build_season(espn, 7, 2025, fetch)

    assert sorted(fetched) == [1, 2, 3, 5]


def test_bye_weeks_are_skipped() -> None:
    espn = _league(outcomes={1: ["W"], 2: ["L"]})
    bye = _box("NONE", 100.0, 0.0)
    bye.away_team = 0

    season = build_season(espn, 7, 2024, lambda period: [bye])

    assert season.matchups == ()


def _league(
    outcomes: dict[int, list[str]], regular_season_weeks: int = 14, playoff_length: int = 2
) -> Any:
    return SimpleNamespace(
        settings=SimpleNamespace(
            name="Test League",
            reg_season_count=regular_season_weeks,
            playoff_team_count=4,
            playoff_matchup_period_length=playoff_length,
        ),
        teams=[
            SimpleNamespace(
                team_id=team_id,
                team_name=f"team-{team_id}",
                owners=[{"displayName": f"owner-{team_id}"}],
                outcomes=team_outcomes,
            )
            for team_id, team_outcomes in outcomes.items()
        ],
    )


def _box(matchup_type: str, home: float, away: float) -> Any:
    lineup = [_player("QB", 20.0), _player("BE", 5.0)]
    return SimpleNamespace(
        matchup_type=matchup_type,
        home_team=SimpleNamespace(team_id=1),
        away_team=SimpleNamespace(team_id=2),
        home_score=home,
        away_score=away,
        home_projected=home,
        away_projected=away,
        home_lineup=lineup,
        away_lineup=lineup,
    )


def _player(slot: str, points: float) -> Any:
    return SimpleNamespace(
        playerId=1,
        name="Player",
        position="QB",
        slot_position=slot,
        eligibleSlots=["QB", "BE"],
        points=points,
        projected_points=points,
    )
