#!/usr/bin/env bash
#
# setup-desmond.sh — one-time setup for Aurora's Desmond AI assistant.
#
# Desmond is an opt-in Python voice assistant. Aurora runs fine without it
# (the Desmond view simply shows a "stopped/needs setup" state). Run this once
# to create its venv, install dependencies, and fetch the Playwright browser so
# the assistant can launch.
#
# Usage:
#   scripts/setup-desmond.sh [DESMOND_DIR]
#
#   DESMOND_DIR  Path to the Desmond/ source. Resolution order:
#                  1. first argument
#                  2. $AURORA_DESMOND_DIR
#                  3. ../Desmond relative to this repo (default dev layout)
#
# Windows-only packages in requirements.txt (comtypes, pycaw, win10toast,
# pywinauto) are skipped on Linux — Desmond imports them defensively.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DESMOND_DIR="${1:-${AURORA_DESMOND_DIR:-$(cd "$REPO_DIR/.." && pwd)/Desmond}}"

WIN_ONLY='^(comtypes|pycaw|win10toast|pywinauto)'

echo "Aurora · Desmond setup"
echo "  Desmond dir: $DESMOND_DIR"

if [ ! -f "$DESMOND_DIR/main.py" ]; then
  echo "ERROR: no main.py found in '$DESMOND_DIR'." >&2
  echo "Pass the Desmond source path as the first argument." >&2
  exit 1
fi

PYTHON_BIN="$(command -v python3 || true)"
if [ -z "$PYTHON_BIN" ]; then
  echo "ERROR: python3 not found on PATH." >&2
  exit 1
fi
echo "  Python: $PYTHON_BIN ($("$PYTHON_BIN" --version 2>&1))"

VENV_DIR="$DESMOND_DIR/venv"
if [ -d "$VENV_DIR" ]; then
  echo "  venv already exists at $VENV_DIR — reusing it."
else
  echo "  Creating venv..."
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

VENV_PY="$VENV_DIR/bin/python"
echo "  Upgrading pip..."
"$VENV_PY" -m pip install --upgrade pip >/dev/null

REQ="$DESMOND_DIR/requirements.txt"
if [ -f "$REQ" ]; then
  FILTERED="$(mktemp)"
  # Strip BOM/CR, drop blank/comment lines and Windows-only packages.
  sed 's/\r$//; s/^\xEF\xBB\xBF//' "$REQ" \
    | grep -vE '^\s*(#|$)' \
    | grep -viE "$WIN_ONLY" > "$FILTERED"
  echo "  Installing Linux dependencies (Windows-only packages skipped)..."
  "$VENV_PY" -m pip install -r "$FILTERED"
  rm -f "$FILTERED"
else
  echo "  WARNING: no requirements.txt found — skipping dependency install."
fi

echo "  Installing Playwright Chromium..."
"$VENV_PY" -m playwright install chromium || \
  echo "  WARNING: playwright install failed — browser_control will be unavailable."

echo
echo "Done. Launch Aurora and open the Desmond view to start the assistant."
echo "Note: Desmond also needs a valid Gemini key in $DESMOND_DIR/config/api_keys.json"
