/* TMS-like UX engine — PMS2 (hard) */
(function () {
  const doc = document;
  const body = doc.body;
  if (!body || body.dataset.uxEngine === "1") return;
  body.dataset.uxEngine = "1";

  const $ = (sel, root = doc) => root.querySelector(sel);
  const $$ = (sel, root = doc) => Array.from(root.querySelectorAll(sel));

  // Ensure <main>
  let main = $("main");
  if (!main) {
    main = doc.createElement("main");
    const nodes = Array.from(body.childNodes);
    nodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      if (tag === "script" || tag === "header" || tag === "footer") return;
      main.appendChild(n);
    });
    body.appendChild(main);
  }

  // Kill legacy nav
  $$(".legacy-nav, nav.legacy, #legacy-nav, .old-nav, .pms-nav-legacy").forEach((n) => n.remove());

  // META -> chips
  const metaCandidates = $$("p,div", main).filter((el) => {
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    return t.startsWith("Objectif") && t.includes("Étape") && t.includes("Durée") && t.includes("Statut");
  });
  metaCandidates.forEach((el) => {
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    const get = (k) => {
      const m = t.match(new RegExp(k + "\\s*[:]?\\s*([^:]+?)(?=\\s+(Objectif|Étape|Durée|Statut)\\b|$)", "i"));
      return m ? m[1].trim() : "";
    };
    const meta = doc.createElement("div");
    meta.className = "pms-meta";
    const mk = (label, val) => {
      const chip = doc.createElement("span");
      chip.className = "pms-chip";
      chip.innerHTML = `${label} <small>${val || "-"}</small>`;
      return chip;
    };
    meta.appendChild(mk("🎯 Objectif", get("Objectif")));
    meta.appendChild(mk("🧭 Étape", get("Étape")));
    meta.appendChild(mk("⏱️ Durée", get("Durée")));
    meta.appendChild(mk("✅ Statut", get("Statut")));
    el.replaceWith(meta);
  });

  // Wrap H2 sections
  const h2s = $$("h2", main);
  h2s.forEach((h2) => {
    const wrap = doc.createElement("section");
    wrap.className = "pms-section";
    const title = doc.createElement("div");
    title.className = "pms-section-title";
    title.textContent = (h2.textContent || "").trim();
    wrap.appendChild(title);

    let n = h2.nextSibling;
    const toMove = [h2];
    while (n) {
      if (n.nodeType === 1 && n.tagName.toLowerCase() === "h2") break;
      const next = n.nextSibling;
      toMove.push(n);
      n = next;
    }
    h2.parentNode.insertBefore(wrap, h2);
    toMove.forEach((x) => {
      if (x === h2) x.remove();
      else wrap.appendChild(x);
    });
  });

  // Quiz detection + cards + tap-friendly choices
  const isQuiz = (main.textContent || "").includes("Questionnaire") &&
                ($$("input[type=radio],input[type=checkbox]", main).length > 5);

  if (isQuiz) {
    const nodes = Array.from(main.children);
    const qBlocks = [];
    let current = null;
    const isQStart = (el) => {
      const t = (el.textContent || "").trim();
      return /^\d+\.\s/.test(t) || /^Q\d+\s/.test(t) || t.startsWith("1.");
    };
    nodes.forEach((el) => {
      if (isQStart(el)) {
        current = { items: [el] };
        qBlocks.push(current);
      } else if (current) current.items.push(el);
    });

    if (qBlocks.length) {
      const container = doc.createElement("div");
      container.className = "pms-quiz";
      qBlocks.forEach((qb, idx) => {
        const card = doc.createElement("section");
        card.className = "pms-card pms-question-card";
        const head = doc.createElement("div");
        head.className = "pms-question-head";
        head.innerHTML = `<b>🧩 Question ${idx + 1}</b>`;
        card.appendChild(head);
        qb.items.forEach((it) => card.appendChild(it));
        container.appendChild(card);
      });
      // keep nav injected, then append quiz
      main.appendChild(container);
    }

    $$("label", main).forEach((label) => {
      const inp = $("input[type=radio],input[type=checkbox]", label);
      if (!inp) return;
      if (label.classList.contains("pms-choice")) return;
      label.classList.add("pms-choice");
      const txt = doc.createElement("span");
      txt.className = "txt";
      const keep = Array.from(label.childNodes).filter((n) => n !== inp);
      keep.forEach((n) => txt.appendChild(n));
      label.appendChild(txt);
    });

    const call = doc.createElement("div");
    call.className = "pms-callout";
    call.innerHTML = `<b>🎯 Mode Quiz</b><br><span class="muted">Cartes + choix cliquables larges (comodality/mobile).</span>`;
    main.prepend(call);
  }

  // Forms: keep submit visible
  const form = $("form", main);
  if (form) {
    const submit = $("button[type=submit],input[type=submit]", form);
    if (submit) submit.classList.add("pms-submit");
  }
})();
