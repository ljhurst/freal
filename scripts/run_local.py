"""Serve the API on localhost against live ESPN and the real Lasso, with cookies from a file.

Usage: uv run python scripts/run_local.py LEAGUE_ID FIRST_YEAR COOKIES_ENV_FILE [PORT]

Requests need a Lasso access token (see scripts/get_token.py), as in production.
"""

import json
import sys
from pathlib import Path

import uvicorn
from pydantic import SecretStr

from freal.integrations.espn.credentials import EspnCredentials
from freal.integrations.lasso.tokens import LassoTokenValidator
from freal.operations.api import create_app
from freal.storage.credentials import CredentialStore
from freal.storage.leagues import LEAGUES_PARAMETER
from freal.storage.parameters import MemoryParameterStore

ACCOUNT = "local"
LASSO_ISSUER_URL = "https://lasso.bylukehurst.com/"
FREAL_RESOURCE_URL = "https://freal-api.bylukehurst.com/"


def main(league_id: int, first_year: int, cookies_file: Path, port: int) -> None:
    store = MemoryParameterStore(
        {
            LEAGUES_PARAMETER: json.dumps(
                [
                    {
                        "league_id": league_id,
                        "name": "Local League",
                        "account": ACCOUNT,
                        "first_year": first_year,
                    }
                ]
            ),
        }
    )
    CredentialStore(store).save(ACCOUNT, _read_credentials(cookies_file))
    validator = LassoTokenValidator(issuer_url=LASSO_ISSUER_URL, audience=FREAL_RESOURCE_URL)
    uvicorn.run(create_app(store, validator.validate), host="127.0.0.1", port=port)


def _read_credentials(path: Path) -> EspnCredentials:
    values = dict(line.split("=", 1) for line in path.read_text().splitlines() if "=" in line)
    return EspnCredentials(espn_s2=SecretStr(values["espn_s2"]), swid=SecretStr(values["SWID"]))


if __name__ == "__main__":
    main(
        int(sys.argv[1]),
        int(sys.argv[2]),
        Path(sys.argv[3]),
        int(sys.argv[4]) if len(sys.argv) > 4 else 8000,
    )
