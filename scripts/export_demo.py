"""Write the demo data the dashboard serves on PR previews, from the anonymized test fixture.

Usage: uv run python scripts/export_demo.py [OUTPUT_DIR]
"""

import json
import sys
from pathlib import Path

from freal.leagues.models import Season
from freal.operations.service import LeagueSummary
from freal.reports.season import build_season_report

FIXTURE = Path("tests/fixtures/season_2025.json")
DEFAULT_OUTPUT_DIR = Path("frontend/public/demo")


def main(output_dir: Path) -> None:
    season = Season.model_validate_json(FIXTURE.read_text())
    report = build_season_report(season)
    leagues = [LeagueSummary(league_id=season.league_id, name=season.name, years=(season.year,))]

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / f"season-{season.year}.json").write_text(report.model_dump_json() + "\n")
    (output_dir / "leagues.json").write_text(
        json.dumps([league.model_dump(mode="json") for league in leagues]) + "\n"
    )
    print(f"wrote demo data for {season.year} to {output_dir}")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT_DIR)
