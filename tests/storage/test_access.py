from freal.leagues.access import LeagueAccess, Member
from freal.storage.access import ACCESS_PARAMETER, AccessStore
from freal.storage.parameters import MemoryParameterStore


def test_saved_access_is_loaded_back() -> None:
    store = AccessStore(MemoryParameterStore())
    access = (LeagueAccess(league_id=7, members=(Member(sub="dana", label="Dana"),)),)

    store.save(access)

    assert store.load() == access


def test_loading_without_stored_access_gives_nothing() -> None:
    assert AccessStore(MemoryParameterStore()).load() == ()


def test_access_is_stored_under_its_own_parameter() -> None:
    parameters = MemoryParameterStore()

    AccessStore(parameters).save(())

    assert parameters.get(ACCESS_PARAMETER) == "[]"
