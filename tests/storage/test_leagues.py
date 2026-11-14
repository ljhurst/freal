import pytest
from pydantic import ValidationError

from freal.storage.leagues import LEAGUES_PARAMETER, LeaguesNotConfigured, LeagueStore
from freal.storage.parameters import MemoryParameterStore


def test_the_stored_leagues_are_loaded() -> None:
    raw = '[{"league_id": 7, "name": "Family", "account": "luke", "first_year": 2024}]'
    store = LeagueStore(MemoryParameterStore({LEAGUES_PARAMETER: raw}))

    (league,) = store.load()

    assert (league.league_id, league.name, league.account) == (7, "Family", "luke")


def test_loading_without_stored_leagues_says_so() -> None:
    with pytest.raises(LeaguesNotConfigured):
        LeagueStore(MemoryParameterStore()).load()


def test_malformed_league_config_is_rejected() -> None:
    store = LeagueStore(MemoryParameterStore({LEAGUES_PARAMETER: '[{"league_id": "x"}]'}))

    with pytest.raises(ValidationError):
        store.load()
