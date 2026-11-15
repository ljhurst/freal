"""Write the API's OpenAPI document, which the frontend generates its types from.

Usage: uv run python scripts/export_openapi.py [OUTPUT]
"""

import json
import sys
from pathlib import Path

from freal.operations.api import create_app
from freal.operations.service import LeagueService
from freal.storage.parameters import MemoryParameterStore

DEFAULT_OUTPUT = Path("frontend/src/lib/api/openapi.json")


def main(output: Path) -> None:
    app = create_app(LeagueService(MemoryParameterStore()), lambda token: None)
    output.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n")
    print(f"wrote {output}")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT)
