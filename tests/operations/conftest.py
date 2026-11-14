import json
from datetime import date

import pytest

from freal.leagues.models import Season
from freal.operations.service import LeagueService
from freal.storage.leagues import LEAGUES_PARAMETER
from freal.storage.parameters import MemoryParameterStore
from tests.operations.fakes import LEAGUE_ID, FakeClock, FakeFetcher


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
def service(
    parameters: MemoryParameterStore, fetcher: FakeFetcher, clock: FakeClock
) -> LeagueService:
    return LeagueService(parameters, fetcher, today=lambda: date(2026, 11, 14), clock=clock)
