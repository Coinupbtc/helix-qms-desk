/* DOM views. Keep copy in plant English, stats second. */
(function (g) {
  const el = (html) => {
    const d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pill(status) {
    const s = String(status || "");
    let k = "watch";
    if (s === "closed" || s === "ok" || s === "pass" || s === "Approved" || s === "acceptable" || s === "accepted" || s === "released") k = "ok";
    if (s === "open" || s === "linked" || s === "implementation" || s === "draft") k = "info";
    if (s === "overdue" || s === "late" || s === "critical" || s === "bad" || s === "unacceptable" || /Disqualified/i.test(s)) k = "bad";
    if (s === "major" || s === "Conditional" || s === "watch" || s === "alarp" || s === "pending" || s === "in verification") k = "watch";
    return '<span class="pill ' + k + '">' + esc(s) + "</span>";
  }

  function product(pn) {
    const p = g.HelixStore.state.data.products.find((x) => x.pn === pn);
    return p ? p.pn + " · " + p.name : pn || "—";
  }

  function supplierName(id) {
    const s = g.HelixStore.state.data.suppliers.find((x) => x.id === id);
    return s ? s.name : "—";
  }

  function plantBoard() {
    const k = g.HelixKpi.kpis();
    const d = g.HelixStore.state.data;
    const overdue = d.capas.filter((c) => c.status !== "closed" && c.due < d.meta.today);
    const hotSup = d.suppliers
      .map((s) => Object.assign({}, s, { live: g.HelixKpi.scoreSupplier(s) }))
      .sort((a, b) => a.live - b.live)
      .slice(0, 3);
    return `
      <section class="hero">
        <p class="kicker">What needs a decision this week</p>
        <h1>Open quality work at Helix <span class="demo">DEMO</span></h1>
        <p class="lede">Charts and aging. Week-one story is on Overview.</p>
        <p><button type="button" class="link" data-view-jump="overview">Back to Monday war-room</button></p>
      </section>
      <div class="kpi-grid">
        <article class="kpi ${k.overdueCapa ? "alert" : ""}"><div class="n">${k.overdueCapa}</div><div class="l">Overdue CAPAs</div><p>Due date passed, still open.</p></article>
        <article class="kpi"><div class="n">${k.openNc}</div><div class="l">Open NCs</div><p>Not closed in MRB.</p></article>
        <article class="kpi ${k.openScar ? "warn" : ""}"><div class="n">${k.openScar}</div><div class="l">Open / late SCARs</div><p>Supplier actions waiting.</p></article>
        <article class="kpi"><div class="n">${k.openCmp}</div><div class="l">Open complaints</div><p>Field or internal, not closed.</p></article>
        <article class="kpi ${k.expiredCerts ? "alert" : ""}"><div class="n">${k.expiringCerts}</div><div class="l">Certs in 90 days</div><p>${k.expiredCerts} already expired vs ${d.meta.today}.</p></article>
        <article class="kpi"><div class="n">${k.closedCapaYtd}</div><div class="l">CAPAs closed YTD</div><p>${k.medianCycleDays == null ? "—" : k.medianCycleDays + "d median cycle"} · ${k.complaintsYtd} complaints YTD.</p></article>
      </div>
      <div class="split">
        <section class="card">
          <h2>NCs by month</h2>
          ${g.HelixKpi.svgBars(g.HelixKpi.byMonth(d.ncs, "date"))}
        </section>
        <section class="card">
          <h2>CAPA aging (open)</h2>
          ${g.HelixKpi.svgBars(g.HelixKpi.capaAging(), "#8a5a10")}
        </section>
      </div>
      <section class="card">
        <h2>Pareto — NCs by supplier</h2>
        ${g.HelixKpi.svgBars(g.HelixKpi.paretoNc().slice(0, 6), "#9b1d2a")}
      </section>
      <div class="split">
        <section class="card">
          <h2>Overdue CAPAs</h2>
          ${overdue.length ? overdue.map((c) => `
            <button class="rowlink" data-go="capa" data-id="${esc(c.id)}">
              <strong>${esc(c.id)}</strong> ${pill(c.status)}
              <span>${esc(c.problem)}</span>
              <em>due ${esc(c.due)} · ${esc(c.owner)}</em>
            </button>`).join("") : "<p class='empty'>None overdue.</p>"}
        </section>
        <section class="card">
          <h2>Weakest suppliers</h2>
          ${hotSup.map((s) => `
            <button class="rowlink" data-go="supplier" data-id="${esc(s.id)}">
              <strong>${esc(s.name)}</strong> ${pill(g.HelixKpi.band(s.live))}
              <span>Score ${s.live} · ${esc(s.asl)} · cert ${esc(s.cert_expires)}</span>
            </button>`).join("")}
        </section>
      </div>
      <section class="card">
        <h2>How to read this demo</h2>
        <ol class="plain">
          <li>Open an NC, follow it to CAPA and SCAR.</li>
          <li>Switch role to Viewer and try to close a CAPA — it should refuse.</li>
          <li>Run <strong>Validation</strong> for IQ/OQ/PQ evidence against this same desk.</li>
        </ol>
      </section>`;
  }

  function table(headers, rows) {
    return `<div class="tablewrap"><table><thead><tr>${headers.map((h) => "<th>" + h + "</th>").join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function toolbar(ph) {
    return `<div class="toolbar"><input id="q" type="search" placeholder="${esc(ph)}" aria-label="Filter this list"></div>`;
  }

  function ncs() {
    const d = g.HelixStore.state.data;
    const rows = d.ncs.map((n) => `
      <tr data-go="nc" data-id="${esc(n.id)}">
        <td>${esc(n.id)}</td><td>${esc(n.date)}</td><td>${esc(n.pn)}</td>
        <td>${esc(n.title)}</td><td>${pill(n.severity)}</td><td>${pill(n.status)}</td>
        <td>${esc(n.capa_id || "—")}</td>
      </tr>`).join("");
    return `<section class="hero"><h1>Nonconformances</h1><p class="lede">Incoming, in-process, audit, and complaint-driven NCs. Filter, then click a row.</p>
      ${g.HelixStore.canWrite() ? '<button class="btn" data-action="new-nc">Log NC</button>' : ""}</section>
      ${toolbar("Filter by ID, PN, title, status…")}
      ${table(["ID","Date","PN","Title","Severity","Status","CAPA"], rows)}`;
  }

  function capas() {
    const d = g.HelixStore.state.data;
    const rows = d.capas.map((c) => `
      <tr data-go="capa" data-id="${esc(c.id)}">
        <td>${esc(c.id)}</td><td>${esc(c.opened)}</td><td>${esc(c.due)}</td>
        <td>${esc(c.problem.slice(0, 72))}${c.problem.length > 72 ? "…" : ""}</td>
        <td>${pill(c.status)}</td><td>${esc(c.owner)}</td>
      </tr>`).join("");
    return `<section class="hero"><h1>CAPA</h1><p class="lede">8D-style records. Close requires D4, D5, and a 20+ character effectiveness note. Only QA Manager.</p></section>
      ${toolbar("Filter CAPAs…")}
      ${table(["ID","Opened","Due","Problem","Status","Owner"], rows)}`;
  }

  function complaints() {
    const d = g.HelixStore.state.data;
    const rows = d.complaints.map((c) => `
      <tr data-go="cmp" data-id="${esc(c.id)}">
        <td>${esc(c.id)}</td><td>${esc(c.date)}</td><td>${esc(c.pn)}</td>
        <td>${esc(c.summary)}</td><td>${pill(c.severity)}</td><td>${pill(c.status)}</td>
        <td>${esc(c.nc_id || "—")}</td>
      </tr>`).join("");
    return `<section class="hero"><h1>Complaints</h1><p class="lede">Field and internal. MDR line is a demo assessment, not a real filing.</p></section>
      ${toolbar("Filter complaints…")}
      ${table(["ID","Date","PN","Summary","Sev","Status","NC"], rows)}`;
  }

  function suppliers() {
    const d = g.HelixStore.state.data;
    const rows = d.suppliers.map((s) => {
      const live = g.HelixKpi.scoreSupplier(s);
      return `<tr data-go="supplier" data-id="${esc(s.id)}">
        <td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.scope)}</td>
        <td>${esc(s.cert_expires)}</td><td>${pill(s.asl)}</td>
        <td>${live}</td><td>${s.on_time_pct}%</td><td>${s.ppm}</td>
      </tr>`;
    }).join("");
    return `<section class="hero"><h1>Suppliers (ASL)</h1><p class="lede">Score is live: open SCARs, PPM, on-time, cert clock, ASL status.</p></section>
      ${toolbar("Filter suppliers…")}
      ${table(["ID","Name","Scope","Cert expires","ASL","Score","On-time","PPM"], rows)}`;
  }

  function scars() {
    const d = g.HelixStore.state.data;
    const rows = d.scars.map((s) => `
      <tr data-go="scar" data-id="${esc(s.id)}">
        <td>${esc(s.id)}</td><td>${esc(s.date)}</td><td>${esc(supplierName(s.supplier_id))}</td>
        <td>${esc(s.issue)}</td><td>${pill(s.status)}</td><td>${esc(s.due)}</td>
      </tr>`).join("");
    return `<section class="hero"><h1>SCARs</h1><p class="lede">Supplier corrective actions tied to NC/CAPA.</p></section>
      ${toolbar("Filter SCARs…")}
      ${table(["ID","Date","Supplier","Issue","Status","Due"], rows)}`;
  }

  function detailNc(id) {
    const n = g.HelixStore.state.data.ncs.find((x) => x.id === id);
    if (!n) return "<p>Not found.</p>";
    return `<section class="hero"><p class="kicker">Nonconformance</p><h1>${esc(n.id)}</h1>${pill(n.status)} ${pill(n.severity)}</section>
      <section class="card prose">
        <h2>${esc(n.title)}</h2>
        <p>${esc(n.description)}</p>
        <dl>
          <dt>Product</dt><dd>${esc(product(n.pn))} · lot ${esc(n.lot || "—")} · qty ${esc(n.qty)}</dd>
          <dt>Source</dt><dd>${esc(n.source)} · ${esc(n.date)}</dd>
          <dt>Supplier</dt><dd>${esc(supplierName(n.supplier_id))}</dd>
          <dt>Containment</dt><dd>${esc(n.containment || "—")}</dd>
          <dt>Disposition</dt><dd>${esc(n.disposition)}</dd>
          <dt>Links</dt><dd>
            ${n.capa_id ? `<button class="link" data-go="capa" data-id="${esc(n.capa_id)}">${esc(n.capa_id)}</button>` : "—"}
            · ${n.scar_id ? `<button class="link" data-go="scar" data-id="${esc(n.scar_id)}">${esc(n.scar_id)}</button>` : "SCAR —"}
            · ${n.complaint_id ? `<button class="link" data-go="cmp" data-id="${esc(n.complaint_id)}">${esc(n.complaint_id)}</button>` : "CMP —"}
            ${n.supplier_id ? ` · <button class="link" data-go="supplier" data-id="${esc(n.supplier_id)}">${esc(supplierName(n.supplier_id))}</button>` : ""}
          </dd>
        </dl>
      </section>`;
  }

  function detailCapa(id) {
    if (g.HelixWar) {
      if (id === "CAPA-2026-11") g.HelixWar.mark("capa11");
      if (id === "CAPA-2026-09") g.HelixWar.mark("harbor");
    }
    const c = g.HelixStore.state.data.capas.find((x) => x.id === id);
    if (!c) return "<p>Not found.</p>";
    const steps = [
      ["D1 Problem", c.problem],
      ["D2 Team", c.d2_team],
      ["D3 Containment", c.d3_containment],
      ["D4 Root cause", c.d4_root_cause],
      ["D5 Action", c.d5_action],
      ["D6 Implement", c.d6_implement],
      ["D7 Prevent", c.d7_prevent],
      ["D8 Recognize", c.d8_congratulate],
    ];
    return `<section class="hero"><p class="kicker">CAPA</p><h1>${esc(c.id)}</h1>${pill(c.status)}
      <p>Owner ${esc(c.owner)} · due ${esc(c.due)} · effectiveness ${esc(c.effectiveness)}</p>
      ${g.HelixStore.canCloseCapa() && c.status !== "closed" ? `
        <form class="closebox" id="close-capa-form" data-id="${esc(c.id)}">
          <label>Effectiveness note (min 20 chars)
            <textarea name="note" rows="3" required minlength="20" placeholder="What we checked, over what period, result."></textarea>
          </label>
          <p class="err" id="close-err" hidden></p>
          <button class="btn primary" type="submit">Close CAPA</button>
        </form>` : ""}
      ${!g.HelixStore.canCloseCapa() && c.status !== "closed" ? '<p class="hint">Switch role to QA Manager to close. Close also needs D4 + D5 filled.</p>' : ""}
      </section>
      <section class="card prose">
        ${steps.map(([k,v]) => `<h3>${k}</h3><p>${esc(v || "—")}</p>`).join("")}
        <p>NCs: ${esc((c.nc_ids || []).join(", ") || "—")} · Supplier ${esc(supplierName(c.supplier_id))}</p>
      </section>`;
  }

  function detailSup(id) {
    const s = g.HelixStore.state.data.suppliers.find((x) => x.id === id);
    if (!s) return "<p>Not found.</p>";
    const live = g.HelixKpi.scoreSupplier(s);
    const scars = g.HelixStore.state.data.scars.filter((x) => x.supplier_id === id);
    return `<section class="hero"><p class="kicker">Supplier</p><h1>${esc(s.name)}</h1>
      <p>Score <strong>${live}</strong> ${pill(g.HelixKpi.band(live))} · ${pill(s.asl)}</p></section>
      <section class="card prose">
        <dl>
          <dt>Scope</dt><dd>${esc(s.scope)}</dd>
          <dt>Cert</dt><dd>${esc(s.iso)} expires ${esc(s.cert_expires)} · last audit ${esc(s.last_audit)}</dd>
          <dt>Performance</dt><dd>On-time ${s.on_time_pct}% · PPM ${s.ppm}</dd>
        </dl>
        <h3>SCARs</h3>
        ${scars.map((x) => `<p><strong>${esc(x.id)}</strong> ${pill(x.status)} — ${esc(x.issue)}</p>`).join("") || "<p>None.</p>"}
      </section>`;
  }

  function detailCmp(id) {
    const c = g.HelixStore.state.data.complaints.find((x) => x.id === id);
    if (!c) return "<p>Not found.</p>";
    return `<section class="hero"><p class="kicker">Complaint</p><h1>${esc(c.id)}</h1>${pill(c.status)}</section>
      <section class="card prose">
        <p>${esc(c.summary)}</p>
        <dl>
          <dt>Customer</dt><dd>${esc(c.customer)}</dd>
          <dt>Product</dt><dd>${esc(product(c.pn))} · SN ${esc(c.sn)}</dd>
          <dt>MDR / MDV (demo)</dt><dd>${esc(c.mdv)}</dd>
          <dt>Links</dt><dd>NC ${esc(c.nc_id || "—")} · CAPA ${esc(c.capa_id || "—")}</dd>
        </dl>
      </section>`;
  }

  function detailScar(id) {
    const s = g.HelixStore.state.data.scars.find((x) => x.id === id);
    if (!s) return "<p>Not found.</p>";
    return `<section class="hero"><p class="kicker">SCAR</p><h1>${esc(s.id)}</h1>${pill(s.status)}</section>
      <section class="card prose">
        <p>${esc(s.issue)}</p>
        <p>Supplier ${esc(supplierName(s.supplier_id))} · NC ${esc(s.nc_id || "—")} · CAPA ${esc(s.capa_id || "—")}</p>
        <p>Due ${esc(s.due)} · Response: ${esc(s.response || "—")}</p>
      </section>`;
  }

  function valView() {
    const r = g.HelixStore.state.valReport;
    const reqs = g.HelixStore.state.data.requirements;
    let body = `<section class="hero"><h1>Computer system validation</h1>
      <p class="lede">Two protocols, same rule: presence is not integrity. Desk first, then Helix Assist. Demonstration e-sign, not 21 CFR 11 certified.</p>
      <button class="btn primary" data-action="run-val">Run desk IQ / OQ / PQ</button>
      <button class="btn primary" data-action="run-serve">Run serving protocol</button>
      <button class="btn" data-action="reset">Reset demo data</button>
    </section>`;
    if (g.HelixServe) body += g.HelixServe.viewExtras();
    if (r) {
      const block = (name, tests) => `
        <h3>${name} — ${tests.filter((t) => t.pass).length}/${tests.length} pass</h3>
        <div class="tablewrap"><table><thead><tr><th>Test</th><th>Req</th><th>Result</th><th>Evidence</th></tr></thead><tbody>
        ${tests.map((t) => `<tr><td>${esc(t.id)} ${esc(t.title)}</td><td>${esc(t.req)}</td><td>${pill(t.pass ? "pass" : "fail")}</td><td>${esc(t.evidence)}</td></tr>`).join("")}
        </tbody></table></div>`;
      const rtmRows = Object.keys(r.rtm || {}).sort().map((k) =>
        `<tr><td>${esc(k)}</td><td>${esc((r.rtm[k] || []).join(", "))}</td></tr>`
      ).join("");
      body += `<section class="card report" id="val-report">
        <h2>Execution report ${r.pass ? pill("pass") : pill("fail")}</h2>
        <p class="nums">${esc(r.executor)} · ${esc(r.finished)} · app ${esc(r.version)} · seed ${esc(r.checksum)} · <strong>${r.totals.pass}/${r.totals.n}</strong></p>
        <p class="hint">Env: ${esc((r.env && r.env.tz) || "—")} · ${esc((r.env && r.env.viewport) || "")}</p>
        ${block("IQ Installation", r.iq)}
        ${block("OQ Operational", r.oq)}
        ${block("PQ Performance / intended use", r.pq)}
        <h3>Traceability (req → tests)</h3>
        <div class="tablewrap"><table><thead><tr><th>Req</th><th>Tests</th></tr></thead><tbody>${rtmRows}</tbody></table></div>
        ${r.failed.length ? "<p class='err'>Deviations: " + esc(r.failed.join(", ")) + "</p>" : "<p>No deviations. Protocol complete. Dataset restored.</p>"}
        <p>${r.signed ? "Signed: " + esc(r.signed.name) + " · " + esc(r.signed.ts) : ""}</p>
        <form id="sign-form" class="form">
          <label>Typed name (demo e-sign) <input name="name" required minlength="3" placeholder="Morgan Hale"></label>
          <button class="btn" type="submit">Sign report</button>
        </form>
        <button class="btn" data-action="dl-val" type="button">Download report JSON</button>
      </section>`;
    }
    body += `<section class="card"><h2>User requirements</h2>
      <div class="tablewrap"><table><thead><tr><th>ID</th><th>Requirement</th><th>Risk if wrong</th></tr></thead><tbody>
      ${reqs.map((x) => `<tr><td>${esc(x.id)}</td><td>${esc(x.text)}</td><td>${esc(x.risk)}</td></tr>`).join("")}
      </tbody></table></div></section>`;
    return body;
  }

  function rpn(h) {
    return Number(h.s || 0) * Number(h.p_resid || 0);
  }

  function risk() {
    const d = g.HelixStore.state.data;
    const k = g.HelixKpi.kpis();
    const rows = (d.hazards || []).map((h) => `
      <tr data-go="hz" data-id="${esc(h.id)}">
        <td>${esc(h.id)}</td><td>${esc(h.pn)}</td>
        <td>${esc(h.hazard)}</td>
        <td>${esc(h.s)}×${esc(h.p_resid)}=${rpn(h)}</td>
        <td>${pill(h.residual_status)}</td>
      </tr>`).join("");
    return `<section class="hero">
        <p class="kicker">ISO 14971 · demonstration file</p>
        <h1>Risk management</h1>
        <p class="lede">Severity × residual probability after the named control. One row is <strong>unacceptable</strong> because the MES lockout reads the sticker.</p>
      </section>
      <div class="kpi-grid">
        <article class="kpi alert"><div class="n">${k.unacceptableRisk}</div><div class="l">Unacceptable residual</div><p>Must not ship. Open ECO-2026-021.</p></article>
        <article class="kpi warn"><div class="n">${k.alarpRisk}</div><div class="l">ALARP</div><p>Benefit-risk still owned by QA.</p></article>
        <article class="kpi"><div class="n">${k.hazardN}</div><div class="l">Hazards in file</div><p>Computed RPN on each row.</p></article>
        <article class="kpi ${k.dhfOpen ? "warn" : ""}"><div class="n">${k.dhfOpen}</div><div class="l">Open DHF items</div><p>User need through validation.</p></article>
      </div>
      ${toolbar("Filter hazards")}
      ${table(["ID", "PN", "Hazard", "Residual RPN", "Status"], rows)}`;
  }

  function detailHz(id) {
    if (g.HelixWar) g.HelixWar.mark("risk");
    const h = (g.HelixStore.state.data.hazards || []).find((x) => x.id === id);
    if (!h) return "<p>Not found.</p>";
    const worse = Number(h.p_resid) > Number(h.p_init);
    return `<section class="hero">
        <p class="kicker">${esc(h.standard)} · ${esc(h.pn)}</p>
        <h1>${esc(h.id)}</h1>${pill(h.residual_status)}
        <p class="lede">${esc(h.hazard)}</p>
      </section>
      <section class="card prose">
        <dl>
          <dt>Harm</dt><dd>${esc(h.harm)}</dd>
          <dt>Situation</dt><dd>${esc(h.situation)}</dd>
          <dt>Initial S × P</dt><dd>${esc(h.s)} × ${esc(h.p_init)} = ${Number(h.s) * Number(h.p_init)}</dd>
          <dt>Named control</dt><dd>${esc(h.control)}</dd>
          <dt>Residual S × P</dt><dd>${esc(h.s)} × ${esc(h.p_resid)} = ${rpn(h)}${worse ? " — residual probability went <strong>up</strong> after the control shipped" : ""}</dd>
          <dt>Links</dt><dd>${esc(h.linked)}</dd>
        </dl>
        ${h.note ? "<p>" + esc(h.note) + "</p>" : ""}
        ${h.residual_status === "unacceptable" ? '<p><button class="btn primary" type="button" data-action="accept-risk" data-id="' + esc(h.id) + '">Accept residual (QA Manager only)</button></p>' : ""}
        ${h.accepted_by ? "<p>Accepted by " + esc(h.accepted_by) + " on " + esc(h.accepted_on) + " (demo).</p>" : ""}
      </section>`;
  }

  function changes() {
    const d = g.HelixStore.state.data;
    const ecos = (d.changes || []).map((e) => `
      <tr data-go="eco" data-id="${esc(e.id)}">
        <td>${esc(e.id)}</td><td>${esc(e.date)}</td>
        <td>${esc(e.title)}</td><td>${pill(e.status)}</td><td>${esc(e.linked)}</td>
      </tr>`).join("");
    const kinds = { user_need: "User need", design_input: "Design input", design_output: "Design output", verification: "Verification", validation: "Validation" };
    const dhf = (d.dhf || []).map((x) => `
      <tr>
        <td>${esc(x.id)}</td><td>${esc(kinds[x.kind] || x.kind)}</td>
        <td>${esc(x.pn)}</td><td>${esc(x.text)}</td>
        <td>${pill(x.status)}</td><td>${esc(x.linked)}</td>
      </tr>`).join("");
    return `<section class="hero">
        <p class="kicker">21 CFR 820.30 · demonstration DHF</p>
        <h1>Change control + design file</h1>
        <p class="lede">ECOs are not the design history. The chain is user need → input → output → verification → validation. ECO-2026-021 is open because VE-01 never ran.</p>
      </section>
      <section class="card">
        <h2>Engineering change orders</h2>
        ${toolbar("Filter ECOs")}
        ${table(["ID", "Date", "Title", "Status", "Linked"], ecos)}
      </section>
      <section class="card">
        <h2>Design history (lite)</h2>
        ${table(["ID", "Kind", "PN", "Statement", "Status", "Linked"], dhf)}
      </section>`;
  }

  function detailEco(id) {
    const e = (g.HelixStore.state.data.changes || []).find((x) => x.id === id);
    if (!e) return "<p>Not found.</p>";
    const chain = (g.HelixStore.state.data.dhf || []).filter((x) => String(x.linked || "").indexOf(e.id) >= 0);
    return `<section class="hero"><p class="kicker">Change control</p><h1>${esc(e.id)}</h1>${pill(e.status)}
      <p class="lede">${esc(e.title)}</p></section>
      <section class="card prose">
        <p>Opened ${esc(e.date)} · linked ${esc(e.linked)}</p>
        ${e.id === "ECO-2026-021" ? "<p>This ECO is the design output for DI-01. Verification VE-01 is still pending — do not treat released MES as a risk control.</p>" : ""}
        <h3>DHF items that name this ECO</h3>
        ${chain.length ? "<ul>" + chain.map((x) => "<li>" + esc(x.id) + " — " + esc(x.text) + "</li>").join("") + "</ul>" : "<p>None in the lite file.</p>"}
      </section>`;
  }

  function reports() {
    const k = g.HelixKpi.kpis();
    const d = g.HelixStore.state.data;
    const ecos = d.changes || [];
    return `<section class="hero"><h1>Management review pack</h1>
      <p class="lede">One page a QA Manager would actually bring. Print or save as PDF from the browser.</p>
      <button class="btn primary" data-action="print">Print / PDF</button></section>
      <section class="card prose" id="mgmt-review">
        <p class="kicker">${esc(d.meta.company.name)} · ${esc(d.meta.today)} · SYNTHETIC · ${esc(d.meta.qms)}</p>
        <h2>Quality summary</h2>
        <ul>
          <li><strong>${k.overdueCapa}</strong> overdue CAPAs · median closed cycle <strong>${k.medianCycleDays == null ? "—" : k.medianCycleDays + " days"}</strong></li>
          <li><strong>${k.openNc}</strong> open NCs · <strong>${k.criticalOpen}</strong> critical still open</li>
          <li><strong>${k.openScar}</strong> open/late SCARs (${k.lateScar} late) · <strong>${k.expiringCerts}</strong> certs inside 90 days (${k.expiredCerts} expired)</li>
          <li>YTD: ${k.complaintsYtd} complaints, ${k.closedCapaYtd} CAPAs closed</li>
          <li><strong>${k.stickerMismatch}</strong> standards with sticker ≠ cert · <strong>${k.trainingGaps}</strong> training gaps</li>
          <li><strong>${k.unacceptableRisk}</strong> unacceptable residual risks (ISO 14971) · <strong>${k.dhfOpen}</strong> open design-control items</li>
        </ul>
        <h3>NCs by month</h3>
        ${g.HelixKpi.svgBars(g.HelixKpi.byMonth(d.ncs, "date"))}
        <h3>CAPA aging (open)</h3>
        ${g.HelixKpi.svgBars(g.HelixKpi.capaAging(), "#8a5a10")}
        <h3>Open CAPAs</h3>
        <ul>${d.capas.filter((c) => c.status !== "closed").map((c) => `<li>${esc(c.id)} due ${esc(c.due)} — ${esc(c.problem)}</li>`).join("")}</ul>
        <h3>Change control (ECO)</h3>
        <ul>${ecos.map((e) => `<li>${esc(e.id)} ${pill(e.status)} ${esc(e.title)} · ${esc(e.linked)}</li>`).join("")}</ul>
        <h3>ASL watch</h3>
        <ul>${d.suppliers.map((s) => `<li>${esc(s.name)} score ${g.HelixKpi.scoreSupplier(s)} · ${esc(s.asl)} · cert ${esc(s.cert_expires)}</li>`).join("")}</ul>
      </section>
      <section class="card">
        <h2>Audit trail (append-only)</h2>
        <div class="tablewrap"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>
        ${d.audit.slice().reverse().slice(0, 40).map((a) => `<tr><td>${esc(a.ts)}</td><td>${esc(a.user)}</td><td>${esc(a.action)}</td><td>${esc(a.detail)}</td></tr>`).join("")}
        </tbody></table></div>
      </section>`;
  }

  function formNc() {
    const d = g.HelixStore.state.data;
    return `<section class="hero"><h1>Log NC</h1><p class="lede">Title, product, and description are required (OQ-02).</p></section>
      <form class="card form" id="nc-form">
        <label>Title <input name="title" required minlength="3"></label>
        <label>Product <select name="pn">${d.products.map((p) => `<option value="${p.pn}">${esc(p.pn)} ${esc(p.name)}</option>`).join("")}</select></label>
        <label>Severity <select name="severity"><option>minor</option><option>major</option><option>critical</option></select></label>
        <label>Description <textarea name="description" rows="4" required></textarea></label>
        <p class="err" id="form-err" hidden></p>
        <button class="btn primary" type="submit">Save NC</button>
      </form>`;
  }

  g.HelixRender = {
    overview: function () { return g.HelixWar ? g.HelixWar.overview() : plantBoard(); },
    plantBoard: plantBoard,
    ncs, capas, complaints, suppliers, scars, risk, changes, valView, reports, formNc,
    detailNc, detailCapa, detailSup, detailCmp, detailScar, detailHz, detailEco, esc,
  };
})(window);
