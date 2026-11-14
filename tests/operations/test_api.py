import json
import logging
from datetime import date

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from freal.integrations.espn.client import EspnAuthError, EspnUnavailable, SeasonNotFound
from freal.integrations.espn.credentials import EspnCredentials
from freal.integrations.lasso.tokens import VerifiedToken
from freal.leagues.config import LEAGUES_PARAMETER
from freal.leagues.models import Season
from freal.operations.api import create_app
from freal.storage.credentials import CredentialStore
from freal.storage.parameters import MemoryParameterStore

LEAGUE_ID = 7
FREAL_ORIGIN = "https://freal.bylukehurst.com"

TOKENS = {
    "reader": VerifiedToken(subject="reader", scopes=("freal:read",)),
    "connector": VerifiedToken(subject="owner", scopes=("freal:connect",)),
}
READER = {"Authorization": "Bearer reader"}
CONNECTOR = {"Authorization": "Bearer connector"}


class FakeFetcher:
    def __init__(self, season: Season) -> None:
        self.season = season
        self.error: Exception | None = None
        self.calls: list[tuple[int, int, EspnCredentials | None]] = []

    def __call__(self, league_id: int, year: int, credentials: EspnCredentials | None) -> Season:
        self.calls.append((league_id, year, credentials))
        if self.error is not None:
            raise self.error
        return self.season


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


@pytest.fixture
def parameters() -> MemoryParameterStore:
    leagues = [{"league_id": LEAGUE_ID, "name": "Family", "account": "luke", "first_year": 2024}]
    return MemoryParameterStore({LEAGUES_PARAMETER: json.dumps(leagues)})


@pytest.fixture
def fetcher(season_2025: Season) -> FakeFetcher:
    return FakeFetcher(season_2025)


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def app(parameters: MemoryParameterStore, fetcher: FakeFetcher, clock: FakeClock) -> FastAPI:
    return create_app(
        parameters,
        TOKENS.get,
        fetcher,
        today=lambda: date(2026, 11, 14),
        clock=clock,
    )


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app, headers=READER)


@pytest.fixture
def anonymous(app: FastAPI) -> TestClient:
    return TestClient(app)


def test_leagues_lists_each_configured_league_with_its_years(client: TestClient) -> None:
    response = client.get("/leagues")

    assert response.status_code == 200
    assert response.json() == [
        {"league_id": LEAGUE_ID, "name": "Family", "years": [2024, 2025, 2026]}
    ]


def test_a_season_report_is_built_from_the_fetched_season(
    client: TestClient, fetcher: FakeFetcher
) -> None:
    response = client.get(f"/leagues/{LEAGUE_ID}/seasons/2025")

    body = response.json()
    assert response.status_code == 200
    assert len(body["teams"]) == 8
    assert "efficiency" in body["teams"][0]["efficiency"]
    assert fetcher.calls == [(LEAGUE_ID, 2025, None)]


def test_an_unconfigured_league_is_not_found(client: TestClient, fetcher: FakeFetcher) -> None:
    response = client.get("/leagues/999/seasons/2025")

    assert (response.status_code, response.json()) == (404, {"error": "league_not_found"})
    assert fetcher.calls == []


def test_a_year_before_the_league_began_never_reaches_espn(
    client: TestClient, fetcher: FakeFetcher
) -> None:
    response = client.get(f"/leagues/{LEAGUE_ID}/seasons/2023")

    assert (response.status_code, response.json()) == (404, {"error": "season_not_found"})
    assert fetcher.calls == []


def test_in_january_the_season_that_started_last_fall_is_still_the_latest(
    parameters: MemoryParameterStore, fetcher: FakeFetcher
) -> None:
    app = create_app(parameters, TOKENS.get, fetcher, today=lambda: date(2027, 1, 15))
    client = TestClient(app, headers=READER)

    assert client.get("/leagues").json()[0]["years"] == [2024, 2025, 2026]
    assert client.get(f"/leagues/{LEAGUE_ID}/seasons/2026").status_code == 200
    assert client.get(f"/leagues/{LEAGUE_ID}/seasons/2027").status_code == 404


@pytest.mark.parametrize("year", [2027, 2999])
def test_seasons_that_cannot_exist_yet_never_reach_espn(
    client: TestClient, fetcher: FakeFetcher, year: int
) -> None:
    response = client.get(f"/leagues/{LEAGUE_ID}/seasons/{year}")

    assert (response.status_code, response.json()) == (404, {"error": "season_not_found"})
    assert fetcher.calls == []


@pytest.mark.parametrize(
    ("raised", "status", "code"),
    [
        (EspnAuthError("denied"), 502, "espn_auth_expired"),
        (SeasonNotFound("missing"), 404, "season_not_found"),
        (EspnUnavailable("down"), 502, "espn_unavailable"),
    ],
)
def test_espn_failures_become_errors_the_dashboard_can_act_on(
    client: TestClient, fetcher: FakeFetcher, raised: Exception, status: int, code: str
) -> None:
    fetcher.error = raised

    response = client.get(f"/leagues/{LEAGUE_ID}/seasons/2025")

    assert (response.status_code, response.json()) == (status, {"error": code})


def test_a_report_is_fetched_once_within_the_cache_window(
    client: TestClient, fetcher: FakeFetcher, clock: FakeClock
) -> None:
    client.get(f"/leagues/{LEAGUE_ID}/seasons/2025")
    clock.now += 299
    client.get(f"/leagues/{LEAGUE_ID}/seasons/2025")
    assert len(fetcher.calls) == 1

    clock.now += 2
    client.get(f"/leagues/{LEAGUE_ID}/seasons/2025")
    assert len(fetcher.calls) == 2


def test_a_failed_fetch_is_not_cached(client: TestClient, fetcher: FakeFetcher) -> None:
    fetcher.error = EspnUnavailable("down")
    assert client.get(f"/leagues/{LEAGUE_ID}/seasons/2025").status_code == 502

    fetcher.error = None

    assert client.get(f"/leagues/{LEAGUE_ID}/seasons/2025").status_code == 200


def test_the_api_reports_when_no_leagues_are_configured(fetcher: FakeFetcher) -> None:
    app = create_app(MemoryParameterStore(), TOKENS.get, fetcher)

    response = TestClient(app, headers=READER).get("/leagues")

    assert (response.status_code, response.json()) == (503, {"error": "not_configured"})


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("GET", "/leagues"),
        ("GET", f"/leagues/{LEAGUE_ID}/seasons/2025"),
        ("POST", "/connect"),
    ],
)
@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Basic cmVhZGVy"}, {"Authorization": "Bearer unknown"}],
    ids=["no header", "wrong scheme", "unknown token"],
)
def test_every_route_refuses_requests_without_a_valid_token(
    anonymous: TestClient,
    fetcher: FakeFetcher,
    parameters: MemoryParameterStore,
    method: str,
    path: str,
    headers: dict[str, str],
) -> None:
    response = anonymous.request(method, path, headers=headers, json=_connect_body())

    assert (response.status_code, response.json()) == (401, {"error": "invalid_token"})
    assert response.headers["www-authenticate"] == "Bearer"
    assert fetcher.calls == []
    assert CredentialStore(parameters).load("luke") is None


def test_reading_needs_the_read_scope(anonymous: TestClient, fetcher: FakeFetcher) -> None:
    response = anonymous.get("/leagues", headers=CONNECTOR)

    assert (response.status_code, response.json()) == (403, {"error": "insufficient_scope"})
    assert fetcher.calls == []


def test_connecting_stores_cookies_that_later_fetches_use(
    client: TestClient, fetcher: FakeFetcher, parameters: MemoryParameterStore
) -> None:
    response = client.post("/connect", json=_connect_body(), headers=CONNECTOR)

    assert response.status_code == 204
    saved = CredentialStore(parameters).load("luke")
    assert saved is not None
    assert saved.espn_s2.get_secret_value() == "s2-value"

    client.get(f"/leagues/{LEAGUE_ID}/seasons/2025")
    used = fetcher.calls[0][2]
    assert used is not None
    assert used.swid.get_secret_value() == "{SWID}"


def test_who_stored_the_cookies_is_logged(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="freal.operations.api"):
        client.post("/connect", json=_connect_body(), headers=CONNECTOR)

    assert "espn cookies updated for luke by owner" in caplog.text
    assert "s2-value" not in caplog.text


def test_connecting_needs_the_connect_scope(
    client: TestClient, parameters: MemoryParameterStore
) -> None:
    response = client.post("/connect", json=_connect_body())

    assert (response.status_code, response.json()) == (403, {"error": "insufficient_scope"})
    assert CredentialStore(parameters).load("luke") is None


def test_cookies_cannot_be_stored_for_an_account_no_league_uses(
    client: TestClient, parameters: MemoryParameterStore
) -> None:
    response = client.post("/connect", json=_connect_body(account="../other"), headers=CONNECTOR)

    assert (response.status_code, response.json()) == (404, {"error": "account_not_found"})
    assert CredentialStore(parameters).load("../other") is None


@pytest.mark.parametrize(
    "origin",
    [FREAL_ORIGIN, "https://freal-pr-12.preview.bylukehurst.com", "http://localhost:4321"],
)
def test_the_dashboard_origins_may_call_the_api_with_a_token(
    anonymous: TestClient, origin: str
) -> None:
    response = anonymous.options(
        "/leagues",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


@pytest.mark.parametrize(
    "origin", ["https://evil.example", "https://freal.bylukehurst.com.evil.example"]
)
def test_other_origins_are_not_allowed(anonymous: TestClient, origin: str) -> None:
    response = anonymous.options(
        "/leagues",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )

    assert "access-control-allow-origin" not in response.headers


def _connect_body(account: str = "luke") -> dict[str, str]:
    return {"account": account, "espn_s2": "s2-value", "swid": "{SWID}"}
