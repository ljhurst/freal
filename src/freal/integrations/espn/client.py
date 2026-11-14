from espn_api.football import League as EspnLeague
from espn_api.requests.espn_requests import (
    ESPNAccessDenied,
    ESPNInvalidLeague,
    ESPNUnknownError,
)

from freal.integrations.espn.credentials import EspnCredentials
from freal.integrations.espn.mapping import build_season
from freal.leagues.errors import SeasonNotFound
from freal.leagues.models import Season


class EspnAuthError(Exception):
    """ESPN refused the league's cookies, or the league needs cookies and has none."""


class EspnUnavailable(Exception):
    """ESPN answered with an error."""


def load_season(league_id: int, year: int, credentials: EspnCredentials | None = None) -> Season:
    """Fetch one season of a league from ESPN: teams plus every completed matchup."""
    try:
        espn = EspnLeague(
            league_id=league_id,
            year=year,
            espn_s2=credentials.espn_s2.get_secret_value() if credentials else None,
            swid=credentials.swid.get_secret_value() if credentials else None,
        )
        return build_season(espn, league_id, year, espn.box_scores)
    except ESPNAccessDenied as error:
        raise EspnAuthError(str(error)) from error
    except ESPNInvalidLeague as error:
        raise SeasonNotFound(str(error)) from error
    except ESPNUnknownError as error:
        raise EspnUnavailable(str(error)) from error
