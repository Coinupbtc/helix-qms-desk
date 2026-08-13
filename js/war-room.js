/* Monday war-room: story first, then the live records. */
(function (g) {
  const WALK_KEY = "helix-walk-v1";

  function esc(s) {
    return g.HelixRender.esc(s);
  }

  function loadWalk() {
    try {
      return JSON.parse(sessionStorage.getItem(WALK_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function mark(step) {
    const w = loadWalk();
    w[step] = true;
    sessionStorage.setItem(WALK_KEY, JSON.stringify(w));
  }

  function done(step) {
    return !!loadWalk()[step];
  }

  function pill(status) {
    const s = String(status || "");
    let k = "watch";
    if (s === "ok" || s === "closed" || s === "pass") k = "ok";
    if (s === "mismatch" || s === "gap" || s === "overdue" || s === "critical") k = "bad";
    return '<span class="pill ' + k + '">' + esc(s) + "</span>";
  }

  function stepClass(id) {
    return done(id) ? "walk-step done" : "walk-step";
  }

  function overview() {
    const d = g.HelixStore.state.data;
    const k = g.HelixKpi.kpis();
    const mismatch = (d.standards || []).filter((s) => s.sticker_due !== s.cert_due);
    const gaps = (d.training || []).filter((t) => t.status === "gap");
    const overdue = d.capas.filter((c) => c.status !== "closed" && c.due < d.meta.today);
    return `
      <section class="hero war-hero">
        <p class="kicker">Monday 7:40 · week one · ${esc(d.meta.today)}</p>
        <h1>You are the new QE. The sticker is lying.</h1>
        <p class="lede">Helix Biomedical (DEMO). Three fires, one failure class: a status indicator that stopped tracking the thing it claims. Presence is not integrity.</p>
      </section>
      <ol class="walk" aria-label="Week-one path">
        <li class="${stepClass("sticker")}">
          <button type="button" class="walk-btn" data-go="std" data-id="STK-V-204">
            <strong>1. Open the voltage standard</strong>
            <span>Sticker due ${esc((mismatch[0] || {}).sticker_due || "—")} · certificate due ${esc((mismatch[0] || {}).cert_due || "—")}</span>
          </button>
        </li>
        <li class="${stepClass("capa11")}">
          <button type="button" class="walk-btn" data-go="capa" data-id="CAPA-2026-11">
            <strong>2. Read the 8D — CAPA-2026-11</strong>
            <span>Same bug as closed CAPA-2026-04. MES trusted the label, not the cert.</span>
          </button>
        </li>
        <li class="${stepClass("harbor")}">
          <button type="button" class="walk-btn" data-go="capa" data-id="CAPA-2026-09">
            <strong>3. The overdue operational fire</strong>
            <span>Harbor packs + training gap on WI-IN-04. ${overdue.length} overdue CAPA.</span>
          </button>
        </li>
        <li class="${stepClass("desk")}">
          <button type="button" class="walk-btn" data-view-jump="validation">
            <strong>4. Prove this desk — IQ / OQ / PQ</strong>
            <span>Unique IDs, access control, audit trail, intended-use chain.</span>
          </button>
        </li>
        <li class="${stepClass("serve")}">
          <button type="button" class="walk-btn" data-view-jump="validation" data-scroll="serve-lab">
            <strong>5. Prove Helix Assist the same way</strong>
            <span>HTTP 200 is presence. Non-empty content is integrity.</span>
          </button>
        </li>
      </ol>
      <div class="kpi-grid">
        <article class="kpi alert"><div class="n">${mismatch.length}</div><div class="l">Sticker ≠ cert</div><p>Standards whose label disagrees with the certificate.</p></article>
        <article class="kpi alert"><div class="n">${gaps.length}</div><div class="l">Training gaps</div><p>Controlled work with no current record.</p></article>
        <article class="kpi ${k.overdueCapa ? "alert" : ""}"><div class="n">${k.overdueCapa}</div><div class="l">Overdue CAPAs</div><p>Due date passed, still open.</p></article>
        <article class="kpi"><div class="n">${k.openNc}</div><div class="l">Open NCs</div><p>Including the Monday cal finding.</p></article>
      </div>
      <section class="card">
        <h2>Calibration standards</h2>
        ${(d.standards || []).map((s) => `
          <button class="rowlink" data-go="std" data-id="${esc(s.id)}">
            <strong>${esc(s.id)}</strong> ${pill(s.status)}
            <span>${esc(s.name)} · sticker ${esc(s.sticker_due)} · cert ${esc(s.cert_due)}</span>
            <em>${esc(s.bench)}</em>
          </button>`).join("")}
      </section>
      <section class="card">
        <h2>Training records</h2>
        ${(d.training || []).map((t) => `
          <div class="rowlink static">
            <strong>${esc(t.person)}</strong> ${pill(t.status)}
            <span>${esc(t.wi)} · through ${esc(t.qualified_through)}</span>
            <em>${esc(t.note)}</em>
          </div>`).join("")}
      </section>
      <p class="hint board-link"><button type="button" class="link" data-view-jump="board">Plant board (charts)</button> · <button type="button" class="link" data-action="reset">Reset demo</button></p>`;
  }

  function board() {
    return g.HelixRender.plantBoard();
  }

  function detailStd(id) {
    mark("sticker");
    const d = g.HelixStore.state.data;
    const s = (d.standards || []).find((x) => x.id === id);
    if (!s) return "<p>Not found.</p>";
    const disagree = s.sticker_due !== s.cert_due;
    return `
      <section class="hero">
        <p class="kicker">Metrology standard</p>
        <h1>${esc(s.id)}</h1>
        ${pill(s.status)}
        <p class="lede">${esc(s.name)} · ${esc(s.bench)}</p>
      </section>
      <section class="card compare ${disagree ? "alert-card" : ""}">
        <div class="compare-col">
          <p class="kicker">What the sticker says</p>
          <p class="big-date">${esc(s.sticker_due)}</p>
          <p>Presence. The MES lockout is green.</p>
        </div>
        <div class="compare-col">
          <p class="kicker">What the certificate says</p>
          <p class="big-date">${esc(s.cert_due)}</p>
          <p>Integrity. ${esc(s.cert_id)} · Prairie Cal.</p>
        </div>
      </section>
      <section class="card prose">
        <p>${esc(s.note)}</p>
        <dl>
          <dt>Last used</dt><dd>${esc(s.last_used)} on ${esc(s.used_on)}</dd>
          <dt>Linked NC</dt><dd><button class="link" data-go="nc" data-id="NC-2026-017">NC-2026-017</button></dd>
          <dt>Linked CAPA</dt><dd><button class="link" data-go="capa" data-id="CAPA-2026-11">CAPA-2026-11</button> · prior same-class <button class="link" data-go="capa" data-id="CAPA-2026-04">CAPA-2026-04</button></dd>
        </dl>
      </section>`;
  }

  g.HelixWar = {
    overview: overview,
    board: board,
    detailStd: detailStd,
    mark: mark,
    done: done,
  };
})(window);
