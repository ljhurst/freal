class LeagueNotFound(Exception):
    """No configured league has that id."""


class SeasonNotFound(Exception):
    """The league has no such season."""


class AccountNotFound(Exception):
    """No configured league uses that cookie account."""
