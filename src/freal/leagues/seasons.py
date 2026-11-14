from datetime import date

SEASON_ROLLOVER_MONTH = 8


def latest_season(today: date) -> int:
    """The newest season that exists: the one that started last September, until August."""
    return today.year if today.month >= SEASON_ROLLOVER_MONTH else today.year - 1
