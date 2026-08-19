/* Mutations with permission checks and collision-safe IDs. */
(function (g) {
  const S = () => g.HelixStore;

  function needWrite() {
    if (!S().canWrite()) throw new Error("permission: role is read-only (viewer)");
  }

  function alloc(prefix, list) {
    const id = S().nextId(prefix, list);
    if (list.some((r) => r.id === id)) throw new Error("id collision " + id);
    return id;
  }

  function createNc(input) {
    needWrite();
    const title = (input.title || "").trim();
    const desc = (input.description || "").trim();
    const pn = (input.pn || "").trim();
    if (!title) throw new Error("title required");
    if (!pn) throw new Error("product required");
    if (!desc) throw new Error("description required");
    const id = alloc("NC-2026-", S().state.data.ncs);
    const row = {
      id: id,
      date: S().state.data.meta.today,
      pn: pn,
      lot: input.lot || "",
      qty: input.qty || 1,
      supplier_id: input.supplier_id || null,
      severity: input.severity || "minor",
      source: input.source || "incoming inspection",
      title: title,
      description: desc,
      containment: input.containment || "",
      disposition: input.disposition || "pending",
      status: "open",
      capa_id: input.capa_id || null,
      scar_id: input.scar_id || null,
      complaint_id: input.complaint_id || null,
    };
    S().state.data.ncs.unshift(row);
    S().audit("create_nc", id);
    S().persist();
    return id;
  }

  function createCapa(input) {
    needWrite();
    const id = alloc("CAPA-2026-", S().state.data.capas);
    const due = input.due || "2026-09-30";
    S().state.data.capas.unshift({
      id: id,
      opened: S().state.data.meta.today,
      due: due,
      status: due < S().state.data.meta.today ? "overdue" : "open",
      owner: S().user().name,
      type: input.type || "corrective",
      nc_ids: input.nc_ids || [],
      problem: input.problem || "",
      d2_team: input.d2_team || S().user().name,
      d3_containment: input.d3_containment || "",
      d4_root_cause: input.d4_root_cause || "",
      d5_action: input.d5_action || "",
      d6_implement: "",
      d7_prevent: "",
      d8_congratulate: "",
      effectiveness_due: "2026-11-30",
      effectiveness: "pending",
      supplier_id: input.supplier_id || null,
    });
    (input.nc_ids || []).forEach((ncid) => {
      const nc = S().state.data.ncs.find((n) => n.id === ncid);
      if (nc) nc.capa_id = id;
    });
    S().audit("create_capa", id);
    S().persist();
    return id;
  }

  function closeCapa(id, note, opts) {
    opts = opts || {};
    if (!S().canCloseCapa()) throw new Error("permission: only QA Manager may close a CAPA");
    const row = S().state.data.capas.find((c) => c.id === id);
    if (!row) throw new Error("CAPA not found");
    if (row.status === "closed") throw new Error("CAPA already closed");
    const n = String(note || "").trim();
    if (!opts.protocol) {
      if (!String(row.d4_root_cause || "").trim()) throw new Error("close blocked: D4 root cause required");
      if (!String(row.d5_action || "").trim()) throw new Error("close blocked: D5 action required");
      if (n.length < 20) throw new Error("close blocked: effectiveness note must be at least 20 characters");
    }
    row.status = "closed";
    row.closed = S().state.data.meta.today;
    row.effectiveness = n || row.effectiveness || "protocol waiver";
    S().audit("close_capa", id + (opts.protocol ? " protocol_waiver" : ""));
    S().persist();
  }

  function createScar(input) {
    needWrite();
    if (!input.supplier_id) throw new Error("supplier required");
    const id = alloc("SCAR-2026-", S().state.data.scars);
    S().state.data.scars.unshift({
      id: id,
      date: S().state.data.meta.today,
      supplier_id: input.supplier_id,
      nc_id: input.nc_id || null,
      capa_id: input.capa_id || null,
      status: "open",
      due: input.due || "2026-09-01",
      issue: input.issue || "",
      response: "",
      days_open: 0,
    });
    S().audit("create_scar", id);
    S().persist();
    return id;
  }

  function createComplaint(input) {
    needWrite();
    const id = alloc("CMP-2026-", S().state.data.complaints);
    S().state.data.complaints.unshift({
      id: id,
      date: S().state.data.meta.today,
      pn: input.pn,
      sn: input.sn || "",
      customer: input.customer || "DEMO",
      summary: input.summary || "",
      severity: input.severity || "minor",
      status: "open",
      nc_id: null,
      capa_id: null,
      mdv: "DEMO — not a real MDR assessment",
      closed: null,
    });
    S().audit("create_complaint", id);
    S().persist();
    return id;
  }

  function acceptResidual(id) {
    if (!S().canAcceptRisk()) throw new Error("permission: only QA Manager may accept residual risk");
    const row = (S().state.data.hazards || []).find((h) => h.id === id);
    if (!row) throw new Error("hazard not found");
    row.residual_status = "accepted";
    row.accepted_by = S().user().name;
    row.accepted_on = S().state.data.meta.today;
    S().audit("accept_residual", id);
    S().persist();
    return id;
  }

  g.HelixApp = {
    createNc: createNc,
    createCapa: createCapa,
    closeCapa: closeCapa,
    createScar: createScar,
    createComplaint: createComplaint,
    acceptResidual: acceptResidual,
  };
})(window);
