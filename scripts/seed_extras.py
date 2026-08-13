"""Week-one war-room + serving-lab extras (synthetic). Imported by generate_seed.py."""
from __future__ import annotations

# Voltage sticker ≠ certificate — same failure class as closed CAPA-2026-04.
NCS_EXTRA = [
    {
        "id": "NC-2026-017",
        "date": "2026-08-12",
        "pn": "DA-900",
        "lot": "DA-2628",
        "qty": 1,
        "supplier_id": "SUP-03",
        "severity": "critical",
        "source": "calibration",
        "title": "Voltage standard sticker disagrees with certificate",
        "description": (
            "STK-V-204 bench sticker due 2026-09-01; Prairie Cal certificate due 2026-07-31. "
            "Used 2026-08-08 on DA-900 SN HX-36201 final test. "
            "Same failure class as CAPA-2026-04: the status label is a claim, not evidence."
        ),
        "containment": (
            "Hold SN HX-36201 and any DA-900 finalled on bench 2 since 2026-08-01. "
            "Remove STK-V-204 from the cell."
        ),
        "disposition": "retest after recert",
        "status": "open",
        "capa_id": "CAPA-2026-11",
        "scar_id": None,
        "complaint_id": "CMP-2026-019",
    },
]

CAPAS_EXTRA = [
    {
        "id": "CAPA-2026-11",
        "opened": "2026-08-12",
        "due": "2026-09-09",
        "status": "open",
        "owner": "Riley Chen",
        "type": "corrective",
        "nc_ids": ["NC-2026-017"],
        "problem": (
            "Metrology status label does not track the certificate date — "
            "STK-V-204 used after cert expiry."
        ),
        "d2_team": "QE, Metrology, Prairie Cal, Test",
        "d3_containment": "Pull STK-V-204. Hold bench-2 DA-900 finals since 2026-08-01.",
        "d4_root_cause": (
            "MES lockout from ECO-2026-011 reads the due date printed on the sticker, "
            "not the certificate PDF date. After CAPA-2026-04 the plant trusted the green lockout."
        ),
        "d5_action": (
            "Fail-closed if sticker due ≠ cert due. Reprint labels from the certificate only. "
            "Add cert-date field to MES."
        ),
        "d6_implement": "Opened Monday — lockout change not released.",
        "d7_prevent": "Weekly cert-vs-sticker audit on this desk (standards family).",
        "d8_congratulate": "",
        "effectiveness_due": "2026-11-12",
        "effectiveness": "pending",
        "supplier_id": "SUP-03",
    },
]

STANDARDS = [
    {
        "id": "STK-V-204",
        "name": "DC voltage standard (10 V)",
        "bench": "Bench 2 — DA-900 final",
        "supplier_id": "SUP-03",
        "sticker_due": "2026-09-01",
        "cert_due": "2026-07-31",
        "cert_id": "PCL-V-8841",
        "last_used": "2026-08-08",
        "used_on": "DA-900 SN HX-36201",
        "status": "mismatch",
        "note": "Sticker current. Certificate expired. Presence is not integrity.",
    },
    {
        "id": "STK-P-118",
        "name": "Pressure module (NIBP)",
        "bench": "Bench 3 — NP-310 final",
        "supplier_id": "SUP-03",
        "sticker_due": "2026-12-15",
        "cert_due": "2026-12-15",
        "cert_id": "PCL-P-9102",
        "last_used": "2026-08-11",
        "used_on": "NP-310 SN HX-39140",
        "status": "ok",
        "note": "Aligned after CAPA-2026-04 MES lockout.",
    },
    {
        "id": "STK-O-055",
        "name": "SpO2 optical phantom 70%",
        "bench": "Bench 1 — PX-400",
        "supplier_id": "SUP-03",
        "sticker_due": "2026-10-15",
        "cert_due": "2026-10-15",
        "cert_id": "PCL-O-7720",
        "last_used": "2026-08-10",
        "used_on": "PX-400 daily check",
        "status": "ok",
        "note": "Interval shortened under CAPA-2026-06.",
    },
    {
        "id": "STK-T-009",
        "name": "Chamber temperature probe",
        "bench": "Environmental",
        "supplier_id": "SUP-03",
        "sticker_due": "2027-01-08",
        "cert_due": "2027-01-08",
        "cert_id": "PCL-T-3310",
        "last_used": "2026-07-22",
        "used_on": "IT-200 cold soak",
        "status": "ok",
        "note": "Current.",
    },
]

TRAINING = [
    {
        "id": "TRN-014",
        "person": "Sam Ortiz",
        "role": "Incoming inspector",
        "wi": "WI-IN-04 Rest-voltage incoming",
        "qualified_through": "2026-06-01",
        "last_task": "Harbor pack incoming 2026-08-05 (NC-2026-013)",
        "status": "gap",
        "note": "Performed controlled work with no current training record.",
    },
    {
        "id": "TRN-008",
        "person": "Avery Kim",
        "role": "Final test tech",
        "wi": "WI-DA-12 DA-900 final",
        "qualified_through": "2026-12-01",
        "last_task": "DA-900 SN HX-36201 2026-08-08",
        "status": "ok",
        "note": "Current. Used STK-V-204 under a green sticker.",
    },
    {
        "id": "TRN-003",
        "person": "Riley Chen",
        "role": "Quality Engineer",
        "wi": "WI-QE-01 CAPA / NC",
        "qualified_through": "2027-01-15",
        "last_task": "Week-one desk",
        "status": "ok",
        "note": "Current.",
    },
    {
        "id": "TRN-011",
        "person": "Jordan Lee",
        "role": "Production lead",
        "wi": "WI-PK-03 Pack / DMR rev",
        "qualified_through": "2026-11-20",
        "last_task": "NP-310 pack hold FG-NP-88",
        "status": "ok",
        "note": "Current.",
    },
]

# Canned serving evidence so GitHub Pages can run IQ/OQ/PQ with no GPU.
# Optional live probe (local ./setup.sh only) never prints host paths.
SERVING = {
    "system": "Helix Assist",
    "intended_use": (
        "Draft complaint severity and likely family for a human QE. "
        "Assist must not close a CAPA or file MDR."
    ),
    "approved_model": "helix-assist-0.3",
    "approved_checksum": "c0ffee12assist03",
    "eco": "ECO-2026-020",
    "disclaimer": "SYNTHETIC serving fixture. Not a production model and not a real GPU log.",
    "canned": {
        "models_http": 200,
        "served_id": "helix-assist-0.3",
        "served_checksum": "c0ffee12assist03",
        "empty_http": 200,
        "empty_content": "",
        "good_http": 200,
        "good_content": "severity=major; family=battery-pack; do_not_close=true",
        "pq_complaint": "CMP-2026-019",
        "pq_expect_family": "battery-pack",
        "pq_expect_severity": "major",
        "bakeoff_tok_s": 35.8,
        "bakeoff_note": "Canned coding-prompt figure for the fixture (demo). Not a live GPU measurement.",
    },
    "live": {
        "hint": "Local clone only: optional probe of 127.0.0.1:8888 (OpenAI-compatible). Pages cannot reach it.",
        "host": "127.0.0.1",
        "port": 8888,
        "models_path": "/v1/models",
        "chat_path": "/v1/chat/completions",
    },
}

ECOS_EXTRA = [
    {
        "id": "ECO-2026-020",
        "date": "2026-08-04",
        "title": "Helix Assist 0.3 — complaint draft only (no close / no MDR)",
        "status": "released",
        "linked": "serving",
    },
    {
        "id": "ECO-2026-021",
        "date": "2026-08-12",
        "title": "MES lockout: fail if sticker due ≠ certificate due",
        "status": "open",
        "linked": "CAPA-2026-11",
    },
]

REQS_EXTRA = [
    {
        "id": "R-15",
        "text": "Serving health is non-empty model output, not HTTP 200 alone.",
        "risk": "High — silent empty completions look healthy",
    },
    {
        "id": "R-16",
        "text": "Helix Assist is advisory; it cannot close a CAPA.",
        "risk": "High — automated close without effectiveness",
    },
    {
        "id": "R-17",
        "text": "Served model id and checksum match the approved ECO.",
        "risk": "High — unapproved model in the complaint path",
    },
    {
        "id": "R-18",
        "text": "Standards family compares sticker due vs certificate due.",
        "risk": "High — expired standard used under a current sticker",
    },
]
