import logging
import time
from collections.abc import Callable
from datetime import date

from freal.cache import TtlCache
from freal.integrations.espn.client import load_season
from freal.integrations.espn.credentials import EspnCredentials
from freal.leagues.config import LeagueConfig
from freal.leagues.errors import AccountNotFound, LeagueNotFound, SeasonNotFound
from freal.leagues.models import Season
from freal.leagues.seasons import latest_season
from freal.models import FrozenModel
from freal.reports.season import SeasonReport, build_season_report
from freal.storage.credentials import CredentialStore
from freal.storage.leagues import LeagueStore
from freal.storage.parameters import ParameterStore

logger = logging.getLogger(__name__)

SeasonFetcher = Callable[[int, int, EspnCredentials | None], Season]

REPORT_CACHE_SECONDS = 300
CONFIG_CACHE_SECONDS = 60


class LeagueSummary(FrozenModel):
    league_id: int
    name: str
    years: tuple[int, ...]


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
        self._fetch_season = fetch_season
        self._today = today
        self._configured = TtlCache[tuple[LeagueConfig, ...]](CONFIG_CACHE_SECONDS, clock)
        self._reports = TtlCache[SeasonReport](REPORT_CACHE_SECONDS, clock)

    def leagues(self) -> list[LeagueSummary]:
        latest = latest_season(self._today())
        return [
            LeagueSummary(
                league_id=league.league_id,
                name=league.name,
                years=league.years(latest),
            )
            for league in self._configured_leagues()
        ]

    def season_report(self, league_id: int, year: int) -> SeasonReport:
        league = self._league(league_id)
        if not league.first_year <= year <= latest_season(self._today()):
            raise SeasonNotFound(f"{league_id} {year}")
        return self._reports.get_or_compute(
            (league_id, year), lambda: self._build_report(league, year)
        )

    def connect(self, account: str, credentials: EspnCredentials, subject: str | None) -> None:
        if account not in {league.account for league in self._configured_leagues()}:
            raise AccountNotFound(account)
        self._credentials.save(account, credentials)
        logger.info("espn cookies updated for %s by %s", account, subject)

    def _configured_leagues(self) -> tuple[LeagueConfig, ...]:
        return self._configured.get_or_compute("leagues", self._leagues.load)

    def _league(self, league_id: int) -> LeagueConfig:
        for league in self._configured_leagues():
            if league.league_id == league_id:
                return league
        raise LeagueNotFound(str(league_id))

    def _build_report(self, league: LeagueConfig, year: int) -> SeasonReport:
        credentials = self._credentials.load(league.account)
        return build_season_report(self._fetch_season(league.league_id, year, credentials))
