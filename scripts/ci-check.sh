#!/usr/bin/env bash
# Cheap CI: seed must regenerate, IDs unique, risk file present. No browser.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 scripts/generate_seed.py
python3 - <<'PY'
import json
from pathlib import Path
d = json.loads(Path("data/seed.json").read_text())
assert d["meta"]["version"].startswith("1.3"), d["meta"]["version"]
ids = []
for key in ("ncs", "capas", "scars", "complaints", "suppliers", "changes", "standards", "training", "hazards", "dhf"):
    ids += [r["id"] for r in d[key]]
assert len(ids) == len(set(ids)), "duplicate IDs"
hz = {h["id"]: h for h in d["hazards"]}
assert hz["HZ-07"]["residual_status"] == "unacceptable"
assert float(hz["HZ-07"]["p_resid"]) > float(hz["HZ-07"]["p_init"])
kinds = {x["kind"] for x in d["dhf"]}
assert {"user_need", "design_input", "design_output", "verification", "validation"} <= kinds
print("CI PASS", d["meta"]["checksum"], "records", len(ids))
PY
if command -v node >/dev/null; then
  for f in js/*.js; do
    node --check "$f"
  done
  echo "JS syntax OK"
fi
