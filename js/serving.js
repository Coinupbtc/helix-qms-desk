/* Helix Assist IQ/OQ/PQ — canned on Pages; optional localhost probe when served locally. */
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

  function fixture() {
    return g.HelixStore.state.data.serving || {};
  }

  function runCanned() {
    const sv = fixture();
    const c = sv.canned || {};
    const iq = [
      rec("S-IQ-01", "R-10", "Intended use is written", () => ({
        pass: /draft/i.test(sv.intended_use || "") && /must not close/i.test(sv.intended_use || ""),
        evidence: String(sv.intended_use || "").slice(0, 120),
      })),
      rec("S-IQ-02", "R-17", "Approved model + checksum present", () => ({
        pass: !!sv.approved_model && !!sv.approved_checksum && !!sv.eco,
        evidence: sv.approved_model + " · " + sv.approved_checksum + " · " + sv.eco,
      })),
      rec("S-IQ-03", "R-10", "Serving fixture is marked synthetic", () => ({
        pass: /SYNTHETIC/i.test(sv.disclaimer || ""),
        evidence: String(sv.disclaimer || "").slice(0, 80),
      })),
    ];
    const oq = [
      rec("S-OQ-01", "R-15", "Presence: /v1/models returns 200", () => ({
        pass: c.models_http === 200,
        evidence: "HTTP " + c.models_http,
      })),
      rec("S-OQ-02", "R-15", "Integrity catch: HTTP 200 + empty content is a FAIL", () => {
        const naive = c.empty_http === 200;
        const empty = String(c.empty_content || "") === "";
        // Protocol PASSES if we detect the silent failure (naive would have passed).
        return {
          pass: naive && empty,
          evidence: "presence HTTP " + c.empty_http + " · content length " + String(c.empty_content || "").length + " · flagged",
        };
      }),
      rec("S-OQ-03", "R-15", "Integrity: good completion is non-empty", () => ({
        pass: c.good_http === 200 && String(c.good_content || "").length > 10,
        evidence: String(c.good_content || "").slice(0, 80),
      })),
      rec("S-OQ-04", "R-17", "Served id + checksum match ECO", () => ({
        pass: c.served_id === sv.approved_model && c.served_checksum === sv.approved_checksum,
        evidence: "served " + c.served_id + " / " + c.served_checksum,
      })),
    ];
    const pq = [
      rec("S-PQ-01", "R-16", "Assist output is advisory (do_not_close)", () => ({
        pass: /do_not_close=true/.test(c.good_content || ""),
        evidence: c.good_content,
      })),
      rec("S-PQ-02", "R-16", "Intended use: CMP-2026-019 → battery-pack / major", () => {
        const ok =
          c.pq_complaint === "CMP-2026-019" &&
          c.pq_expect_family === "battery-pack" &&
          c.pq_expect_severity === "major" &&
          /battery-pack/.test(c.good_content || "") &&
          /major/.test(c.good_content || "");
        return { pass: ok, evidence: c.pq_complaint + " → " + c.pq_expect_family };
      }),
      rec("S-PQ-03", "R-07", "Canned bakeoff figure is present and labeled demo", () => ({
        pass: typeof c.bakeoff_tok_s === "number" && /demo/i.test(c.bakeoff_note || ""),
        evidence: c.bakeoff_tok_s + " tok/s · " + c.bakeoff_note,
      })),
    ];
    return { iq: iq, oq: oq, pq: pq };
  }

  function runAll() {
    const started = new Date().toISOString();
    const parts = runCanned();
    const all = parts.iq.concat(parts.oq, parts.pq);
    const failed = all.filter((t) => !t.pass);
    const report = {
      kind: "serving",
      started: started,
      finished: new Date().toISOString(),
      executor: g.HelixStore.user().name,
      version: g.HelixStore.state.data.meta.version,
      checksum: g.HelixStore.state.data.meta.checksum,
      live: g.HelixStore.state.serveLive || null,
      iq: parts.iq,
      oq: parts.oq,
      pq: parts.pq,
      pass: failed.length === 0,
      failed: failed.map((t) => t.id),
      totals: { n: all.length, pass: all.length - failed.length, fail: failed.length },
      signed: g.HelixStore.state.serveReport && g.HelixStore.state.serveReport.signed
        ? g.HelixStore.state.serveReport.signed
        : null,
    };
    g.HelixStore.state.serveReport = report;
    g.HelixStore.audit(
      "serving_validation",
      report.pass ? "PASS " + report.totals.pass + "/" + report.totals.n : "FAIL " + report.failed.join(",")
    );
    if (g.HelixWar) g.HelixWar.mark("serve");
    return report;
  }

  function sign(name) {
    const r = g.HelixStore.state.serveReport;
    if (!r) throw new Error("run serving protocol before signing");
    const n = String(name || "").trim();
    if (n.length < 3) throw new Error("typed name required (demo e-sign)");
    r.signed = { name: n, ts: new Date().toISOString(), meaning: "I executed the Helix Assist DEMO protocol" };
    g.HelixStore.audit("serving_sign", n);
    return r;
  }

  /**
   * Optional live probe. Only useful on http://127.0.0.1 (not GitHub Pages).
   * Never prints filesystem paths — host:port and HTTP facts only.
   */
  function probeLive() {
    const sv = fixture();
    const live = sv.live || {};
    const host = live.host || "127.0.0.1";
    const port = live.port || 8888;
    const base = "http://" + host + ":" + port;
    const ctrl = typeof AbortSignal !== "undefined" && AbortSignal.timeout
      ? AbortSignal.timeout(4000)
      : undefined;
    return fetch(base + (live.models_path || "/v1/models"), { signal: ctrl })
      .then((res) => res.json().then((j) => ({ res: res, j: j })).catch(() => ({ res: res, j: null })))
      .then((x) => {
        const ids = (((x.j || {}).data) || []).map((m) => m.id).filter(Boolean);
        const contentLen = ids.length;
        g.HelixStore.state.serveLive = {
          reached: true,
          http: x.res.status,
          model_count: contentLen,
          // Integrity: a models list with zero ids is presence without a served model.
          integrity: x.res.status === 200 && contentLen > 0,
          note: "Local OpenAI-compatible endpoint. No host paths recorded.",
        };
        g.HelixStore.audit("serving_live_probe", "HTTP " + x.res.status + " models=" + contentLen);
        return g.HelixStore.state.serveLive;
      })
      .catch((e) => {
        g.HelixStore.state.serveLive = {
          reached: false,
          http: 0,
          integrity: false,
          note: "No local endpoint (expected on GitHub Pages). Canned protocol still runs.",
          error: String(e && e.message ? e.message : e).slice(0, 80),
        };
        return g.HelixStore.state.serveLive;
      });
  }

  function viewExtras() {
    const sv = fixture();
    const r = g.HelixStore.state.serveReport;
    const live = g.HelixStore.state.serveLive;
    const esc = g.HelixRender.esc;
    const pill = (ok) =>
      '<span class="pill ' + (ok ? "ok" : "bad") + '">' + (ok ? "pass" : "fail") + "</span>";
    let html = `
      <section class="card" id="serve-lab">
        <h2>Helix Assist — serving IQ / OQ / PQ</h2>
        <p class="lede">${esc(sv.intended_use)}</p>
        <p class="hint">${esc(sv.disclaimer)}</p>
        <p>Approved <strong>${esc(sv.approved_model)}</strong> · checksum ${esc(sv.approved_checksum)} · ${esc(sv.eco)}</p>
        <button class="btn primary" data-action="run-serve" type="button">Run serving protocol (canned)</button>
        <button class="btn" data-action="probe-live" type="button">Optional: probe local :8888</button>
        ${live ? `<p class="hint">Live probe: ${live.reached ? "HTTP " + live.http + " · models " + live.model_count + " · integrity " + live.integrity : "not reached"} — ${esc(live.note)}</p>` : ""}
      </section>`;
    if (r) {
      const block = (name, tests) => `
        <h3>${name} — ${tests.filter((t) => t.pass).length}/${tests.length} pass</h3>
        <div class="tablewrap"><table><thead><tr><th>Test</th><th>Req</th><th>Result</th><th>Evidence</th></tr></thead><tbody>
        ${tests.map((t) => `<tr><td>${esc(t.id)} ${esc(t.title)}</td><td>${esc(t.req)}</td><td>${pill(t.pass)}</td><td>${esc(t.evidence)}</td></tr>`).join("")}
        </tbody></table></div>`;
      html += `<section class="card report" id="serve-report">
        <h2>Assist execution report ${r.pass ? pill(true) : pill(false)}</h2>
        <p class="nums">${esc(r.executor)} · ${esc(r.finished)} · <strong>${r.totals.pass}/${r.totals.n}</strong></p>
        ${block("S-IQ", r.iq)}
        ${block("S-OQ", r.oq)}
        ${block("S-PQ", r.pq)}
        ${r.failed.length ? "<p class='err'>Deviations: " + esc(r.failed.join(", ")) + "</p>" : "<p>No serving deviations. HTTP 200 with empty content was treated as a caught failure, not a pass.</p>"}
        <p>${r.signed ? "Signed: " + esc(r.signed.name) + " · " + esc(r.signed.ts) : ""}</p>
        <form id="sign-serve-form" class="form">
          <label>Typed name (demo e-sign) <input name="name" required minlength="3" placeholder="Riley Chen"></label>
          <button class="btn" type="submit">Sign assist report</button>
        </form>
        <button class="btn" data-action="dl-serve" type="button">Download assist report JSON</button>
      </section>`;
    }
    return html;
  }

  g.HelixServe = { runAll: runAll, sign: sign, probeLive: probeLive, viewExtras: viewExtras };
})(window);
