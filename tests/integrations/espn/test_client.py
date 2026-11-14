from typing import Any

import pytest
from espn_api.requests.espn_requests import (
    ESPNAccessDenied,
    ESPNInvalidLeague,
    ESPNUnknownError,
)

from freal.integrations.espn import client as espn_client
from freal.integrations.espn.client import (
    EspnAuthError,
    EspnUnavailable,
    SeasonNotFound,
    load_season,
)


@pytest.mark.parametrize(
    ("raised", "translated"),
    [
        (ESPNAccessDenied, EspnAuthError),
        (ESPNInvalidLeague, SeasonNotFound),
        (ESPNUnknownError, EspnUnavailable),
    ],
)
def test_espn_errors_are_translated_so_callers_never_see_the_library(
    monkeypatch: pytest.MonkeyPatch, raised: type[Exception], translated: type[Exception]
) -> None:
    def fail(**_: Any) -> None:
        raise raised("boom")

    monkeypatch.setattr(espn_client, "EspnLeague", fail)

    with pytest.raises(translated):
        load_season(1, 2025)
