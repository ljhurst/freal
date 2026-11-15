#!/usr/bin/env bash
# Fails when the files the frontend generates from the API (its types and the demo data)
# no longer match what the API produces.
set -euo pipefail

cd "$(dirname "$0")/.."

uv run python scripts/export_openapi.py
uv run python scripts/export_demo.py
npm run --prefix frontend types

git diff --exit-code -- frontend/src/lib/api frontend/public/demo
