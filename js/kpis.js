/* KPIs, aging, Pareto, SVG bars — all from live records. */
(function (g) {
  const TODAY = () => g.HelixStore.state.data.meta.today;

  function daysBetween(a, b) {
    const ms = Date.parse(b) - Date.parse(a);
    return Math.round(ms / 86400000);
  }

  function kpis() {
    const d = g.HelixStore.state.data;
    const openNc = d.ncs.filter((n) => n.status !== "closed");
    const overdueCapa = d.capas.filter((c) => c.status !== "closed" && c.due < TODAY());
    const openScar = d.scars.filter((s) => s.status === "open" || s.status === "late");
    const openCmp = d.complaints.filter((c) => c.status !== "closed");
    const expiring = d.suppliers.filter((s) => s.cert_expires <= "2026-11-10");
    const expired = d.suppliers.filter((s) => s.cert_expires < TODAY());
    const critical = d.ncs.filter((n) => n.severity === "critical" && n.status !== "closed");
    const closed = d.capas.filter((c) => c.status === "closed" && c.closed);
    const cycles = closed.map((c) => daysBetween(c.opened, c.closed)).filter((n) => !isNaN(n));
    const medianCycle = cycles.length
      ? cycles.slice().sort((a, b) => a - b)[Math.floor(cycles.length / 2)]
      : null;
    return {
      openNc: openNc.length,
      openCapa: d.capas.filter((c) => c.status !== "closed").length,
      overdueCapa: overdueCapa.length,
      openScar: openScar.length,
      openCmp: openCmp.length,
      expiringCerts: expiring.length,
      expiredCerts: expired.length,
      criticalOpen: critical.length,
      closedCapaYtd: closed.length,
      complaintsYtd: d.complaints.length,
      medianCycleDays: medianCycle,
      lateScar: d.scars.filter((s) => s.status === "late").length,
    };
  }

  function scoreSupplier(s) {
    const d = g.HelixStore.state.data;
    const openScars = d.scars.filter(
      (x) => x.supplier_id === s.id && (x.status === "open" || x.status === "late")
    );
    let score = 100;
    score -= 12 * openScars.length;
    score -= Math.min(25, s.ppm / 80);
    score -= Math.max(0, (95 - s.on_time_pct) * 0.8);
    if (s.cert_expires < TODAY()) score -= 35;
    else if (s.cert_expires <= "2026-11-10") score -= 8;
    if (String(s.asl).startsWith("Disqualified")) score = Math.min(score, 25);
    if (String(s.asl).startsWith("Conditional")) score = Math.min(score, 70);
    return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
  }

  function band(score) {
    if (score >= 85) return "ok";
    if (score >= 70) return "watch";
    return "bad";
  }

  function monthKey(iso) {
    return String(iso || "").slice(0, 7);
  }

  function byMonth(rows, field) {
    const map = {};
    rows.forEach((r) => {
      const k = monthKey(r[field]);
      if (!k) return;
      map[k] = (map[k] || 0) + 1;
    });
    return Object.keys(map)
      .sort()
      .map((k) => ({ label: k.slice(5), n: map[k], key: k }));
  }

  function paretoNc() {
    const d = g.HelixStore.state.data;
    const map = {};
    d.ncs.forEach((n) => {
      const name = n.supplier_id
        ? (d.suppliers.find((s) => s.id === n.supplier_id) || {}).name || n.supplier_id
        : "Internal";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.keys(map)
      .map((label) => ({ label: label, n: map[label] }))
      .sort((a, b) => b.n - a.n);
  }

  function capaAging() {
    const d = g.HelixStore.state.data;
    const buckets = { "On time": 0, "1–7d late": 0, "8–30d late": 0, ">30d late": 0 };
    d.capas.filter((c) => c.status !== "closed").forEach((c) => {
      const late = daysBetween(c.due, TODAY());
      if (late <= 0) buckets["On time"] += 1;
      else if (late <= 7) buckets["1–7d late"] += 1;
      else if (late <= 30) buckets["8–30d late"] += 1;
      else buckets[">30d late"] += 1;
    });
    return Object.keys(buckets).map((label) => ({ label: label, n: buckets[label] }));
  }

  function svgBars(items, color) {
    const max = Math.max(1, ...items.map((i) => i.n));
    const w = 320;
    const h = 88;
    const gap = 6;
    const bw = (w - gap * (items.length + 1)) / Math.max(1, items.length);
    const bars = items
      .map((it, i) => {
        const bh = Math.max(2, (it.n / max) * 56);
        const x = gap + i * (bw + gap);
        const y = 64 - bh;
        return (
          '<g><rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh +
          '" rx="3" fill="' + (color || "#1e4d7b") + '"></rect>' +
          '<text x="' + (x + bw / 2) + '" y="78" text-anchor="middle" font-size="10" fill="#5c564e">' +
          it.label + "</text>" +
          '<text x="' + (x + bw / 2) + '" y="' + (y - 4) + '" text-anchor="middle" font-size="10" fill="#1c1916">' +
          it.n + "</text></g>"
        );
      })
      .join("");
    return '<svg class="chart" viewBox="0 0 ' + w + " " + h + '" role="img">' + bars + "</svg>";
  }

  function uniqueIds(d) {
    const all = []
      .concat(d.ncs, d.capas, d.scars, d.complaints, d.suppliers, d.changes || [])
      .map((r) => r.id);
    return all.length === new Set(all).size;
  }

  function fkOk(d) {
    const ncs = new Set(d.ncs.map((x) => x.id));
    const capas = new Set(d.capas.map((x) => x.id));
    const sups = new Set(d.suppliers.map((x) => x.id));
    for (let i = 0; i < d.capas.length; i++) {
      const ids = d.capas[i].nc_ids || [];
      for (let j = 0; j < ids.length; j++) if (!ncs.has(ids[j])) return false;
    }
    for (let i = 0; i < d.ncs.length; i++) {
      const n = d.ncs[i];
      if (n.supplier_id && !sups.has(n.supplier_id)) return false;
      if (n.capa_id && !capas.has(n.capa_id)) return false;
    }
    return true;
  }

  g.HelixKpi = {
    kpis: kpis,
    scoreSupplier: scoreSupplier,
    band: band,
    byMonth: byMonth,
    paretoNc: paretoNc,
    capaAging: capaAging,
    svgBars: svgBars,
    uniqueIds: uniqueIds,
    fkOk: fkOk,
    daysBetween: daysBetween,
  };
})(window);
