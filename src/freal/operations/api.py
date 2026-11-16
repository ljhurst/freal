import logging
import time
from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, FastAPI, Header, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, SecretStr

from freal.integrations.espn.client import EspnAuthError, EspnUnavailable
from freal.integrations.espn.credentials import EspnCredentials
from freal.integrations.lasso.tokens import VerifiedToken
from freal.leagues.errors import AccountNotFound, LeagueNotFound, SeasonNotFound
from freal.operations.service import LeagueService, LeagueSummary
from freal.operations.version import app_version
from freal.reports.season import SeasonReport
from freal.storage.leagues import LeaguesNotConfigured

logger = logging.getLogger(__name__)

TokenValidator = Callable[[str], VerifiedToken | None]

READ_SCOPE = "freal:read"
CONNECT_SCOPE = "freal:connect"

ALLOWED_ORIGINS = (
    r"^(https://(freal|freal-pr-\d+\.preview)\.bylukehurst\.com|http://localhost(:\d+)?)$"
)

ERROR_RESPONSES: dict[type[Exception], tuple[int, str]] = {
    LeagueNotFound: (404, "league_not_found"),
    SeasonNotFound: (404, "season_not_found"),
    AccountNotFound: (404, "account_not_found"),
    LeaguesNotConfigured: (503, "not_configured"),
    EspnAuthError: (502, "espn_auth_expired"),
    EspnUnavailable: (502, "espn_unavailable"),
}


class ConnectRequest(BaseModel):
    account: str
    espn_s2: SecretStr
    swid: SecretStr


class VersionInfo(BaseModel):
    version: str


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, headers: dict[str, str] | None = None) -> None:
        super().__init__(code)
        self.status_code = status_code
        self.code = code
        self.headers = headers


def create_app(service: LeagueService, validate_token: TokenValidator) -> FastAPI:
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

    for error_type, (status_code, code) in ERROR_RESPONSES.items():
        app.add_exception_handler(error_type, _error_response(status_code, code))

    @app.middleware("http")
    async def log_request(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:  # noqa: BLE001 - last boundary: log once, answer in the API's error shape
            response = JSONResponse({"error": "internal_error"}, status_code=500)
            _log_request(request, response, started, failed=True)
            return response
        _log_request(request, response, started, failed=False)
        return response

    def require_scope(scope: str) -> Callable[[Request, str | None], VerifiedToken]:
        def check(
            request: Request, authorization: Annotated[str | None, Header()] = None
        ) -> VerifiedToken:
            token = _bearer_token(authorization)
            verified = validate_token(token) if token else None
            if verified is None:
                raise ApiError(401, "invalid_token", {"WWW-Authenticate": "Bearer"})
            request.state.subject = verified.subject
            if scope not in verified.scopes:
                raise ApiError(403, "insufficient_scope")
            return verified

        return check

    @app.get("/version", dependencies=[Depends(require_scope(READ_SCOPE))])
    def version() -> VersionInfo:
        return VersionInfo(version=app_version())

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
        credentials = EspnCredentials(espn_s2=request.espn_s2, swid=request.swid)
        service.connect(request.account, credentials, token.subject)
        return Response(status_code=204)

    return app


def _error_response(status_code: int, code: str) -> Callable[[Request, Exception], JSONResponse]:
    def respond(_: Request, __: Exception) -> JSONResponse:
        return JSONResponse({"error": code}, status_code=status_code)

    return respond


def _bearer_token(authorization: str | None) -> str | None:
    scheme, _, token = (authorization or "").partition(" ")
    return token.strip() if scheme.lower() == "bearer" and token.strip() else None


def _route_template(request: Request) -> str:
    route = request.scope.get("route")
    return getattr(route, "path", "unmatched")


def _log_request(request: Request, response: Response, started: float, *, failed: bool) -> None:
    if failed:
        level = logging.ERROR
    elif response.status_code >= 500:
        level = logging.WARNING
    else:
        level = logging.INFO
    logger.log(
        level,
        "request",
        exc_info=failed,
        extra={
            "subject": getattr(request.state, "subject", None),
            "method": request.method,
            "route": _route_template(request),
            "status": response.status_code,
            "duration_ms": round((time.perf_counter() - started) * 1000),
        },
    )
