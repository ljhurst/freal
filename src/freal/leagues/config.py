from pydantic import Field, TypeAdapter

from freal.models import FrozenModel


class LeagueConfig(FrozenModel):
    league_id: int
    name: str
    account: str = Field(pattern=r"^[a-z0-9-]{1,32}$")
    first_year: int

    def years(self, latest_season: int) -> tuple[int, ...]:
        return tuple(range(self.first_year, latest_season + 1))


def parse_leagues(raw: str) -> tuple[LeagueConfig, ...]:
    return TypeAdapter(tuple[LeagueConfig, ...]).validate_json(raw)
