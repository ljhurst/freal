from freal.leagues.access import Caller, LeagueAccess, Member, can_see

ACCESS = (LeagueAccess(league_id=7, members=(Member(sub="dana", label="Dana"),)),)


def test_a_member_can_see_their_league() -> None:
    assert can_see(ACCESS, Caller(subject="dana", is_admin=False), 7)


def test_a_member_cannot_see_another_league() -> None:
    assert not can_see(ACCESS, Caller(subject="dana", is_admin=False), 8)


def test_a_stranger_cannot_see_the_league() -> None:
    assert not can_see(ACCESS, Caller(subject="sam", is_admin=False), 7)


def test_an_admin_sees_every_league_without_being_listed() -> None:
    assert can_see((), Caller(subject="luke", is_admin=True), 7)


def test_a_token_without_a_subject_sees_nothing() -> None:
    assert not can_see(ACCESS, Caller(subject=None, is_admin=False), 7)
