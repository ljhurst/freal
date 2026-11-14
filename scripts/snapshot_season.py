"""Fetch a season from ESPN and write it, anonymized, as a test fixture.

Usage: uv run python scripts/snapshot_season.py LEAGUE_ID YEAR COOKIES_ENV_FILE OUT_JSON
"""

import sys
from pathlib import Path

from pydantic import SecretStr

from freal.integrations.espn.client import EspnCredentials, load_season
from freal.leagues.models import Season, Team


def main(league_id: int, year: int, cookies_file: Path, out: Path) -> None:
    season = anonymize(load_season(league_id, year, _read_credentials(cookies_file)))
    out.write_text(season.model_dump_json() + "\n")
    print(f"wrote {out}: {len(season.teams)} teams, {len(season.matchups)} matchups")


def anonymize(season: Season) -> Season:
    return season.model_copy(
        update={
            "name": "Test League",
            "teams": tuple(
                Team(
                    team_id=t.team_id,
                    name=f"Team {t.team_id}",
                    owner=f"Owner {t.team_id}",
                    owner_id=f"owner-{t.team_id}",
                )
                for t in season.teams
            ),
        }
    )


def _read_credentials(path: Path) -> EspnCredentials:
    values = dict(line.split("=", 1) for line in path.read_text().splitlines() if "=" in line)
    return EspnCredentials(espn_s2=SecretStr(values["espn_s2"]), swid=SecretStr(values["SWID"]))


if __name__ == "__main__":
    main(int(sys.argv[1]), int(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4]))
