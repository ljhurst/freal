from freal.leagues.models import MatchupKind, Season
from tests.factories import slot


def test_fixture_season_has_a_full_regular_season_and_two_playoff_rounds(
    season_2025: Season,
) -> None:
    regular = [m for m in season_2025.matchups if m.kind is MatchupKind.REGULAR]

    assert len(season_2025.teams) == 8
    assert {m.week for m in regular} == set(range(1, season_2025.regular_season_weeks + 1))
    assert {m.week for m in season_2025.matchups} == set(range(1, 17))
    assert len(regular) == 14 * 4


def test_fixture_is_anonymized(season_2025: Season) -> None:
    assert {t.name for t in season_2025.teams} == {f"Team {i}" for i in range(1, 9)}
    assert all(t.owner.startswith("Owner ") for t in season_2025.teams)
    assert {t.owner_id for t in season_2025.teams} == {f"owner-{i}" for i in range(1, 9)}


def test_every_lineup_has_starters_and_a_bench(season_2025: Season) -> None:
    lineup = season_2025.matchups[0].home.lineup

    assert any(slot.is_starter for slot in lineup)
    assert any(not slot.is_starter for slot in lineup)


def test_only_the_injured_reserve_slot_is_injured_reserve() -> None:
    assert slot("IR", 0).is_injured_reserve
    assert not slot("BE", 0).is_injured_reserve
    assert not slot("QB", 0).is_injured_reserve
    assert not slot("IR", 0).is_starter
