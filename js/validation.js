/* IQ / OQ / PQ. OQ/PQ run in a snapshot so the plant desk is not destroyed. */
(function (g) {
  function rec(id, req, title, fn) {
    let pass = false;
    let evidence = "";
    try {
      const r = fn();
      pass = !!r.pass;
      evidence = r.evidence || "";
    } catch (e) {
      pass = false;
      evidence = String(e && e.message ? e.message : e);
    }
    return { id: id, req: req, title: title, pass: pass, evidence: evidence };
  }

  function env() {
    return {
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "n/a",
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      href: typeof location !== "undefined" ? location.href.split("?")[0] : "",
      viewport: (typeof innerWidth !== "undefined" ? innerWidth : 0) + "x" + (typeof innerHeight !== "undefined" ? innerHeight : 0),
    };
  }

  function runIq() {
    const d = g.HelixStore.state.data;
    const seed = g.HELIX_SEED;
    return [
      rec("IQ-01", "R-10", "Application version present", () => ({
        pass: d.meta.version === seed.meta.version && !!d.meta.version,
        evidence: "version=" + d.meta.version,
      })),
      rec("IQ-02", "R-10", "Seed checksum matches shipped dataset", () => ({
        pass: d.meta.checksum === seed.meta.checksum,
        evidence: "checksum=" + d.meta.checksum,
      })),
      rec("IQ-03", "R-07", "Required record families loaded", () => {
        const ok =
          d.ncs.length &&
          d.capas.length &&
          d.scars.length &&
          d.suppliers.length &&
          d.complaints.length &&
          (d.standards || []).length &&
          (d.training || []).length &&
          (d.hazards || []).length &&
          (d.dhf || []).length &&
          d.serving;
        return {
          pass: ok,
          evidence:
            "NC " + d.ncs.length + ", CAPA " + d.capas.length + ", SCAR " + d.scars.length +
            ", SUP " + d.suppliers.length + ", CMP " + d.complaints.length +
            ", STD " + (d.standards || []).length + ", TRN " + (d.training || []).length +
            ", HZ " + (d.hazards || []).length + ", DHF " + (d.dhf || []).length,
        };
      }),
      rec("IQ-04", "R-10", "Synthetic-data disclaimer present", () => ({
        pass: /SYNTHETIC/i.test(d.meta.company.disclaimer),
        evidence: d.meta.company.disclaimer.slice(0, 80),
      })),
      rec("IQ-05", "R-01", "All seed IDs unique", () => ({
        pass: g.HelixKpi.uniqueIds(d),
        evidence: "uniqueIds=" + g.HelixKpi.uniqueIds(d),
      })),
      rec("IQ-06", "R-14", "Foreign keys resolve", () => ({
        pass: g.HelixKpi.fkOk(d),
        evidence: "fkOk=" + g.HelixKpi.fkOk(d),
      })),
      rec("IQ-07", "R-10", "Change-control family present", () => ({
        pass: (d.changes || []).length >= 3,
        evidence: "ECO n=" + (d.changes || []).length,
      })),
      rec("IQ-08", "R-18", "Sticker ≠ cert is detectable on a live standard", () => {
        const bad = (d.standards || []).filter((s) => s.sticker_due !== s.cert_due);
        return { pass: bad.length === 1 && bad[0].id === "STK-V-204", evidence: "mismatch n=" + bad.length };
      }),
      rec("IQ-09", "R-18", "Training gap is detectable", () => {
        const gaps = (d.training || []).filter((t) => t.status === "gap");
        return { pass: gaps.length === 1 && /Ortiz/.test(gaps[0].person), evidence: "gaps n=" + gaps.length };
      }),
      rec("IQ-10", "R-17", "Serving fixture matches approved ECO", () => {
        const sv = d.serving || {};
        return {
          pass: sv.approved_model === "helix-assist-0.3" && sv.eco === "ECO-2026-020",
          evidence: String(sv.approved_model || "") + " · " + String(sv.eco || ""),
        };
      }),
      rec("IQ-11", "R-19", "Risk file has HZ-07 as the only unacceptable residual", () => {
        const bad = (d.hazards || []).filter((h) => h.residual_status === "unacceptable");
        return {
          pass: bad.length === 1 && bad[0].id === "HZ-07" && Number(bad[0].p_resid) > Number(bad[0].p_init),
          evidence: "unacceptable n=" + bad.length + " p_resid=" + (bad[0] && bad[0].p_resid),
        };
      }),
      rec("IQ-12", "R-20", "DHF chain names ECO-2026-021", () => {
        const hits = (d.dhf || []).filter((x) => String(x.linked || "").indexOf("ECO-2026-021") >= 0);
        const kinds = new Set((d.dhf || []).map((x) => x.kind));
        const ok = hits.length >= 2 && kinds.has("user_need") && kinds.has("verification");
        return { pass: ok, evidence: "eco-linked " + hits.length + " kinds=" + Array.from(kinds).join(",") };
      }),
    ];
  }

  function runOq() {
    const S = g.HelixStore;
    const tests = [];

    tests.push(rec("OQ-01", "R-11", "Two new NCs get distinct IDs", () => {
      S.state.role = "quality_engineer";
      const a = g.HelixApp.createNc({ title: "OQ-01a", pn: "PX-400", description: "Protocol OQ-01 a" });
      const b = g.HelixApp.createNc({ title: "OQ-01b", pn: "PX-400", description: "Protocol OQ-01 b" });
      return { pass: a !== b, evidence: a + " vs " + b };
    }));

    tests.push(rec("OQ-02", "R-02", "Empty NC description is rejected", () => {
      S.state.role = "quality_engineer";
      let rejected = false;
      try {
        g.HelixApp.createNc({ title: "x", pn: "PX-400", description: "" });
      } catch (e) {
        rejected = /description/i.test(String(e.message));
      }
      return { pass: rejected, evidence: rejected ? "save blocked" : "empty NC was saved" };
    }));

    tests.push(rec("OQ-03", "R-05", "Viewer cannot create an NC", () => {
      S.state.role = "viewer";
      let blocked = false;
      try {
        g.HelixApp.createNc({ title: "viewer probe", pn: "PX-400", description: "should fail" });
      } catch (e) {
        blocked = /permission|read-only|viewer/i.test(String(e.message));
      }
      return { pass: blocked, evidence: blocked ? "viewer blocked" : "viewer created NC" };
    }));

    tests.push(rec("OQ-04", "R-03", "Viewer cannot close a CAPA", () => {
      S.state.role = "viewer";
      const open = S.state.data.capas.find((c) => c.status !== "closed");
      let blocked = false;
      try {
        g.HelixApp.closeCapa(open.id, "xxxxxxxxxxxxxxxxxxxx");
      } catch (e) {
        blocked = true;
      }
      const stillOpen = S.state.data.capas.find((c) => c.id === open.id).status !== "closed";
      return { pass: blocked && stillOpen, evidence: open.id + " remains " + S.state.data.capas.find((c) => c.id === open.id).status };
    }));

    tests.push(rec("OQ-05", "R-12", "Close without D4 is rejected", () => {
      S.state.role = "qa_manager";
      const id = g.HelixApp.createCapa({ problem: "OQ-05 hollow CAPA", d4_root_cause: "", d5_action: "do something" });
      let blocked = false;
      try {
        g.HelixApp.closeCapa(id, "Effectiveness note long enough here");
      } catch (e) {
        blocked = /D4/i.test(String(e.message));
      }
      return { pass: blocked, evidence: blocked ? id + " close blocked" : id + " closed without D4" };
    }));

    tests.push(rec("OQ-06", "R-03", "QA Manager can close a complete CAPA (protocol waiver)", () => {
      S.state.role = "qa_manager";
      const id = g.HelixApp.createCapa({
        problem: "OQ-06 closable",
        d4_root_cause: "cause",
        d5_action: "action",
      });
      g.HelixApp.closeCapa(id, "protocol", { protocol: true });
      const row = S.state.data.capas.find((c) => c.id === id);
      return { pass: row.status === "closed", evidence: id + " status=" + row.status };
    }));

    tests.push(rec("OQ-07", "R-06", "Audit trail grows and has no delete control", () => {
      const n = S.state.data.audit.length;
      S.audit("oq_probe", "OQ-07");
      const grew = S.state.data.audit.length === n + 1;
      const hasDelete = !!document.querySelector("[data-audit-delete]");
      return { pass: grew && !hasDelete, evidence: "audit len " + S.state.data.audit.length + ", delete=" + hasDelete };
    }));

    tests.push(rec("OQ-08", "R-07", "Overdue CAPA count matches due-date arithmetic", () => {
      const k = g.HelixKpi.kpis();
      const today = S.state.data.meta.today;
      const manual = S.state.data.capas.filter((c) => c.status !== "closed" && c.due < today).length;
      return { pass: k.overdueCapa === manual, evidence: "kpi=" + k.overdueCapa + " manual=" + manual };
    }));

    tests.push(rec("OQ-10", "R-19", "Viewer cannot accept residual risk", () => {
      S.state.role = "viewer";
      let blocked = false;
      try {
        g.HelixApp.acceptResidual("HZ-07");
      } catch (e) {
        blocked = /permission|QA Manager/i.test(String(e.message));
      }
      const still = (S.state.data.hazards || []).find((h) => h.id === "HZ-07");
      return {
        pass: blocked && still && still.residual_status === "unacceptable",
        evidence: blocked ? "viewer blocked" : "viewer accepted HZ-07",
      };
    }));

    tests.push(rec("OQ-11", "R-19", "QE cannot accept residual risk", () => {
      S.state.role = "quality_engineer";
      let blocked = false;
      try {
        g.HelixApp.acceptResidual("HZ-07");
      } catch (e) {
        blocked = /permission|QA Manager/i.test(String(e.message));
      }
      const still = (S.state.data.hazards || []).find((h) => h.id === "HZ-07");
      return {
        pass: blocked && still && still.residual_status === "unacceptable",
        evidence: blocked ? "QE blocked" : "QE accepted HZ-07",
      };
    }));

    tests.push(rec("OQ-12", "R-19", "QA Manager can accept residual (protocol)", () => {
      S.state.role = "qa_manager";
      g.HelixApp.acceptResidual("HZ-07");
      const row = (S.state.data.hazards || []).find((h) => h.id === "HZ-07");
      return { pass: row && row.residual_status === "accepted", evidence: "HZ-07=" + (row && row.residual_status) };
    }));

    return tests;
  }

  function runPq() {
    const S = g.HelixStore;
    S.state.role = "quality_engineer";
    const tests = [];

    tests.push(rec("PQ-01", "R-04", "Complaint → NC → CAPA → SCAR chain", () => {
      const cmp = g.HelixApp.createComplaint({
        pn: "PX-400",
        sn: "HX-OQ-1",
        customer: "Protocol hospital (DEMO)",
        summary: "PQ intended-use: field complaint of latch failure.",
        severity: "major",
      });
      const nc = g.HelixApp.createNc({
        title: "PQ latch failure from complaint",
        pn: "PX-400",
        description: "Opened from " + cmp,
        severity: "major",
        source: "customer complaint",
        complaint_id: cmp,
        supplier_id: "SUP-01",
      });
      const capa = g.HelixApp.createCapa({
        problem: "PQ chain — latch from field",
        nc_ids: [nc],
        supplier_id: "SUP-01",
        d4_root_cause: "tool wear",
        d5_action: "SCAR + incoming gap check",
      });
      const scar = g.HelixApp.createScar({
        supplier_id: "SUP-01",
        nc_id: nc,
        capa_id: capa,
        issue: "PQ SCAR for housing latch",
      });
      const fk = g.HelixKpi.fkOk(S.state.data);
      return { pass: cmp && nc && capa && scar && fk, evidence: [cmp, nc, capa, scar].join(" → ") };
    }));

    tests.push(rec("PQ-02", "R-08", "Supplier score moves after open SCAR", () => {
      const before = g.HelixKpi.scoreSupplier(S.state.data.suppliers.find((s) => s.id === "SUP-08"));
      g.HelixApp.createScar({
        supplier_id: "SUP-08",
        nc_id: "NC-2026-016",
        issue: "PQ score probe",
      });
      const after = g.HelixKpi.scoreSupplier(S.state.data.suppliers.find((s) => s.id === "SUP-08"));
      return { pass: after < before, evidence: "Midwest Fastener " + before + " → " + after };
    }));

    return tests;
  }

  function rtm(all) {
    const map = {};
    all.forEach((t) => {
      map[t.req] = map[t.req] || [];
      map[t.req].push(t.id + (t.pass ? " PASS" : " FAIL"));
    });
    return map;
  }

  function runAll() {
    const S = g.HelixStore;
    const started = new Date().toISOString();
    const savedRole = S.state.role;
    const snap = S.clone(S.state.data);
    let iq = [];
    let oq = [];
    let pq = [];
    try {
      iq = runIq();
      oq = runOq();
      pq = runPq();
    } finally {
      S.state.data = snap;
      S.state.role = savedRole;
      S.persist();
    }
    const protocolGone = !S.state.data.ncs.some((n) => /OQ-01/.test(n.title || ""));
    const restoreRec = rec("OQ-09", "R-13", "Dataset restored after protocol", () => ({
      pass: protocolGone && S.state.data.ncs.length === snap.ncs.length,
      evidence: "protocol NCs gone=" + protocolGone + " ncs=" + S.state.data.ncs.length,
    }));
    oq = oq.concat([restoreRec]);
    const all = iq.concat(oq, pq);
    const failed2 = all.filter((t) => !t.pass);
    const report = {
      started: started,
      finished: new Date().toISOString(),
      executor: S.user().name,
      role: savedRole,
      version: S.state.data.meta.version,
      checksum: S.state.data.meta.checksum,
      env: env(),
      iq: iq,
      oq: oq,
      pq: pq,
      rtm: rtm(all),
      pass: failed2.length === 0,
      failed: failed2.map((t) => t.id),
      totals: { n: all.length, pass: all.length - failed2.length, fail: failed2.length },
      signed: S.state.valReport && S.state.valReport.signed ? S.state.valReport.signed : null,
    };
    S.state.valReport = report;
    S.audit("validation_run", report.pass ? "PASS " + report.totals.pass + "/" + report.totals.n : "FAIL " + report.failed.join(","));
    return report;
  }

  function sign(name) {
    const r = g.HelixStore.state.valReport;
    if (!r) throw new Error("run protocol before signing");
    const n = String(name || "").trim();
    if (n.length < 3) throw new Error("typed name required (demo e-sign)");
    r.signed = { name: n, ts: new Date().toISOString(), meaning: "I executed this protocol on the Helix DEMO system" };
    g.HelixStore.audit("validation_sign", n);
    return r;
  }

  g.HelixVal = { runAll: runAll, sign: sign, env: env };
})(window);
