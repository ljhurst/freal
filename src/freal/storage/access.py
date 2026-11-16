from pydantic import TypeAdapter

from freal.leagues.access import LeagueAccess
from freal.storage.parameters import ParameterStore

ACCESS_PARAMETER = "/freal/access"

_ACCESS = TypeAdapter(tuple[LeagueAccess, ...])


class AccessStore:
    def __init__(self, parameters: ParameterStore) -> None:
        self._parameters = parameters

    def load(self) -> tuple[LeagueAccess, ...]:
        raw = self._parameters.get(ACCESS_PARAMETER)
        return _ACCESS.validate_json(raw) if raw else ()

    def save(self, access: tuple[LeagueAccess, ...]) -> None:
        self._parameters.put_secret(ACCESS_PARAMETER, _ACCESS.dump_json(access).decode())
