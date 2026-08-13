#!/usr/bin/env bash
# Headless protocol: dump-dom must show a passing execution report.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-18765}"
python3 "$ROOT/scripts/generate_seed.py" >/dev/null
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/tmp/helix-smoke-http.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT
sleep 0.8
DOM=$(brave-browser --headless --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=12000 \
  "http://127.0.0.1:${PORT}/?run=val" 2>/dev/null || true)
printf '%s' "$DOM" > /tmp/helix-smoke-dom.html
wc -c /tmp/helix-smoke-dom.html
echo "$DOM" | grep -q 'id="val-report"' || { echo "FAIL: no val-report"; exit 1; }
echo "$DOM" | grep -q 'OQ-09 Dataset restored' || { echo "FAIL: missing restore test"; exit 1; }
echo "$DOM" | grep -q 'No deviations' || { echo "FAIL: expected clean desk protocol"; exit 1; }
echo "$DOM" | grep -q 'IQ-08' || { echo "FAIL: missing sticker IQ"; exit 1; }

SERVE=$(brave-browser --headless --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=12000 \
  "http://127.0.0.1:${PORT}/?run=serve" 2>/dev/null || true)
echo "$SERVE" | grep -q 'id="serve-report"' || { echo "FAIL: no serve-report"; exit 1; }
echo "$SERVE" | grep -q 'No serving deviations' || { echo "FAIL: expected clean serving protocol"; exit 1; }

HOME=$(brave-browser --headless --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=8000 \
  "http://127.0.0.1:${PORT}/" 2>/dev/null || true)
echo "$HOME" | grep -q 'The sticker is lying' || { echo "FAIL: war-room headline missing"; exit 1; }
echo "$HOME" | grep -q 'STK-V-204' || { echo "FAIL: voltage standard missing"; exit 1; }
echo "SMOKE PASS — desk + assist protocols + Monday war-room"
