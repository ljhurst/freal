from freal.leagues.models import MatchupKind, Season
from freal.metrics.playoffs import PlayoffRecord, playoff_records
from tests.factories import matchup, season, side


def test_only_winners_bracket_games_count() -> None:
    games = season(
        [
            matchup(1, side(1, 100), side(2, 90)),
            matchup(15, side(1, 120), side(2, 110), kind=MatchupKind.PLAYOFF),
            matchup(15, side(3, 90), side(4, 95), kind=MatchupKind.CONSOLATION),
            matchup(16, side(2, 140), side(1, 130), kind=MatchupKind.PLAYOFF),
        ]
    )

    assert playoff_records(games) == (
        PlayoffRecord(team_id=1, wins=1, losses=1),
        PlayoffRecord(team_id=2, wins=1, losses=1),
    )


def test_a_team_that_never_played_a_playoff_game_is_absent() -> None:
    games = season(
        [
            matchup(14, side(3, 100), side(4, 90)),
            matchup(15, side(1, 120), side(2, 110), kind=MatchupKind.PLAYOFF),
        ]
    )

    assert [row.team_id for row in playoff_records(games)] == [1, 2]


def test_a_bye_adds_no_game(season_2025: Season) -> None:
    records = {row.team_id: row for row in playoff_records(season_2025)}

    assert sum(row.wins for row in records.values()) == sum(row.losses for row in records.values())
    assert records[6] == PlayoffRecord(team_id=6, wins=2, losses=0)
    assert records[5] == PlayoffRecord(team_id=5, wins=1, losses=1)
