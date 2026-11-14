from freal.integrations.espn.credentials import EspnCredentials
from freal.leagues.models import Season

LEAGUE_ID = 7


class FakeFetcher:
    def __init__(self, season: Season) -> None:
        self.season = season
        self.error: Exception | None = None
        self.calls: list[tuple[int, int, EspnCredentials | None]] = []

    def __call__(self, league_id: int, year: int, credentials: EspnCredentials | None) -> Season:
        self.calls.append((league_id, year, credentials))
        if self.error is not None:
            raise self.error
        return self.season


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now
