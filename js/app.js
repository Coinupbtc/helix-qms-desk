/* Shell: routing, role, forms. */
(function (g) {
  const main = () => document.getElementById("main");

  function paint() {
    const st = g.HelixStore.state;
    document.getElementById("role").value = st.role;
    document.querySelectorAll("nav button[data-view]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-view") === st.view && !st.selected);
    });
    document.getElementById("who").textContent = g.HelixStore.user().name + " · " + g.HelixStore.user().title;
    let html = "";
    if (st.view === "overview") html = g.HelixRender.overview();
    else if (st.view === "ncs" && !st.selected) html = g.HelixRender.ncs();
    else if (st.view === "ncs" && st.selected === "new") html = g.HelixRender.formNc();
    else if (st.view === "ncs") html = g.HelixRender.detailNc(st.selected);
    else if (st.view === "capas" && st.selected) html = g.HelixRender.detailCapa(st.selected);
    else if (st.view === "capas") html = g.HelixRender.capas();
    else if (st.view === "complaints" && st.selected) html = g.HelixRender.detailCmp(st.selected);
    else if (st.view === "complaints") html = g.HelixRender.complaints();
    else if (st.view === "suppliers" && st.selected) html = g.HelixRender.detailSup(st.selected);
    else if (st.view === "suppliers") html = g.HelixRender.suppliers();
    else if (st.view === "scars" && st.selected) html = g.HelixRender.detailScar(st.selected);
    else if (st.view === "scars") html = g.HelixRender.scars();
    else if (st.view === "validation") html = g.HelixRender.valView();
    else if (st.view === "reports") html = g.HelixRender.reports();
    main().innerHTML = html;
    if (st.flash) {
      const bar = document.getElementById("flash");
      bar.hidden = false;
      bar.textContent = st.flash;
      st.flash = null;
    }
  }

  function go(view, id) {
    g.HelixStore.state.view = view;
    g.HelixStore.state.selected = id || null;
    paint();
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-view]");
    if (nav && nav.closest("nav")) {
      go(nav.getAttribute("data-view"));
      return;
    }
    const link = e.target.closest("[data-go]");
    if (link) {
      const map = { nc: "ncs", capa: "capas", cmp: "complaints", supplier: "suppliers", scar: "scars" };
      go(map[link.getAttribute("data-go")], link.getAttribute("data-id"));
      return;
    }
    const act = e.target.closest("[data-action]");
    if (!act) return;
    const a = act.getAttribute("data-action");
    if (a === "new-nc") go("ncs", "new");
    if (a === "reset") {
      g.HelixStore.reset();
      g.HelixStore.state.flash = "Demo data restored.";
      go("overview");
    }
    if (a === "run-val") {
      const r = g.HelixVal.runAll();
      g.HelixStore.state.flash = r.pass
        ? "Protocol PASS " + r.totals.pass + "/" + r.totals.n
        : "Protocol FAIL: " + r.failed.join(", ");
      go("validation");
    }
    if (a === "print") window.print();
    if (a === "close-capa") {
      try {
        g.HelixApp.closeCapa(act.getAttribute("data-id"), "Closed from desk UI");
        g.HelixStore.state.flash = "CAPA closed.";
        paint();
      } catch (err) {
        g.HelixStore.state.flash = err.message;
        paint();
      }
    }
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id !== "nc-form") return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const err = document.getElementById("form-err");
    try {
      const id = g.HelixApp.createNc({
        title: fd.get("title"),
        pn: fd.get("pn"),
        description: fd.get("description"),
        severity: fd.get("severity"),
      });
      g.HelixStore.state.flash = "Saved " + id;
      go("ncs", id);
    } catch (ex) {
      err.hidden = false;
      err.textContent = ex.message;
    }
  });

  document.getElementById("role").addEventListener("change", (e) => {
    g.HelixStore.state.role = e.target.value;
    g.HelixStore.audit("role_switch", e.target.value);
    paint();
  });

  g.HelixUi = { paint: paint, go: go };
  paint();
  const q = new URLSearchParams(location.search);
  if (q.get("view")) go(q.get("view"), q.get("id") || null);
  if (q.get("run") === "val") {
    g.HelixVal.runAll();
    go("validation");
  }
})(window);
