/* IQ / OQ / PQ against the live desk. Evidence is pass/fail + notes, not theater. */
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
        const ok = d.ncs.length && d.capas.length && d.scars.length && d.suppliers.length && d.complaints.length;
        return {
          pass: ok,
          evidence:
            "NC " + d.ncs.length + ", CAPA " + d.capas.length + ", SCAR " + d.scars.length +
            ", SUP " + d.suppliers.length + ", CMP " + d.complaints.length,
        };
      }),
      rec("IQ-04", "R-10", "Synthetic-data disclaimer present on company record", () => ({
        pass: /SYNTHETIC/i.test(d.meta.company.disclaimer),
        evidence: d.meta.company.disclaimer.slice(0, 80),
      })),
    ];
  }

  function runOq() {
    const S = g.HelixStore;
    const savedRole = S.state.role;
    const tests = [];

    tests.push(rec("OQ-01", "R-01", "New NC gets a unique ID", () => {
      S.state.role = "quality_engineer";
      const before = S.state.data.ncs.map((n) => n.id);
      const id = g.HelixApp.createNc({
        title: "OQ unique-id probe",
        pn: "PX-400",
        description: "Protocol OQ-01",
        severity: "minor",
        source: "protocol",
      });
      const dup = before.includes(id);
      return { pass: !!id && !dup, evidence: "created " + id };
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
        g.HelixApp.closeCapa(open.id);
      } catch (e) {
        blocked = true;
      }
      const stillOpen = S.state.data.capas.find((c) => c.id === open.id).status !== "closed";
      return { pass: blocked && stillOpen, evidence: open.id + " remains " + S.state.data.capas.find((c) => c.id === open.id).status };
    }));

    tests.push(rec("OQ-05", "R-03", "QA Manager can close a CAPA", () => {
      S.state.role = "qa_manager";
      const open = S.state.data.capas.find((c) => c.status !== "closed" && c.id !== "CAPA-2026-09");
      const id = open.id;
      g.HelixApp.closeCapa(id, "OQ-05 protocol close — effectiveness waived for test record");
      const row = S.state.data.capas.find((c) => c.id === id);
      return { pass: row.status === "closed", evidence: id + " status=" + row.status };
    }));

    tests.push(rec("OQ-06", "R-06", "Audit trail grows and has no delete control", () => {
      const n = S.state.data.audit.length;
      S.audit("oq_probe", "OQ-06");
      const grew = S.state.data.audit.length === n + 1;
      const hasDelete = !!document.querySelector("[data-audit-delete]");
      return { pass: grew && !hasDelete, evidence: "audit len " + S.state.data.audit.length + ", delete control=" + hasDelete };
    }));

    tests.push(rec("OQ-07", "R-07", "Overdue CAPA count matches due-date arithmetic", () => {
      const k = g.HelixKpi.kpis();
      const today = S.state.data.meta.today;
      const manual = S.state.data.capas.filter((c) => c.status !== "closed" && c.due < today).length;
      return { pass: k.overdueCapa === manual, evidence: "kpi=" + k.overdueCapa + " manual=" + manual };
    }));

    S.state.role = savedRole;
    return tests;
  }

  function runPq() {
    const S = g.HelixStore;
    const savedRole = S.state.role;
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
      });
      const scar = g.HelixApp.createScar({
        supplier_id: "SUP-01",
        nc_id: nc,
        capa_id: capa,
        issue: "PQ SCAR for housing latch",
      });
      const ok = cmp && nc && capa && scar;
      return { pass: ok, evidence: [cmp, nc, capa, scar].join(" → ") };
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

    S.state.role = savedRole;
    return tests;
  }

  function runAll() {
    const started = new Date().toISOString();
    const iq = runIq();
    const oq = runOq();
    const pq = runPq();
    const all = iq.concat(oq, pq);
    const failed = all.filter((t) => !t.pass);
    const report = {
      started: started,
      finished: new Date().toISOString(),
      executor: g.HelixStore.user().name,
      role: g.HelixStore.state.role,
      version: g.HelixStore.state.data.meta.version,
      checksum: g.HelixStore.state.data.meta.checksum,
      iq: iq,
      oq: oq,
      pq: pq,
      pass: failed.length === 0,
      failed: failed.map((t) => t.id),
      totals: { n: all.length, pass: all.length - failed.length, fail: failed.length },
    };
    g.HelixStore.state.valReport = report;
    g.HelixStore.audit("validation_run", report.pass ? "PASS " + report.totals.pass + "/" + report.totals.n : "FAIL " + report.failed.join(","));
    return report;
  }

  g.HelixVal = { runAll: runAll };
})(window);
