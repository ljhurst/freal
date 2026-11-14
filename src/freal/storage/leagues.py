from freal.leagues.config import LeagueConfig, parse_leagues
from freal.storage.parameters import ParameterStore

LEAGUES_PARAMETER = "/freal/leagues"


class LeaguesNotConfigured(Exception):
    """No league configuration has been stored yet."""


class LeagueStore:
    def __init__(self, parameters: ParameterStore) -> None:
        self._parameters = parameters

    def load(self) -> tuple[LeagueConfig, ...]:
        raw = self._parameters.get(LEAGUES_PARAMETER)
        if raw is None:
            raise LeaguesNotConfigured(LEAGUES_PARAMETER)
        return parse_leagues(raw)
