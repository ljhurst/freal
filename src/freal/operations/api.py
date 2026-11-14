import logging
import time
from collections.abc import Callable
from datetime import date
from typing import Annotated

from fastapi import Depends, FastAPI, Header, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, SecretStr

from freal.cache import TtlCache
from freal.integrations.espn.client import (
    EspnAuthError,
    EspnCredentials,
    EspnUnavailable,
    SeasonNotFound,
    load_season,
)
from freal.leagues.config import LEAGUES_PARAMETER, LeagueConfig, latest_season, parse_leagues
from freal.leagues.models import Season
from freal.models import FrozenModel
from freal.operations.auth import VerifiedToken
from freal.reports.season import SeasonReport, build_season_report
from freal.storage.credentials import CredentialStore
from freal.storage.parameters import ParameterStore

logger = logging.getLogger(__name__)

SeasonFetcher = Callable[[int, int, EspnCredentials | None], Season]
TokenValidator = Callable[[str], VerifiedToken | None]

READ_SCOPE = "freal:read"
CONNECT_SCOPE = "freal:connect"

ALLOWED_ORIGINS = (
    r"^(https://(freal|freal-pr-\d+\.preview)\.bylukehurst\.com|http://localhost(:\d+)?)$"
)
REPORT_CACHE_SECONDS = 300
CONFIG_CACHE_SECONDS = 60


class LeagueSummary(FrozenModel):
    league_id: int
    name: str
    years: tuple[int, ...]


class ConnectRequest(BaseModel):
    account: str
    espn_s2: SecretStr
    swid: SecretStr


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, headers: dict[str, str] | None = None) -> None:
        super().__init__(code)
        self.status_code = status_code
        self.code = code
        self.headers = headers


def create_app(
    parameters: ParameterStore,
    validate_token: TokenValidator,
    fetch_season: SeasonFetcher = load_season,
    today: Callable[[], date] = date.today,
    clock: Callable[[], float] = time.monotonic,
) -> FastAPI:
    service = _Service(parameters, fetch_season, today, clock)
    app = FastAPI(title="freal", docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=ALLOWED_ORIGINS,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.exception_handler(ApiError)
    def handle_api_error(_: Request, error: ApiError) -> JSONResponse:
        return JSONResponse(
            {"error": error.code}, status_code=error.status_code, headers=error.headers
        )

    def require_scope(scope: str) -> Callable[[str | None], VerifiedToken]:
        def check(authorization: Annotated[str | None, Header()] = None) -> VerifiedToken:
            token = _bearer_token(authorization)
            verified = validate_token(token) if token else None
            if verified is None:
                raise ApiError(401, "invalid_token", {"WWW-Authenticate": "Bearer"})
            if scope not in verified.scopes:
                raise ApiError(403, "insufficient_scope")
            return verified

        return check

    @app.get("/leagues", dependencies=[Depends(require_scope(READ_SCOPE))])
    def leagues() -> list[LeagueSummary]:
        return service.leagues()

    @app.get(
        "/leagues/{league_id}/seasons/{year}", dependencies=[Depends(require_scope(READ_SCOPE))]
    )
    def season(league_id: int, year: int) -> SeasonReport:
        return service.season_report(league_id, year)

    @app.post("/connect", status_code=204)
    def connect(
        request: ConnectRequest,
        token: Annotated[VerifiedToken, Depends(require_scope(CONNECT_SCOPE))],
    ) -> Response:
        service.connect(request, token)
        return Response(status_code=204)

    return app


class _Service:
    def __init__(
        self,
        parameters: ParameterStore,
        fetch_season: SeasonFetcher,
        today: Callable[[], date],
        clock: Callable[[], float],
    ) -> None:
        self._parameters = parameters
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
            raise ApiError(404, "season_not_found")
        return self._reports.get_or_compute(
            (league_id, year), lambda: self._build_report(league, year)
        )

    def connect(self, request: ConnectRequest, token: VerifiedToken) -> None:
        if request.account not in {league.account for league in self._configured_leagues()}:
            raise ApiError(404, "account_not_found")
        self._credentials.save(
            request.account,
            EspnCredentials(espn_s2=request.espn_s2, swid=request.swid),
        )
        logger.info("espn cookies updated for %s by %s", request.account, token.subject)

    def _configured_leagues(self) -> tuple[LeagueConfig, ...]:
        return self._configured.get_or_compute("leagues", self._read_leagues)

    def _read_leagues(self) -> tuple[LeagueConfig, ...]:
        raw = self._parameters.get(LEAGUES_PARAMETER)
        if raw is None:
            raise ApiError(503, "not_configured")
        return parse_leagues(raw)

    def _league(self, league_id: int) -> LeagueConfig:
        for league in self._configured_leagues():
            if league.league_id == league_id:
                return league
        raise ApiError(404, "league_not_found")

    def _build_report(self, league: LeagueConfig, year: int) -> SeasonReport:
        credentials = self._credentials.load(league.account)
        try:
            season = self._fetch_season(league.league_id, year, credentials)
        except EspnAuthError as error:
            raise ApiError(502, "espn_auth_expired") from error
        except SeasonNotFound as error:
            raise ApiError(404, "season_not_found") from error
        except EspnUnavailable as error:
            raise ApiError(502, "espn_unavailable") from error
        return build_season_report(season)


def _bearer_token(authorization: str | None) -> str | None:
    scheme, _, token = (authorization or "").partition(" ")
    return token.strip() if scheme.lower() == "bearer" and token.strip() else None
