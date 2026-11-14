import logging
from datetime import date

import pytest
from pydantic import SecretStr

from freal.integrations.espn.client import EspnAuthError, EspnUnavailable
from freal.integrations.espn.credentials import EspnCredentials
from freal.leagues.errors import AccountNotFound, LeagueNotFound, SeasonNotFound
from freal.operations.service import LeagueService
from freal.storage.credentials import CredentialStore
from freal.storage.leagues import LeaguesNotConfigured
from freal.storage.parameters import MemoryParameterStore
from tests.operations.fakes import LEAGUE_ID, FakeClock, FakeFetcher

COOKIES = EspnCredentials(espn_s2=SecretStr("s2-value"), swid=SecretStr("{SWID}"))


def test_leagues_lists_each_configured_league_with_its_years(service: LeagueService) -> None:
    (summary,) = service.leagues()

    assert (summary.league_id, summary.name) == (LEAGUE_ID, "Family")
    assert summary.years == (2024, 2025, 2026)


def test_a_season_report_is_built_from_the_fetched_season(
    service: LeagueService, fetcher: FakeFetcher
) -> None:
    report = service.season_report(LEAGUE_ID, 2025)

    assert len(report.teams) == 8
    assert fetcher.calls == [(LEAGUE_ID, 2025, None)]


def test_an_unconfigured_league_is_not_found(service: LeagueService, fetcher: FakeFetcher) -> None:
    with pytest.raises(LeagueNotFound):
        service.season_report(999, 2025)

    assert fetcher.calls == []


@pytest.mark.parametrize("year", [2023, 2027, 2999])
def test_seasons_outside_the_leagues_life_never_reach_espn(
    service: LeagueService, fetcher: FakeFetcher, year: int
) -> None:
    with pytest.raises(SeasonNotFound):
        service.season_report(LEAGUE_ID, year)

    assert fetcher.calls == []


def test_in_january_the_season_that_started_last_fall_is_still_the_latest(
    parameters: MemoryParameterStore, fetcher: FakeFetcher
) -> None:
    service = LeagueService(parameters, fetcher, today=lambda: date(2027, 1, 15))

    assert service.leagues()[0].years == (2024, 2025, 2026)
    assert service.season_report(LEAGUE_ID, 2026).year == 2025
    with pytest.raises(SeasonNotFound):
        service.season_report(LEAGUE_ID, 2027)


def test_a_report_is_fetched_once_within_the_cache_window(
    service: LeagueService, fetcher: FakeFetcher, clock: FakeClock
) -> None:
    service.season_report(LEAGUE_ID, 2025)
    clock.now += 299
    service.season_report(LEAGUE_ID, 2025)
    assert len(fetcher.calls) == 1

    clock.now += 2
    service.season_report(LEAGUE_ID, 2025)
    assert len(fetcher.calls) == 2


def test_a_failed_fetch_is_not_cached(service: LeagueService, fetcher: FakeFetcher) -> None:
    fetcher.error = EspnUnavailable("down")
    with pytest.raises(EspnUnavailable):
        service.season_report(LEAGUE_ID, 2025)

    fetcher.error = None

    assert service.season_report(LEAGUE_ID, 2025).year == 2025


@pytest.mark.parametrize(
    "raised", [EspnAuthError("denied"), EspnUnavailable("down"), SeasonNotFound("missing")]
)
def test_espn_failures_reach_the_caller_unchanged(
    service: LeagueService, fetcher: FakeFetcher, raised: Exception
) -> None:
    fetcher.error = raised

    with pytest.raises(type(raised)):
        service.season_report(LEAGUE_ID, 2025)


def test_nothing_works_until_leagues_are_configured(fetcher: FakeFetcher) -> None:
    service = LeagueService(MemoryParameterStore(), fetcher)

    with pytest.raises(LeaguesNotConfigured):
        service.leagues()
    with pytest.raises(LeaguesNotConfigured):
        service.season_report(LEAGUE_ID, 2025)


def test_stored_cookies_are_used_by_later_fetches(
    service: LeagueService, fetcher: FakeFetcher, parameters: MemoryParameterStore
) -> None:
    service.connect("luke", COOKIES, "owner")

    saved = CredentialStore(parameters).load("luke")
    assert saved is not None
    assert saved.espn_s2.get_secret_value() == "s2-value"

    service.season_report(LEAGUE_ID, 2025)
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
