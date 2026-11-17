import importlib.util
from pathlib import Path

from freal.leagues.models import Season

SCRIPT = Path(__file__).parents[2] / "scripts" / "snapshot_season.py"


def test_anonymizing_hides_identities_and_keeps_every_other_team_field(
    season_2025: Season,
) -> None:
    spec = importlib.util.spec_from_file_location("snapshot_season", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    real = season_2025.model_copy(
        update={
            "teams": tuple(
                team.model_copy(update={"name": "Real Name", "owner": "Real Owner"})
                for team in season_2025.teams
            )
        }
    )

    teams = module.anonymize(real).teams

    assert [t.name for t in teams] == [f"Team {t.team_id}" for t in teams]
    assert all(t.owner == f"Owner {t.team_id}" for t in teams)
    assert [t.final_rank for t in teams] == [t.final_rank for t in season_2025.teams]
    assert {t.final_rank for t in teams} >= {1, 2}
