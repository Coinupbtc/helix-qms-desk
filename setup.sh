#!/usr/bin/env bash
# Local demo server for Helix QMS Desk (no secrets, synthetic data only).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
PORT="${PORT:-8765}"
echo "Helix QMS Desk  →  http://127.0.0.1:${PORT}/"
echo "SYNTHETIC data. Ctrl-C to stop."
exec python3 -m http.server "$PORT" --bind 127.0.0.1
