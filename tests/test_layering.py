import ast
from pathlib import Path

PACKAGE = Path(__file__).parent.parent / "src" / "freal"
HTTP_LIBRARIES = {"fastapi", "starlette", "mangum"}
LOWER_PACKAGES = ("leagues", "integrations", "metrics", "reports", "storage")


def test_nothing_below_the_http_layer_imports_an_http_library() -> None:
    http_free = [
        *(path for package in LOWER_PACKAGES for path in (PACKAGE / package).rglob("*.py")),
        PACKAGE / "operations" / "service.py",
        PACKAGE / "cache.py",
        PACKAGE / "models.py",
    ]

    offenders = {
        str(path.relative_to(PACKAGE)): sorted(
            module for module in _imports(path) if module.split(".")[0] in HTTP_LIBRARIES
        )
        for path in http_free
    }

    assert {path: modules for path, modules in offenders.items() if modules} == {}


def test_lower_layers_never_import_operations() -> None:
    lower_files = [path for package in LOWER_PACKAGES for path in (PACKAGE / package).rglob("*.py")]

    offenders = {
        str(path.relative_to(PACKAGE)): sorted(
            module for module in _imports(path) if module.startswith("freal.operations")
        )
        for path in lower_files
    }

    assert {path: modules for path, modules in offenders.items() if modules} == {}


def _imports(path: Path) -> set[str]:
    modules: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.add(node.module)
    return modules
