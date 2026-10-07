# IQ / OQ / PQ protocols (Helix QMS Desk v1.2)

Two protocols. Same rule: **presence is not integrity**.

Executed in-app: **Validation**. OQ/PQ mutations for the desk are **sandboxed** (dataset restored). Serving protocol is canned so GitHub Pages can run it with no GPU.

## Intended use — desk

Quality engineers log NCs, CAPAs, complaints, and SCARs; QA Managers close CAPAs (D4 + D5 + effectiveness note); viewers inspect only. Metrology standards compare sticker due vs certificate due.

## Desk IQ

| ID | Check |
|---|---|
| IQ-01 | App version matches shipped seed |
| IQ-02 | Seed checksum matches |
| IQ-03 | Record families loaded (incl. standards, training, serving) |
| IQ-04 | SYNTHETIC disclaimer |
| IQ-05 | All IDs unique |
| IQ-06 | Foreign keys resolve |
| IQ-07 | Change-control family present |
| IQ-08 | Sticker ≠ cert detectable (STK-V-204) |
| IQ-09 | Training gap detectable |
| IQ-10 | Serving fixture matches approved ECO |

## Desk OQ

| ID | Check |
|---|---|
| OQ-01 | Two new NCs, distinct IDs |
| OQ-02 | Empty description rejected |
| OQ-03 | Viewer cannot create NC |
| OQ-04 | Viewer cannot close CAPA |
| OQ-05 | Close without D4 rejected |
| OQ-06 | QA Manager close with protocol waiver |
| OQ-07 | Audit trail appends; no delete control |
| OQ-08 | Overdue KPI matches due dates |
| OQ-09 | Dataset restored after protocol |

## Desk PQ

| ID | Check |
|---|---|
| PQ-01 | Complaint → NC → CAPA → SCAR + FK still ok |
| PQ-02 | Supplier score decreases after open SCAR |

## Intended use — Helix Assist

Draft complaint severity and likely family. Must not close a CAPA or file MDR.

## Serving IQ / OQ / PQ (canned)

| ID | Check |
|---|---|
| S-IQ-01 | Intended use written (draft, must not close) |
| S-IQ-02 | Approved model + checksum + ECO |
| S-IQ-03 | Fixture marked SYNTHETIC |
| S-OQ-01 | Presence: /v1/models HTTP 200 |
| S-OQ-02 | Integrity catch: HTTP 200 + empty content is flagged |
| S-OQ-03 | Good completion is non-empty |
| S-OQ-04 | Served id + checksum match ECO |
| S-PQ-01 | Output is advisory (`do_not_close=true`) |
| S-PQ-02 | CMP-2026-019 → battery-pack / major |
| S-PQ-03 | Bakeoff figure present and labeled demo |

Optional live probe of `127.0.0.1:8888` works only on a local `./setup.sh` server (not GitHub Pages). The evidence pack is the canned protocol.

Sign the on-screen report (typed name, demo only). Download JSON for the evidence pack.
