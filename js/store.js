/* Live QMS state. Seed is synthetic; mutations stay in this session unless saved. */
(function (g) {
    const KEY = "helix-qms-desk-v4";

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function load() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("helix store: session restore skipped", e);
    }
    return clone(g.HELIX_SEED);
  }

  const state = {
    data: load(),
    role: "quality_engineer",
    view: "overview",
    selected: null,
    flash: null,
    valReport: null,
    serveReport: null,
    serveLive: null,
  };

  function persist() {
    sessionStorage.setItem(KEY, JSON.stringify(state.data));
  }

  function user() {
    return state.data.users.find((u) => u.role === state.role) || state.data.users[1];
  }

  function canWrite() {
    return state.role === "quality_engineer" || state.role === "qa_manager";
  }

  function canCloseCapa() {
    return state.role === "qa_manager";
  }

  function canAcceptRisk() {
    return state.role === "qa_manager";
  }

  function audit(action, detail) {
    state.data.audit.push({
      ts: new Date().toISOString(),
      user: user().name,
      role: state.role,
      action: action,
      detail: String(detail || ""),
    });
    persist();
  }

  function nextId(prefix, list, field) {
    const nums = list.map((r) => {
      const m = String(r[field || "id"]).match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    });
    const n = Math.max(0, ...nums) + 1;
    return prefix + String(n).padStart(3, "0");
  }

  function reset() {
    state.data = clone(g.HELIX_SEED);
    state.valReport = null;
    state.serveReport = null;
    state.serveLive = null;
    persist();
    audit("reset_demo", "restored synthetic seed");
  }

  g.HelixStore = {
    state: state,
    persist: persist,
    user: user,
    canWrite: canWrite,
    canCloseCapa: canCloseCapa,
    canAcceptRisk: canAcceptRisk,
    audit: audit,
    nextId: nextId,
    reset: reset,
    clone: clone,
  };
})(window);
