(() => {
  const doc = document;

  // 1) Emoji junk cleanup: remove isolated variation selectors / zero-width joiners
  const JUNK = new Set(["️", "‍", "︎"]);
  const walk = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const toFix = [];
  while (walk.nextNode()) {
    const n = walk.currentNode;
    if (!n.nodeValue) continue;
    const trimmed = n.nodeValue.trim();
    if (trimmed && [...trimmed].every(ch => JUNK.has(ch))) toFix.push(n);
    // also remove stray leading "️" embedded
    if (n.nodeValue.includes("️") && !n.nodeValue.includes("️")) {
      // no-op, keep safe; handled below
    }
  }
  toFix.forEach(n => n.nodeValue = n.nodeValue.replace(/️|‍|︎/g, ""));

  // 2) Convert KPI line "Objectif:... Étape:... Durée:... Statut:..." into .pms-kpi
  function convertKpiLine() {
    const candidates = [...doc.querySelectorAll("p,div")].filter(el => {
      const t = (el.textContent || "").trim();
      return t.includes("Objectif:") && t.includes("Étape:") && t.includes("Durée:") && t.includes("Statut:");
    });
    candidates.forEach(el => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      const m = t.match(/Objectif:([^]+?)Étape:([^]+?)Durée:([^]+?)Statut:([^]+)$/);
      if (!m) return;
      const [_, objectif, etape, duree, statut] = m.map(s => (s || "").trim());

      const kpi = doc.createElement("div");
      kpi.className = "pms-kpi";
      kpi.setAttribute("aria-label", "Contexte session");

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

  // 3) Deduplicate duplicated H2 + intro (notably outils-modeles)
  function dedupeHeadings() {
    const h2s = [...doc.querySelectorAll("h2")];
    for (let i = 0; i < h2s.length - 1; i++) {
      if (h2s[i].textContent.trim() && h2s[i].textContent.trim() === h2s[i + 1].textContent.trim()) {
        // remove the second H2 and its next intro paragraph if identical-ish
        const second = h2s[i + 1];
        const p1 = h2s[i].nextElementSibling;
        const p2 = second.nextElementSibling;
        if (p1 && p2 && p1.tagName === "P" && p2.tagName === "P" && p1.textContent.trim() === p2.textContent.trim()) {
          p2.remove();
        }
        second.remove();
      }
    }
  }

  // 4) Convert "bullet list + CTA" blocks to TMS tiles where relevant (Documents + Outils & Modèles)
  function listToTiles() {
    const uls = [...doc.querySelectorAll("ul")];
    uls.forEach(ul => {
      const lis = [...ul.querySelectorAll(":scope > li")];
      if (lis.length < 3) return;

      // heuristic: if list contains many "Télécharger" or "Ouvrir" links
      const actionLinks = lis.map(li => li.querySelector("a")).filter(Boolean);
      const actionText = actionLinks.map(a => (a.textContent || "").trim().toLowerCase());
      const score = actionText.filter(t => ["télécharger", "ouvrir", "auditer", "lancer", "démarrer", "accéder"].includes(t)).length;
      if (score < Math.min(3, lis.length)) return;

      ul.classList.add("tms-tiles");
      lis.forEach(li => {
        li.classList.add("tms-tile");

        // build structure if not already structured
        const title = li.querySelector("strong, b")?.textContent?.trim() || (li.childNodes[0]?.textContent || "").trim();
        const descNode = [...li.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim().length > 10);
        const desc = (descNode?.nodeValue || "").trim();

        // action
        const a = li.querySelector("a");
        const action = a ? (a.textContent || "").trim() : "";

        // clear li and rebuild
        const icon = doc.createElement("div");
        icon.className = "tms-tile__icon";
        icon.textContent = action.toLowerCase().includes("télé") ? "📎" : "🧩";

        const body = doc.createElement("div");
        body.className = "tms-tile__body";
        const tt = doc.createElement("p");
        tt.className = "tms-tile__title";
        tt.textContent = title || "Ressource";
        const dd = doc.createElement("p");
        dd.className = "tms-tile__desc";
        dd.textContent = desc || "Ressource opérationnelle.";
        body.append(tt, dd);

        li.innerHTML = "";
        li.append(icon, body);

        if (a && a.getAttribute("href")) {
          a.className = "tms-tile__cta";
          a.textContent = action || "Ouvrir";
          li.appendChild(a);
        } else {
          const disabled = doc.createElement("span");
          disabled.className = "tms-tile__cta tms-cta-disabled";
          disabled.setAttribute("aria-disabled", "true");
          disabled.textContent = "Bientôt";
          li.appendChild(disabled);
        }
      });
    });
  }

  // 5) Replace plain "Accéder" text without href by disabled badge/button (UX clean)
  function fixFakeAccess() {
    const textNodes = [...doc.querySelectorAll("li")].filter(li => {
      const t = (li.textContent || "").trim();
      return t.endsWith("Accéder") && !li.querySelector("a");
    });
    textNodes.forEach(li => {
      const badge = doc.createElement("span");
      badge.className = "tms-badge";
      badge.textContent = "Bientôt";
      li.appendChild(badge);
    });
  }

  // Run
  convertKpiLine();
  dedupeHeadings();
  fixFakeAccess();
  listToTiles();
})();
