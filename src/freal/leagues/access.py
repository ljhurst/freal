from pydantic import Field

from freal.models import FrozenModel


class Member(FrozenModel):
    sub: str = Field(min_length=1)
    label: str = Field(default="", max_length=60)


class LeagueAccess(FrozenModel):
    league_id: int
    members: tuple[Member, ...]


class Caller(FrozenModel):
    subject: str | None
    is_admin: bool


def can_see(access: tuple[LeagueAccess, ...], caller: Caller, league_id: int) -> bool:
    if caller.is_admin:
        return True
    if caller.subject is None:
        return False
    return any(
        entry.league_id == league_id
        and any(member.sub == caller.subject for member in entry.members)
        for entry in access
    )
