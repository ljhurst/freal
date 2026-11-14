from enum import StrEnum

from pydantic import BaseModel, ConfigDict

INACTIVE_SLOTS = frozenset({"BE", "IR"})


class FrozenModel(BaseModel):
    model_config = ConfigDict(frozen=True)


class MatchupKind(StrEnum):
    REGULAR = "regular"
    PLAYOFF = "playoff"
    CONSOLATION = "consolation"


class Slot(FrozenModel):
    player_id: int
    name: str
    position: str
    slot: str
    eligible_slots: tuple[str, ...]
    points: float
    projected_points: float

    @property
    def is_starter(self) -> bool:
        return self.slot not in INACTIVE_SLOTS


class Side(FrozenModel):
    team_id: int
    points: float
    projected_points: float
    lineup: tuple[Slot, ...]


class Matchup(FrozenModel):
    week: int
    kind: MatchupKind
    home: Side
    away: Side


class Team(FrozenModel):
    team_id: int
    name: str
    owner: str


class Season(FrozenModel):
    league_id: int
    year: int
    name: str
    regular_season_weeks: int
    playoff_team_count: int
    teams: tuple[Team, ...]
    matchups: tuple[Matchup, ...]
