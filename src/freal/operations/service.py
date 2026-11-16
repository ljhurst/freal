import logging
import time
from collections.abc import Callable
from datetime import date

from freal.cache import TtlCache
from freal.integrations.espn.client import load_season
from freal.integrations.espn.credentials import EspnCredentials
from freal.leagues.access import Caller, LeagueAccess, Member, can_see
from freal.leagues.config import LeagueConfig
from freal.leagues.errors import AccountNotFound, LeagueNotFound, SeasonNotFound
from freal.leagues.models import Season
from freal.leagues.seasons import latest_season
from freal.models import FrozenModel
from freal.reports.season import SeasonReport, build_season_report
from freal.storage.access import AccessStore
from freal.storage.credentials import CredentialStore
from freal.storage.leagues import LeagueStore
from freal.storage.parameters import ParameterStore

logger = logging.getLogger(__name__)

SeasonFetcher = Callable[[int, int, EspnCredentials | None], Season]

REPORT_CACHE_SECONDS = 300
CONFIG_CACHE_SECONDS = 60
ACCESS_CACHE_KEY = "access"


class LeagueSummary(FrozenModel):
    league_id: int
    name: str
    years: tuple[int, ...]


class LeagueAccessView(FrozenModel):
    league_id: int
    name: str
    members: tuple[Member, ...]


class LeagueService:
    def __init__(
        self,
        parameters: ParameterStore,
        fetch_season: SeasonFetcher = load_season,
        today: Callable[[], date] = date.today,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._leagues = LeagueStore(parameters)
        self._credentials = CredentialStore(parameters)
        self._access_store = AccessStore(parameters)
        self._fetch_season = fetch_season
        self._today = today
        self._configured = TtlCache[tuple[LeagueConfig, ...]](CONFIG_CACHE_SECONDS, clock)
        self._access = TtlCache[tuple[LeagueAccess, ...]](CONFIG_CACHE_SECONDS, clock)
        self._reports = TtlCache[SeasonReport](REPORT_CACHE_SECONDS, clock)

    def leagues(self, caller: Caller) -> list[LeagueSummary]:
        latest = latest_season(self._today())
        return [
            LeagueSummary(
                league_id=league.league_id,
                name=league.name,
                years=league.years(latest),
            )
            for league in self._configured_leagues()
            if can_see(self._league_access(), caller, league.league_id)
        ]

    def season_report(self, league_id: int, year: int, caller: Caller) -> SeasonReport:
        league = self._league(league_id)
        if not can_see(self._league_access(), caller, league_id):
            raise LeagueNotFound(str(league_id))
        if not league.first_year <= year <= latest_season(self._today()):
            raise SeasonNotFound(f"{league_id} {year}")
        return self._reports.get_or_compute(
            (league_id, year), lambda: self._build_report(league, year)
        )

    def access(self) -> list[LeagueAccessView]:
        entries = {entry.league_id: entry.members for entry in self._league_access()}
        return [
            LeagueAccessView(
                league_id=league.league_id,
                name=league.name,
                members=entries.get(league.league_id, ()),
            )
            for league in self._configured_leagues()
        ]

    def set_members(self, league_id: int, members: tuple[Member, ...], subject: str | None) -> None:
        self._league(league_id)
        unique = tuple({member.sub: member for member in members}.values())
        others = tuple(entry for entry in self._league_access() if entry.league_id != league_id)
        self._access_store.save((*others, LeagueAccess(league_id=league_id, members=unique)))
        self._access.invalidate(ACCESS_CACHE_KEY)
        logger.info("league %s access set to %d members by %s", league_id, len(unique), subject)

    def connect(self, account: str, credentials: EspnCredentials, subject: str | None) -> None:
        if account not in {league.account for league in self._configured_leagues()}:
            raise AccountNotFound(account)
        self._credentials.save(account, credentials)
        logger.info("espn cookies updated for %s by %s", account, subject)

    def _configured_leagues(self) -> tuple[LeagueConfig, ...]:
        return self._configured.get_or_compute("leagues", self._leagues.load)

    def _league_access(self) -> tuple[LeagueAccess, ...]:
        return self._access.get_or_compute(ACCESS_CACHE_KEY, self._access_store.load)

    def _league(self, league_id: int) -> LeagueConfig:
        for league in self._configured_leagues():
            if league.league_id == league_id:
                return league
        raise LeagueNotFound(str(league_id))

    def _build_report(self, league: LeagueConfig, year: int) -> SeasonReport:
        credentials = self._credentials.load(league.account)
        return build_season_report(self._fetch_season(league.league_id, year, credentials))
