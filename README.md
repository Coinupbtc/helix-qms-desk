# Helix QMS Desk

![Overview](docs/screenshots/overview.png)

## At a glance

| | |
|---|---|
| **What it is** | A working quality desk for a **fictional** biomedical test-equipment plant (NC, CAPA/8D, complaints, ASL/SCAR) plus a **live IQ/OQ/PQ runner** that tests that same desk. |
| **What it’s for** | Show a hiring manager how you think about **post-market / manufacturing quality** and **computer system validation** — with numbers, aging, and pass/fail evidence, not empty templates. |
| **How to use it** | `./setup.sh` then open the URL. Click Overview → a red CAPA → Validation → Run IQ/OQ/PQ. `./scripts/smoke.sh` proves the protocol. |

**GitHub description:** What: quality desk + CSV binder for a demo med-device plant. For: Sr QE / SQE / validation screens. How: `./setup.sh`.

> All names, lots, complaints, and suppliers are **synthetic**. This is not BC Group (or any real) QMS data.

## Try it

```bash
git clone https://github.com/Coinupbtc/helix-qms-desk.git
cd helix-qms-desk
chmod +x setup.sh
./setup.sh
# open http://127.0.0.1:8765/
```

Or open **[the GitHub Pages build](https://coinupbtc.github.io/helix-qms-desk/)**.

## What the data is (so it is not “fake empty”)

Helix Biomedical Instruments is a made-up OEM (pulse-ox simulators, defib analyzers, infusion testers). The seed is internally consistent:

| Family | Count | What you should notice |
|---|---|---|
| NCs | 16 | Warp, wrong firmware, IFU rev, overdue cal standard |
| CAPAs | 10 | One **overdue** (battery packs); 8D filled in |
| SCARs | 6 | Late UDI-label SCAR; Harbor Battery open |
| Complaints | 10 | Field + internal; MDR line is demo-only |
| Suppliers | 8 | Certs expiring; one ASL **disqualified** (displays) |

KPIs are **computed** (overdue = due date &lt; 2026-08-12 and not closed). Supplier score moves when you open a SCAR.

## What “validation” does

| Stage | Question | Result you want |
|---|---|---|
| **IQ** | Right version, seed checksum, record families, SYNTHETIC banner | Install evidence |
| **OQ** | Unique IDs; empty NC blocked; viewer cannot write or close CAPA; QA Manager can close; audit grows; overdue math matches | Permission + data integrity |
| **PQ** | Complaint → NC → CAPA → SCAR; supplier score drops after SCAR | Intended use |

Open **Validation → Run IQ / OQ / PQ**. The plant dataset is restored afterward. Sign the report (typed name, demo). Screenshot + JSON for a resume packet.

v1.1 adds: live Pareto/aging charts, list filters, collision-safe IDs, CAPA close gates (D4/D5/effectiveness), ECO list, protocol sandbox, RTM, demo e-sign, `scripts/smoke.sh`.

## Photos of results

| Screen | File |
|---|---|
| Week-one decisions | `docs/screenshots/overview.png` |
| CAPA 8D | `docs/screenshots/capa-8d.png` |
| Supplier scorecard | `docs/screenshots/supplier.png` |
| IQ/OQ/PQ report | `docs/screenshots/validation.png` |
| Management review | `docs/screenshots/review-pack.png` |
| Phone (390×844) | `docs/screenshots/phone-overview.png` |

## Roles (OQ)

| Role | Can do |
|---|---|
| Viewer | Read only |
| Quality Engineer | Create NC / CAPA / SCAR / complaint |
| QA Manager | Everything QE can, **plus close CAPA** |

## Resume one-liner

Built a demonstration eQMS desk with live CAPA aging and supplier scoring, and executed IQ/OQ/PQ against that system (unique IDs, access control, audit trail, intended-use chain). Dataset is synthetic.

## License

MIT. Do not use as a real QMS.
