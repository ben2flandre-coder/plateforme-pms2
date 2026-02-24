(() => {
  const doc = document;

  // Clean emoji junk that appears as empty glyphs
  const JUNK_RE = /[\uFE0F\uFE0E\u200D]/g;
  const tw = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (tw.nextNode()) texts.push(tw.currentNode);
  texts.forEach(n => {
    if (!n.nodeValue) return;
    if (JUNK_RE.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(JUNK_RE, "");
  });

  // Convert KPI line if present: "Objectif:... Étape:... Durée:... Statut:..."
  function convertKpiLine() {
    const nodes = [...doc.querySelectorAll("p,div,li")];
    nodes.forEach(el => {
      const t0 = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!t0.includes("Objectif:") || !t0.includes("Étape:") || !t0.includes("Durée:") || !t0.includes("Statut:")) return;

      const m = t0.match(/Objectif:([^]+?)Étape:([^]+?)Durée:([^]+?)Statut:([^]+)$/);
      if (!m) return;

      const objectif = m[1].trim();
      const etape = m[2].trim();
      const duree = m[3].trim();
      const statut = m[4].trim();

      const kpi = doc.createElement("div");
      kpi.className = "pms-kpi";
      const items = [
        ["Objectif", objectif],
        ["Étape", etape],
        ["Durée", duree],
        ["Statut", statut],
      ];
      items.forEach(([k, v]) => {
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
      });
      el.replaceWith(kpi);
    });
  }

  // Replace fake "Accéder" without href by a "Bientôt" badge
  function fixFakeAccess() {
    [...doc.querySelectorAll("li")].forEach(li => {
      const hasLink = !!li.querySelector("a[href]");
      const text = (li.textContent || "").trim();
      if (hasLink) return;
      if (!/accéder$/i.test(text)) return;

      const badge = doc.createElement("span");
      badge.className = "badge badge-new";
      badge.textContent = "Bientôt";
      li.appendChild(document.createTextNode(" "));
      li.appendChild(badge);
    });
  }

  convertKpiLine();
  fixFakeAccess();
})();
