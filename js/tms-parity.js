(() => {
  const doc = document;

  // 1) Remove emoji junk/variation selectors that create empty lines
  const JUNK_RE = /[\uFE0F\uFE0E\u200D]/g;
  const tw = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (tw.nextNode()) texts.push(tw.currentNode);
  texts.forEach(n => {
    if (!n.nodeValue) return;
    if (JUNK_RE.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(JUNK_RE, "");
  });

  // 2) Convert raw KPI line "Objectif:... Étape:... Durée:... Statut:..."
  function convertKpiLine(){
    const nodes = [...doc.querySelectorAll("p,div,li")];
    for (const el of nodes) {
      const t0 = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!(t0.includes("Objectif:") && t0.includes("Étape:") && t0.includes("Durée:") && t0.includes("Statut:"))) continue;
      const m = t0.match(/Objectif:([^]+?)Étape:([^]+?)Durée:([^]+?)Statut:([^]+)$/);
      if (!m) continue;

      const [_, objectif, etape, duree, statut] = m.map(x => (x||"").trim());
      const kpi = doc.createElement("div");
      kpi.className = "pms-kpi";

      const items = [
        ["Objectif", objectif],
        ["Étape", etape],
        ["Durée", duree],
        ["Statut", statut],
      ];

      for (const [k,v] of items) {
        const it = doc.createElement("div");
        it.className = "pms-kpi__item";
        const kk = doc.createElement("span");
        kk.className = "pms-kpi__k";
        kk.textContent = k;
        const vv = doc.createElement("span");
        vv.className = "pms-kpi__v";
        vv.textContent = v;
        it.append(kk, vv);
        kpi.appendChild(it);
      }
      el.replaceWith(kpi);
      break;
    }
  }

  // 3) Fix "Accéder" fake CTA in outils-modeles:
  // - if no <a href>, replace with badge "En cours" (non clickable)
  function fixFakeAccess(){
    const candidates = [...doc.querySelectorAll("p,div,li")];
    for (const el of candidates) {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!/^accéder\b/i.test(t) && !/^accéder à la page\b/i.test(t)) continue;
      if (el.querySelector && el.querySelector("a[href]")) continue;

      const badge = doc.createElement("span");
      badge.className = "pms-badge pms-badge--soon";
      badge.textContent = "En cours";
      el.textContent = "";
      el.appendChild(badge);
    }
  }

  // 4) Add bottom-safe padding to body when bottom nav exists
  function bottomSafe(){
    const hasBottom = !!doc.querySelector(".pms-bottom-nav, .pms-bottom, .bottom-nav, nav[data-nav='bottom']");
    if (hasBottom) doc.body.classList.add("pms-bottom-safe");
  }

  convertKpiLine();
  fixFakeAccess();
  bottomSafe();
})();
