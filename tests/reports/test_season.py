import json

import pytest

from freal.leagues.models import Season
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


def test_a_season_with_no_completed_weeks_has_no_teams() -> None:
    report = build_season_report(season([]))

    assert report.teams == ()
    assert report.weeks == ()


def test_teams_without_games_are_left_out() -> None:
    games = season([matchup(1, side(1, 100), side(2, 90))], team_ids=(1, 2, 3))

    report = build_season_report(games)

    assert [team.team_id for team in report.teams] == [1, 2]
