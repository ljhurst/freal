import pytest

from freal.leagues.models import Season
from freal.metrics.rating import contender_count, rate_teams
from tests.factories import matchup, season, side

BASE = {1: 130.0, 2: 112.0, 3: 100.0, 4: 84.0}
NOISE = [-6, 3, 5, -2, 4, -5, 1, 6, -4, 2, -3, 5, -1, 0]


def _league(weeks: int = 14, base: dict[int, float] = BASE) -> Season:
    def score(team_id: int, week: int) -> float:
        return base[team_id] + NOISE[(week + team_id) % len(NOISE)]

    return season(
        [
            matchup(week, side(home, score(home, week)), side(away, score(away, week)))
            for week in range(1, weeks + 1)
            for home, away in ((1, 2), (3, 4))
        ]
    )


def test_a_clear_leader_is_very_likely_a_contender() -> None:
    ratings = {row.team_id: row for row in rate_teams(_league())}

    assert ratings[1].contender_probability > 0.9
    assert ratings[4].contender_probability < 0.05
    assert ratings[4].bottom_probability > 0.9


def test_each_group_has_exactly_its_share_of_the_probability() -> None:
    ratings = rate_teams(_league())

    assert contender_count(4) == 1
    assert sum(row.contender_probability for row in ratings) == pytest.approx(1.0)
    assert sum(row.bottom_probability for row in ratings) == pytest.approx(1.0)


def test_the_same_season_always_gives_the_same_ratings() -> None:
    assert rate_teams(_league()) == rate_teams(_league())


def test_a_higher_scorer_never_has_a_lower_probability() -> None:
    ratings = sorted(rate_teams(_league()), key=lambda row: row.points_above_average)

    odds = [row.contender_probability for row in ratings]
    assert odds == sorted(odds)


def test_strength_is_pulled_toward_the_league_average() -> None:
    season_ = _league()
    leader = next(row for row in rate_teams(season_) if row.team_id == 1)
    raw = sum(130.0 + NOISE[(week + 1) % 14] for week in range(1, 15)) / 14 - 106.5

    assert 0 < leader.points_above_average < raw


def test_less_of_a_season_means_less_certainty() -> None:
    close = {1: 108.0, 2: 104.0, 3: 100.0, 4: 96.0}
    early = next(row for row in rate_teams(_league(weeks=4, base=close)) if row.team_id == 1)
    full = next(row for row in rate_teams(_league(weeks=14, base=close)) if row.team_id == 1)

    assert early.contender_probability < full.contender_probability


def test_teams_that_score_alike_share_the_odds_evenly() -> None:
    alike = _league(base={1: 100.0, 2: 100.0, 3: 100.0, 4: 100.0})

    assert {row.contender_probability for row in rate_teams(alike)} == {0.25}


@pytest.mark.parametrize(
    ("teams", "contenders"), [(4, 1), (6, 1), (8, 2), (10, 2), (12, 3), (14, 3), (16, 4)]
)
def test_the_real_threats_are_the_top_quarter_of_the_league(teams: int, contenders: int) -> None:
    assert contender_count(teams) == contenders


def test_a_season_with_no_games_has_no_ratings() -> None:
    assert rate_teams(season([])) == ()
