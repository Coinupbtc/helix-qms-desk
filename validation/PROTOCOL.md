# IQ / OQ / PQ protocols (Helix QMS Desk v1.1)

Executed in-app: **Validation → Run IQ / OQ / PQ**. OQ/PQ mutations are **sandboxed** (dataset restored).

## Intended use

Quality engineers log NCs, CAPAs, complaints, and SCARs; QA Managers close CAPAs (D4 + D5 + effectiveness note); viewers inspect only.

## IQ

| ID | Check |
|---|---|
| IQ-01 | App version matches shipped seed |
| IQ-02 | Seed checksum matches |
| IQ-03 | Record families loaded |
| IQ-04 | SYNTHETIC disclaimer |
| IQ-05 | All IDs unique |
| IQ-06 | Foreign keys resolve |
| IQ-07 | Change-control family present |

## OQ

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

## PQ

| ID | Check |
|---|---|
| PQ-01 | Complaint → NC → CAPA → SCAR + FK still ok |
| PQ-02 | Supplier score decreases after open SCAR |

Sign the on-screen report (typed name, demo only). Download JSON for the evidence pack.
