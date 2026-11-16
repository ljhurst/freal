import time
from collections.abc import Callable, Hashable


class TtlCache[T]:
    def __init__(self, ttl_seconds: float, clock: Callable[[], float] = time.monotonic) -> None:
        self._ttl = ttl_seconds
        self._clock = clock
        self._entries: dict[Hashable, tuple[float, T]] = {}

    def get_or_compute(self, key: Hashable, compute: Callable[[], T]) -> T:
        now = self._clock()
        cached = self._entries.get(key)
        if cached is not None and now - cached[0] < self._ttl:
            return cached[1]
        value = compute()
        self._entries[key] = (self._clock(), value)
        return value

    def invalidate(self, key: Hashable) -> None:
        self._entries.pop(key, None)
