from collections import defaultdict

from pydantic import computed_field

from freal.leagues.models import FrozenModel, Season, Side, Slot
from freal.metrics.results import regular_matchups

IR_SLOT = "IR"


class LineupEfficiency(FrozenModel):
    team_id: int
    points: float
    optimal_points: float

    # mypy rejects any decorator stacked on a property; pydantic's docs prescribe this ignore.
    @computed_field  # type: ignore[prop-decorator]
    @property
    def left_on_bench(self) -> float:
        return self.optimal_points - self.points

    @computed_field  # type: ignore[prop-decorator]
    @property
    def efficiency(self) -> float:
        return self.points / self.optimal_points if self.optimal_points else 1.0


def lineup_efficiency(season: Season) -> tuple[LineupEfficiency, ...]:
    """Season totals of actual points against the best lineup each week allowed."""
    actual: dict[int, float] = defaultdict(float)
    optimal: dict[int, float] = defaultdict(float)
    for matchup in regular_matchups(season):
        for side in (matchup.home, matchup.away):
            actual[side.team_id] += side.points
            optimal[side.team_id] += optimal_points(side)
    return tuple(
        LineupEfficiency(team_id=team_id, points=actual[team_id], optimal_points=optimal[team_id])
        for team_id in sorted(actual)
    )


def optimal_points(side: Side) -> float:
    """The most a side's roster could have scored in the starting slots it had."""
    slots = [player.slot for player in side.lineup if player.is_starter]
    candidates = sorted(
        (player for player in side.lineup if player.slot != IR_SLOT),
        key=lambda player: player.points,
        reverse=True,
    )
    holder: list[Slot | None] = [None] * len(slots)
    for player in candidates:
        if player.points <= 0:
            break
        _place(player, slots, holder, set())
    return sum(player.points for player in holder if player is not None)


def _place(player: Slot, slots: list[str], holder: list[Slot | None], tried: set[int]) -> bool:
    for index, slot_name in enumerate(slots):
        if slot_name not in player.eligible_slots or index in tried:
            continue
        tried.add(index)
        occupant = holder[index]
        if occupant is None or _place(occupant, slots, holder, tried):
            holder[index] = player
            return True
    return False
