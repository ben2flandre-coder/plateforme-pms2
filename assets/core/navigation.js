(() => {
  "use strict";

  // Idempotence guard (prevents multiple init / multiple injections)
  if (window.__PMS_NAV_CORE_INIT__) return;
  window.__PMS_NAV_CORE_INIT__ = true;

  const IDS = {
    opNav: "pms-op-nav",
    bottomNav: "pms-bottom-nav",
    floatL: "pms-float-left",
    floatR: "pms-float-right",
  };

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function ensureOnce(id, factory) {
    let el = document.getElementById(id);
    if (el) return el;
    el = factory();
    el.id = id;
    return el;
  }

  function baseToRoot(){
    const script = document.currentScript || $all("script[src]").find((el) => String(el.src || "").includes("/assets/core/navigation.js"));
    if (script?.src) {
      return String(script.src).replace(/assets\/core\/navigation\.js(?:\?.*)?$/, "");
    }

    // renvoie "" à la racine, "../" si /outils/, "../../" si /outils/sub/
    const depth = location.pathname.split("/").filter(Boolean).length;
    // ex: /plateforme-pms2/outils/registre-nc.html => ["plateforme-pms2","outils","registre-nc.html"] => depth 3
    // root of site folder = first segment
    // so we need (depth-2) "../"
    const up = Math.max(0, depth - 2);
    return "../".repeat(up);
  }

  function injectTmsEngineAssets(){
    const root = baseToRoot();
    const cssHref = root + "assets/core/tms-engine.css";
    const jsSrc  = root + "assets/core/tms-engine.js";

    if (!document.querySelector("link[data-tms-engine]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssHref;
      link.dataset.tmsEngine = "1";
      document.head.appendChild(link);
    }

    if (!document.querySelector("script[data-tms-engine]")) {
      const script = document.createElement("script");
      script.src = jsSrc;
      script.defer = true;
      script.dataset.tmsEngine = "1";
      document.head.appendChild(script);
    }
  }

  function getMainEl() {
    return $("main") || $("#main") || null;
  }

  function injectOpNavOnce() {
    return ensureOnce(IDS.opNav, () => {
      const nav = document.createElement("div");
      nav.className = "pms-op-nav";
      nav.setAttribute("role", "navigation");
      nav.setAttribute("aria-label", "Navigation opérateur");

      nav.innerHTML = `
        <div class="pms-op-nav__inner">
          <a class="btn btn-ghost" data-pms-action="hub" href="./index.html" aria-label="Hub">Hub</a>
          <a class="btn btn-ghost" data-pms-action="prev" href="#" aria-label="Section précédente">Section précédente</a>
          <a class="btn btn-primary" data-pms-action="next" href="#" aria-label="Section suivante">Section suivante</a>
          <button class="btn btn-ghost" type="button" data-pms-action="top" aria-label="Haut de page">Haut de page</button>
        </div>
      `;
      return nav;
    });
  }

  function injectBottomNavOnce() {
    return ensureOnce(IDS.bottomNav, () => {
      const nav = document.createElement("div");
      nav.className = "pms-bottom-nav";
      nav.setAttribute("role", "navigation");
      nav.setAttribute("aria-label", "Navigation bas de page");
      nav.innerHTML = `
        <div class="pms-bottom-nav__inner">
          <a class="btn btn-ghost" href="./index.html" aria-label="Hub">Hub</a>
          <a class="btn btn-ghost" href="#" data-pms-action="prev" aria-label="Section précédente">Section précédente</a>
          <a class="btn btn-primary" href="#" data-pms-action="next" aria-label="Section suivante">Section suivante</a>
          <button class="btn btn-ghost" type="button" data-pms-action="top" aria-label="Haut de page">Haut</button>
        </div>
      `;
      return nav;
    });
  }

  function injectFloatButtonsOnce() {
    const left = ensureOnce(IDS.floatL, () => {
      const b = document.createElement("button");
      b.className = "pms-float-btn pms-float-btn--left";
      b.type = "button";
      b.dataset.pmsAction = "top";
      b.setAttribute("aria-label", "Haut de page");
      b.textContent = "↑ Haut";
      return b;
    });

    const right = ensureOnce(IDS.floatR, () => {
      const b = document.createElement("button");
      b.className = "pms-float-btn pms-float-btn--right";
      b.type = "button";
      b.dataset.pmsAction = "top";
      b.setAttribute("aria-label", "Haut de page");
      b.textContent = "↑ Haut";
      return b;
    });

    if (!left.isConnected) document.body.appendChild(left);
    if (!right.isConnected) document.body.appendChild(right);
  }

  // ✅ IMPORTANT: operator nav is contextual -> insert into <main> as first element
  function placeNav() {
    const main = getMainEl();
    const opNav = injectOpNavOnce();
    const bottomNav = injectBottomNavOnce();

    document.documentElement.dataset.navCore = "1";
    document.body.dataset.navCore = "1";

    if (main && !opNav.isConnected) {
      main.insertAdjacentElement("afterbegin", opNav);
    } else if (!opNav.isConnected) {
      // fallback if no <main>
      document.body.insertAdjacentElement("afterbegin", opNav);
    }

    if (!bottomNav.isConnected) {
      document.body.appendChild(bottomNav);
    }

    injectFloatButtonsOnce();
  }

  function bindActions() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-pms-action]");
      if (!t) return;

      const action = t.dataset.pmsAction;

      if (action === "top") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // hub/prev/next: keep hrefs, do not override here (avoid breaking existing logic)
    }, { passive: false });
  }

  function toggleFloatVisibility() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const show = y > 300;
    const left = document.getElementById(IDS.floatL);
    const right = document.getElementById(IDS.floatR);
    if (left) left.classList.toggle("is-visible", show);
    if (right) right.classList.toggle("is-visible", show);
  }

  // SAFE FALLBACK: never inherits layout classes, never creates huge blocks
  function safeMediaFallback() {
    $all("img").forEach((img) => {
      if (img.dataset.pmsFallbackBound === "1") return;
      img.dataset.pmsFallbackBound = "1";

      img.addEventListener("error", () => {
        if (img.dataset.pmsFallbackDone === "1") return;
        img.dataset.pmsFallbackDone = "1";
        img.classList.add("pms-media-broken");

        const fb = document.createElement("span");
        fb.className = "pms-media-fallback";
        fb.setAttribute("role", "img");
        fb.setAttribute("aria-label", "Illustration indisponible");
        fb.textContent = "🖼️";

        img.insertAdjacentElement("afterend", fb);
      }, { once: true });
    });

    $all("svg").forEach((svg) => {
      if (svg.dataset.pmsSvgChecked === "1") return;
      svg.dataset.pmsSvgChecked = "1";

      const hasShape = svg.querySelector("path,circle,rect,polygon,polyline,line,ellipse,use,image");
      if (hasShape) return;

      svg.classList.add("pms-svg-empty");
      if (!svg.getAttribute("viewBox")) svg.setAttribute("viewBox", "0 0 24 24");
      svg.innerHTML = `<path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 14l3-3 3 3 2-2 2 2" fill="none" stroke="currentColor" stroke-width="2"/>`;
    });
  }

  function dedupeIfAny() {
    $all(".old-nav, .legacy-nav, #legacy-nav, .pms-nav-legacy").forEach((n) => n.remove());

    const op = $all(`#${IDS.opNav}`);
    if (op.length > 1) op.slice(1).forEach(n => n.remove());

    const bottom = $all(`#${IDS.bottomNav}, .pms-bottom-nav`);
    if (bottom.length > 1) bottom.slice(0, -1).forEach(n => n.remove());

    const fL = $all(`#${IDS.floatL}`);
    if (fL.length > 1) fL.slice(1).forEach(n => n.remove());

    const fR = $all(`#${IDS.floatR}`);
    if (fR.length > 1) fR.slice(1).forEach(n => n.remove());
  }

  function init() {
    injectTmsEngineAssets();
    placeNav();
    bindActions();
    safeMediaFallback();

    toggleFloatVisibility();
    dedupeIfAny();

    window.addEventListener("scroll", () => {
      toggleFloatVisibility();
    }, { passive: true });

    window.addEventListener("resize", () => {
      dedupeIfAny();
    }, { passive: true });

    setTimeout(() => { dedupeIfAny(); }, 250);
    setTimeout(() => { dedupeIfAny(); }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
