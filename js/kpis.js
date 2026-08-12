/* KPIs and supplier scores from live records — management review numbers. */
(function (g) {
  const TODAY = () => g.HelixStore.state.data.meta.today;

  function isOpenStatus(s) {
    return ["open", "investigation", "implementation", "effectiveness", "overdue", "late", "linked"].includes(s);
  }

  function kpis() {
    const d = g.HelixStore.state.data;
    const openNc = d.ncs.filter((n) => n.status !== "closed");
    const openCapa = d.capas.filter((c) => c.status !== "closed");
    const overdueCapa = d.capas.filter((c) => c.status !== "closed" && c.due < TODAY());
    const openScar = d.scars.filter((s) => s.status === "open" || s.status === "late");
    const openCmp = d.complaints.filter((c) => c.status !== "closed");
    const expiring = d.suppliers.filter((s) => s.cert_expires <= "2026-11-10");
    const expired = d.suppliers.filter((s) => s.cert_expires < TODAY());
    const critical = d.ncs.filter((n) => n.severity === "critical" && n.status !== "closed");
    return {
      openNc: openNc.length,
      openCapa: openCapa.length,
      overdueCapa: overdueCapa.length,
      openScar: openScar.length,
      openCmp: openCmp.length,
      expiringCerts: expiring.length,
      expiredCerts: expired.length,
      criticalOpen: critical.length,
      closedCapaYtd: d.capas.filter((c) => c.status === "closed").length,
      complaintsYtd: d.complaints.length,
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

  g.HelixKpi = { kpis: kpis, scoreSupplier: scoreSupplier, band: band, isOpenStatus: isOpenStatus };
})(window);
