# IQ / OQ / PQ protocols (Helix QMS Desk)

Executed in-app: **Validation → Run IQ / OQ / PQ**. This file is the paper twin.

## Intended use

Quality engineers at a biomedical test-equipment manufacturer log NCs, CAPAs, complaints, and SCARs; QA Managers close CAPAs; viewers inspect only.

## IQ

| ID | Check |
|---|---|
| IQ-01 | App version matches shipped seed |
| IQ-02 | Seed checksum matches |
| IQ-03 | NC, CAPA, SCAR, supplier, complaint families loaded |
| IQ-04 | SYNTHETIC disclaimer present |

## OQ

| ID | Check |
|---|---|
| OQ-01 | New NC unique ID |
| OQ-02 | Empty description rejected |
| OQ-03 | Viewer cannot create NC |
| OQ-04 | Viewer cannot close CAPA |
| OQ-05 | QA Manager can close CAPA |
| OQ-06 | Audit trail appends; no delete control |
| OQ-07 | Overdue CAPA KPI matches due dates |

## PQ

| ID | Check |
|---|---|
| PQ-01 | Complaint → NC → CAPA → SCAR |
| PQ-02 | Supplier score decreases after open SCAR |

Deviations: any fail is listed on the execution report. Reset demo data and re-run.
