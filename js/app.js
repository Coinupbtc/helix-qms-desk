/* Shell: routing, role, forms. */
(function (g) {
  const main = () => document.getElementById("main");

  function paint() {
    const st = g.HelixStore.state;
    document.getElementById("role").value = st.role;
    document.querySelectorAll("nav button[data-view]").forEach((b) => {
      const v = b.getAttribute("data-view");
      const parent =
        (st.view === "std" || st.view === "board") ? "overview" :
        (st.view === "ncs") ? "ncs" :
        (st.view === "capas") ? "capas" :
        (st.view === "complaints") ? "complaints" :
        (st.view === "suppliers") ? "suppliers" :
        (st.view === "scars") ? "scars" :
        st.view;
      b.classList.toggle("on", v === parent);
    });
    document.getElementById("who").textContent = g.HelixStore.user().name + " · " + g.HelixStore.user().title;
    const foot = document.getElementById("foot");
    if (foot) {
      foot.textContent =
        "v" + st.data.meta.version + " · seed " + st.data.meta.checksum + " · " + st.data.meta.today + " · SYNTHETIC";
    }
    let html = "";
    if (st.view === "overview") html = g.HelixRender.overview();
    else if (st.view === "board") html = g.HelixRender.plantBoard();
    else if (st.view === "std") html = g.HelixWar.detailStd(st.selected);
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
    const jump = e.target.closest("[data-view-jump]");
    if (jump) {
      go(jump.getAttribute("data-view-jump"));
      const scrollId = jump.getAttribute("data-scroll");
      if (scrollId) {
        const el = document.getElementById(scrollId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    const link = e.target.closest("[data-go]");
    if (link) {
      const map = { nc: "ncs", capa: "capas", cmp: "complaints", supplier: "suppliers", scar: "scars", std: "std" };
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
      if (g.HelixWar) g.HelixWar.mark("desk");
      g.HelixStore.state.flash = r.pass
        ? "Desk protocol PASS " + r.totals.pass + "/" + r.totals.n
        : "Desk protocol FAIL: " + r.failed.join(", ");
      go("validation");
    }
    if (a === "run-serve") {
      const r = g.HelixServe.runAll();
      g.HelixStore.state.flash = r.pass
        ? "Assist protocol PASS " + r.totals.pass + "/" + r.totals.n
        : "Assist protocol FAIL: " + r.failed.join(", ");
      go("validation");
      const lab = document.getElementById("serve-lab");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (a === "probe-live") {
      g.HelixServe.probeLive().then(() => {
        g.HelixStore.state.flash = "Live probe finished (canned protocol is still the evidence pack).";
        go("validation");
        const lab = document.getElementById("serve-lab");
        if (lab) lab.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    if (a === "dl-serve") {
      const r = g.HelixStore.state.serveReport;
      if (!r) return;
      const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
      const ael = document.createElement("a");
      ael.href = URL.createObjectURL(blob);
      ael.download = "helix-assist-iq-oq-pq-report.json";
      ael.click();
    }
    if (a === "print") window.print();
    if (a === "dl-val") {
      const r = g.HelixStore.state.valReport;
      if (!r) return;
      const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
      const ael = document.createElement("a");
      ael.href = URL.createObjectURL(blob);
      ael.download = "helix-iq-oq-pq-report.json";
      ael.click();
    }
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id === "nc-form") {
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
      return;
    }
    if (e.target.id === "close-capa-form") {
      e.preventDefault();
      const err = document.getElementById("close-err");
      try {
        g.HelixApp.closeCapa(e.target.getAttribute("data-id"), new FormData(e.target).get("note"));
        g.HelixStore.state.flash = "CAPA closed.";
        paint();
      } catch (ex) {
        err.hidden = false;
        err.textContent = ex.message;
      }
      return;
    }
    if (e.target.id === "sign-form") {
      e.preventDefault();
      try {
        g.HelixVal.sign(new FormData(e.target).get("name"));
        g.HelixStore.state.flash = "Desk report signed (demo).";
        paint();
      } catch (ex) {
        g.HelixStore.state.flash = ex.message;
        paint();
      }
      return;
    }
    if (e.target.id === "sign-serve-form") {
      e.preventDefault();
      try {
        g.HelixServe.sign(new FormData(e.target).get("name"));
        g.HelixStore.state.flash = "Assist report signed (demo).";
        paint();
      } catch (ex) {
        g.HelixStore.state.flash = ex.message;
        paint();
      }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id !== "q") return;
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("tbody tr").forEach((tr) => {
      tr.hidden = q.length > 0 && !tr.textContent.toLowerCase().includes(q);
    });
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
    if (g.HelixWar) g.HelixWar.mark("desk");
    go("validation");
  }
  if (q.get("run") === "serve") {
    g.HelixServe.runAll();
    go("validation");
  }
  if (q.get("run") === "all") {
    g.HelixVal.runAll();
    if (g.HelixWar) g.HelixWar.mark("desk");
    g.HelixServe.runAll();
    go("validation");
  }
})(window);
