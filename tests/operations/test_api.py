import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from freal.integrations.espn.client import EspnAuthError, EspnUnavailable
from freal.integrations.lasso.tokens import VerifiedToken
from freal.leagues.errors import SeasonNotFound
from freal.operations.api import create_app
from freal.operations.service import LeagueService
from freal.operations.version import app_version
from freal.storage.credentials import CredentialStore
from freal.storage.parameters import MemoryParameterStore
from tests.operations.fakes import LEAGUE_ID, FakeFetcher

FREAL_ORIGIN = "https://freal.bylukehurst.com"

TOKENS = {
    "reader": VerifiedToken(subject="reader", scopes=("freal:read",)),
    "connector": VerifiedToken(subject="owner", scopes=("freal:connect",)),
}
READER = {"Authorization": "Bearer reader"}
CONNECTOR = {"Authorization": "Bearer connector"}


@pytest.fixture
def app(service: LeagueService) -> FastAPI:
    return create_app(service, TOKENS.get)


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


def test_a_season_report_is_returned_with_its_derived_values(client: TestClient) -> None:
    response = client.get(f"/leagues/{LEAGUE_ID}/seasons/2025")

    body = response.json()
    assert response.status_code == 200
    assert len(body["teams"]) == 8
    assert "efficiency" in body["teams"][0]["efficiency"]
    assert "luck" in body["teams"][0]["luck"]


def test_an_unconfigured_league_is_not_found(client: TestClient) -> None:
    response = client.get("/leagues/999/seasons/2025")

    assert (response.status_code, response.json()) == (404, {"error": "league_not_found"})


def test_a_year_outside_the_leagues_life_is_not_found(client: TestClient) -> None:
    response = client.get(f"/leagues/{LEAGUE_ID}/seasons/2023")

    assert (response.status_code, response.json()) == (404, {"error": "season_not_found"})


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


def test_the_api_reports_when_no_leagues_are_configured(fetcher: FakeFetcher) -> None:
    app = create_app(LeagueService(MemoryParameterStore(), fetcher), TOKENS.get)

    response = TestClient(app, headers=READER).get("/leagues")

    assert (response.status_code, response.json()) == (503, {"error": "not_configured"})


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("GET", "/leagues"),
        ("GET", f"/leagues/{LEAGUE_ID}/seasons/2025"),
        ("GET", "/version"),
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


def test_the_version_route_reports_the_deployed_api_version(client: TestClient) -> None:
    response = client.get("/version")

    assert response.status_code == 200
    assert response.json() == {"version": app_version()}


def test_reading_needs_the_read_scope(anonymous: TestClient, fetcher: FakeFetcher) -> None:
    response = anonymous.get("/leagues", headers=CONNECTOR)

    assert (response.status_code, response.json()) == (403, {"error": "insufficient_scope"})
    assert fetcher.calls == []


def test_connecting_stores_the_cookies(
    client: TestClient, parameters: MemoryParameterStore
) -> None:
    response = client.post("/connect", json=_connect_body(), headers=CONNECTOR)

    assert response.status_code == 204
    saved = CredentialStore(parameters).load("luke")
    assert saved is not None
    assert saved.swid.get_secret_value() == "{SWID}"


def test_connecting_needs_the_connect_scope(
    client: TestClient, parameters: MemoryParameterStore
) -> None:
    response = client.post("/connect", json=_connect_body())

    assert (response.status_code, response.json()) == (403, {"error": "insufficient_scope"})
    assert CredentialStore(parameters).load("luke") is None


def test_cookies_cannot_be_stored_for_an_account_no_league_uses(client: TestClient) -> None:
    response = client.post("/connect", json=_connect_body(account="../other"), headers=CONNECTOR)

    assert (response.status_code, response.json()) == (404, {"error": "account_not_found"})


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
