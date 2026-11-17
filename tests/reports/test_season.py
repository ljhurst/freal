import json

import pytest

from freal.leagues.models import MatchupKind, Season
from freal.metrics.rating import Rating
from freal.metrics.verdict import Stamp, Strength, Verdict
from freal.reports.season import SeasonReport, build_season_report
from tests.factories import matchup, season, side


def test_every_team_appears_once_with_all_of_its_metrics(season_2025: Season) -> None:
    report = build_season_report(season_2025)

    assert sorted(team.team_id for team in report.teams) == list(range(1, 9))
    assert len(report.weeks) == 14 * 8
    for team in report.teams:
        assert (
            team.standing.team_id
            == team.luck.team_id
            == team.schedule.team_id
            == team.efficiency.team_id
            == team.consistency.team_id
            == team.team_id
        )


def test_the_report_json_has_derived_values_and_no_owner_information(season_2025: Season) -> None:
    report = build_season_report(season_2025)

    payload = json.loads(report.model_dump_json())
    first = payload["teams"][0]

    assert first["luck"]["luck"] == pytest.approx(report.teams[0].luck.luck)
    assert "efficiency" in first["efficiency"]
    assert "owner" not in report.model_dump_json().lower()
    assert SeasonReport.model_validate_json(report.model_dump_json()) == report


def test_the_final_rank_is_passed_through_to_the_report(season_2025: Season) -> None:
    teams = tuple(
        team.model_copy(update={"final_rank": 1 if team.team_id == 3 else None})
        for team in season_2025.teams
    )

    report = build_season_report(season_2025.model_copy(update={"teams": teams}))

    assert {team.team_id: team.final_rank for team in report.teams} == {
        team_id: 1 if team_id == 3 else None for team_id in range(1, 9)
    }


def test_playoff_records_reach_only_the_teams_that_played(season_2025: Season) -> None:
    report = build_season_report(season_2025)

    records = {team.team_id: team.playoffs for team in report.teams}

    assert records[6] is not None
    assert (records[6].wins, records[6].losses) == (2, 0)
    assert [team_id for team_id, record in records.items() if record is None] == [1, 3, 7, 8]


def test_a_team_without_playoff_games_has_no_record() -> None:
    report = build_season_report(
        season(
            [
                matchup(1, side(1, 100), side(2, 90)),
                matchup(15, side(1, 120), side(2, 110), kind=MatchupKind.PLAYOFF),
            ],
            team_ids=(1, 2),
        )
    )

    assert [(t.team_id, t.playoffs and t.playoffs.wins) for t in report.teams] == [(1, 1), (2, 0)]


def test_the_for_real_stamp_goes_to_the_teams_rated_likely_threats(season_2025: Season) -> None:
    report = build_season_report(season_2025)

    assert {team.team_id for team in report.teams if team.stamp is Stamp.FOR_REAL} == {5, 6}
    assert sum(team.rating.contender_probability for team in report.teams) == pytest.approx(2.0)


def _with_ratings(
    season_: Season, monkeypatch: pytest.MonkeyPatch, contender: dict[int, float], points: float
) -> None:
    def rated(_: Season) -> tuple[Rating, ...]:
        return tuple(
            Rating(
                team_id=team.team_id,
                points_above_average=points,
                contender_probability=contender.get(team.team_id, 0.1),
                bottom_probability=0.1,
            )
            for team in season_.teams
        )

    monkeypatch.setattr("freal.reports.season.rate_teams", rated)


def test_a_team_with_a_real_shot_is_in_the_hunt_and_scores_good(
    season_2025: Season, monkeypatch: pytest.MonkeyPatch
) -> None:
    _with_ratings(season_2025, monkeypatch, {2: 0.4}, points=3.0)

    team = next(t for t in build_season_report(season_2025).teams if t.team_id == 2)

    assert team.stamp is Stamp.IN_THE_HUNT
    assert team.strength is Strength.GOOD


def test_a_lucky_winning_team_with_weak_scoring_is_a_fraud_and_keeps_its_lucky_verdict(
    season_2025: Season, monkeypatch: pytest.MonkeyPatch
) -> None:
    _with_ratings(season_2025, monkeypatch, {}, points=-2.0)

    team = next(t for t in build_season_report(season_2025).teams if t.team_id == 4)

    assert (team.verdict, team.stamp) == (Verdict.LUCKY, Stamp.FRAUD)


def test_a_season_with_no_completed_weeks_has_no_teams() -> None:
    report = build_season_report(season([]))

    assert report.teams == ()
    assert report.weeks == ()


def test_teams_without_games_are_left_out() -> None:
    games = season([matchup(1, side(1, 100), side(2, 90))], team_ids=(1, 2, 3))

    report = build_season_report(games)

    assert [team.team_id for team in report.teams] == [1, 2]


def test_each_team_gets_a_verdict_from_its_luck(season_2025: Season) -> None:
    report = build_season_report(season_2025)

    verdicts = {team.team_id: team.verdict for team in report.teams}

    assert verdicts == {
        5: Verdict.LUCKY,
        4: Verdict.LUCKY,
        6: Verdict.UNLUCKY,
        8: Verdict.UNLUCKY,
        1: Verdict.AS_EXPECTED,
        2: Verdict.AS_EXPECTED,
        3: Verdict.AS_EXPECTED,
        7: Verdict.AS_EXPECTED,
    }


def test_the_verdict_is_published_as_a_plain_word(season_2025: Season) -> None:
    payload = json.loads(build_season_report(season_2025).model_dump_json())

    assert {team["verdict"] for team in payload["teams"]} == {"lucky", "unlucky", "as_expected"}


def test_the_strength_word_follows_the_rating(season_2025: Season) -> None:
    report = build_season_report(season_2025)

    assert {team.team_id: team.strength for team in report.teams} == {
        5: Strength.GOOD,
        6: Strength.GOOD,
        4: Strength.AVERAGE,
        2: Strength.AVERAGE,
        1: Strength.AVERAGE,
        7: Strength.AVERAGE,
        8: Strength.BAD,
        3: Strength.BAD,
    }
