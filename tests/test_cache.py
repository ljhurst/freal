import pytest

from freal.cache import TtlCache


class FakeClock:
    def __init__(self) -> None:
        self.now = 100.0

    def __call__(self) -> float:
        return self.now


def test_a_value_is_computed_once_within_the_ttl() -> None:
    clock = FakeClock()
    cache = TtlCache[int](60, clock)
    calls: list[int] = []

    def compute() -> int:
        calls.append(1)
        return len(calls)

    assert cache.get_or_compute("k", compute) == 1
    clock.now += 59
    assert cache.get_or_compute("k", compute) == 1
    assert len(calls) == 1


def test_a_value_is_recomputed_once_the_ttl_has_passed() -> None:
    clock = FakeClock()
    cache = TtlCache[int](60, clock)
    values = iter([1, 2])

    assert cache.get_or_compute("k", lambda: next(values)) == 1
    clock.now += 60

    assert cache.get_or_compute("k", lambda: next(values)) == 2


def test_keys_are_cached_independently() -> None:
    cache = TtlCache[str](60, FakeClock())

    assert cache.get_or_compute("a", lambda: "first") == "first"
    assert cache.get_or_compute("b", lambda: "second") == "second"
    assert cache.get_or_compute("a", lambda: "unused") == "first"


def test_a_failed_computation_is_not_cached() -> None:
    cache = TtlCache[str](60, FakeClock())

    def fail() -> str:
        raise RuntimeError("down")

    with pytest.raises(RuntimeError):
        cache.get_or_compute("k", fail)

    assert cache.get_or_compute("k", lambda: "recovered") == "recovered"


def test_an_invalidated_key_is_recomputed() -> None:
    cache = TtlCache[str](60, FakeClock())
    cache.get_or_compute("k", lambda: "old")

    cache.invalidate("k")

    assert cache.get_or_compute("k", lambda: "new") == "new"
