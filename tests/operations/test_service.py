import logging
from datetime import date

import pytest
from pydantic import SecretStr

from freal.integrations.espn.client import EspnAuthError, EspnUnavailable
from freal.integrations.espn.credentials import EspnCredentials
from freal.leagues.access import Member
from freal.leagues.errors import AccountNotFound, LeagueNotFound, SeasonNotFound
from freal.operations.service import LeagueService
from freal.storage.credentials import CredentialStore
from freal.storage.leagues import LEAGUES_PARAMETER, LeaguesNotConfigured
from freal.storage.parameters import MemoryParameterStore
from tests.operations.fakes import ADMIN, LEAGUE_ID, MEMBER, STRANGER, FakeClock, FakeFetcher

COOKIES = EspnCredentials(espn_s2=SecretStr("s2-value"), swid=SecretStr("{SWID}"))


def test_leagues_lists_each_configured_league_with_its_years(service: LeagueService) -> None:
    (summary,) = service.leagues(ADMIN)

    assert (summary.league_id, summary.name) == (LEAGUE_ID, "Family")
    assert summary.years == (2024, 2025, 2026)


def test_a_season_report_is_built_from_the_fetched_season(
    service: LeagueService, fetcher: FakeFetcher
) -> None:
    report = service.season_report(LEAGUE_ID, 2025, ADMIN)

    assert len(report.teams) == 8
    assert fetcher.calls == [(LEAGUE_ID, 2025, None)]


def test_an_unconfigured_league_is_not_found(service: LeagueService, fetcher: FakeFetcher) -> None:
    with pytest.raises(LeagueNotFound):
        service.season_report(999, 2025, ADMIN)

    assert fetcher.calls == []


@pytest.mark.parametrize("year", [2023, 2027, 2999])
def test_seasons_outside_the_leagues_life_never_reach_espn(
    service: LeagueService, fetcher: FakeFetcher, year: int
) -> None:
    with pytest.raises(SeasonNotFound):
        service.season_report(LEAGUE_ID, year, ADMIN)

    assert fetcher.calls == []


def test_in_january_the_season_that_started_last_fall_is_still_the_latest(
    parameters: MemoryParameterStore, fetcher: FakeFetcher
) -> None:
    service = LeagueService(parameters, fetcher, today=lambda: date(2027, 1, 15))

    assert service.leagues(ADMIN)[0].years == (2024, 2025, 2026)
    assert service.season_report(LEAGUE_ID, 2026, ADMIN).year == 2025
    with pytest.raises(SeasonNotFound):
        service.season_report(LEAGUE_ID, 2027, ADMIN)


def test_a_report_is_fetched_once_within_the_cache_window(
    service: LeagueService, fetcher: FakeFetcher, clock: FakeClock
) -> None:
    service.season_report(LEAGUE_ID, 2025, ADMIN)
    clock.now += 299
    service.season_report(LEAGUE_ID, 2025, ADMIN)
    assert len(fetcher.calls) == 1

    clock.now += 2
    service.season_report(LEAGUE_ID, 2025, ADMIN)
    assert len(fetcher.calls) == 2


def test_a_failed_fetch_is_not_cached(service: LeagueService, fetcher: FakeFetcher) -> None:
    fetcher.error = EspnUnavailable("down")
    with pytest.raises(EspnUnavailable):
        service.season_report(LEAGUE_ID, 2025, ADMIN)

    fetcher.error = None

    assert service.season_report(LEAGUE_ID, 2025, ADMIN).year == 2025


@pytest.mark.parametrize(
    "raised", [EspnAuthError("denied"), EspnUnavailable("down"), SeasonNotFound("missing")]
)
def test_espn_failures_reach_the_caller_unchanged(
    service: LeagueService, fetcher: FakeFetcher, raised: Exception
) -> None:
    fetcher.error = raised

    with pytest.raises(type(raised)):
        service.season_report(LEAGUE_ID, 2025, ADMIN)


def test_nothing_works_until_leagues_are_configured(fetcher: FakeFetcher) -> None:
    service = LeagueService(MemoryParameterStore(), fetcher)

    with pytest.raises(LeaguesNotConfigured):
        service.leagues(ADMIN)
    with pytest.raises(LeaguesNotConfigured):
        service.season_report(LEAGUE_ID, 2025, ADMIN)


def test_stored_cookies_are_used_by_later_fetches(
    service: LeagueService, fetcher: FakeFetcher, parameters: MemoryParameterStore
) -> None:
    service.connect("luke", COOKIES, "owner")

    saved = CredentialStore(parameters).load("luke")
    assert saved is not None
    assert saved.espn_s2.get_secret_value() == "s2-value"

    service.season_report(LEAGUE_ID, 2025, ADMIN)
    used = fetcher.calls[0][2]
    assert used is not None
    assert used.swid.get_secret_value() == "{SWID}"


def test_cookies_cannot_be_stored_for_an_account_no_league_uses(
    service: LeagueService, parameters: MemoryParameterStore
) -> None:
    with pytest.raises(AccountNotFound):
        service.connect("../other", COOKIES, "owner")

    assert CredentialStore(parameters).load("../other") is None


def test_who_stored_the_cookies_is_logged_without_the_cookies(
    service: LeagueService, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="freal.operations.service"):
        service.connect("luke", COOKIES, "owner")

    assert "espn cookies updated for luke by owner" in caplog.text
    assert "s2-value" not in caplog.text


def test_a_member_sees_their_league_and_a_stranger_sees_none(service: LeagueService) -> None:
    assert [league.league_id for league in service.leagues(MEMBER)] == [LEAGUE_ID]
    assert service.leagues(STRANGER) == []


def test_a_stranger_cannot_read_a_season_even_when_it_is_cached(
    service: LeagueService, fetcher: FakeFetcher
) -> None:
    service.season_report(LEAGUE_ID, 2025, MEMBER)

    with pytest.raises(LeagueNotFound):
        service.season_report(LEAGUE_ID, 2025, STRANGER)

    assert len(fetcher.calls) == 1


def test_without_stored_access_only_admins_see_leagues(
    fetcher: FakeFetcher, parameters: MemoryParameterStore
) -> None:
    leagues_only = MemoryParameterStore(
        {LEAGUES_PARAMETER: parameters.get(LEAGUES_PARAMETER) or ""}
    )
    service = LeagueService(leagues_only, fetcher, today=lambda: date(2026, 11, 14))

    assert service.leagues(MEMBER) == []
    assert len(service.leagues(ADMIN)) == 1


def test_setting_members_takes_effect_on_the_next_request(service: LeagueService) -> None:
    service.leagues(STRANGER)

    service.set_members(LEAGUE_ID, (Member(sub="stranger", label="Sam"),), "admin")

    assert [league.league_id for league in service.leagues(STRANGER)] == [LEAGUE_ID]
    assert service.leagues(MEMBER) == []


def test_duplicate_members_are_stored_once(service: LeagueService) -> None:
    service.set_members(
        LEAGUE_ID, (Member(sub="a", label="One"), Member(sub="a", label="Two")), "admin"
    )

    (view,) = service.access()
    assert [member.sub for member in view.members] == ["a"]


def test_members_cannot_be_set_for_an_unknown_league(service: LeagueService) -> None:
    with pytest.raises(LeagueNotFound):
        service.set_members(999, (Member(sub="a", label=""),), "admin")


def test_who_changed_a_leagues_members_is_logged(
    service: LeagueService, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="freal.operations.service"):
        service.set_members(LEAGUE_ID, (Member(sub="a", label="One"),), "admin")

    assert f"league {LEAGUE_ID} access set to 1 members by admin" in caplog.text
