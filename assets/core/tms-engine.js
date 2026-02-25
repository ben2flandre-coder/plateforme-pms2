(() => {
  "use strict";

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // -------- utilities
  const text = (el) => (el?.textContent || "").replace(/\s+/g," ").trim();
  const isHeading = (el) => el && /^H[1-6]$/.test(el.tagName);

  // Wrap helpers (non destructifs)
  function wrapNodes(nodes, wrapper){
    const first = nodes[0];
    if(!first || !first.parentNode) return;
    first.parentNode.insertBefore(wrapper, first);
    nodes.forEach(n => wrapper.appendChild(n));
  }

  // -------- 1) Global: tag body for CSS
  document.body.dataset.tmsEngine = "1";

  // -------- 2) Make page sections “TMS rhythm” (safe)
  // If main exists, wrap major blocks into .tms-section when possible
  const main = $("main") || $("#main") || $(".main") || document.body;
  // Avoid wrapping if already looks like cards grid hub
  const already = $(".tms-section", main);
  if(!already){
    // Wrap each top-level <section> or large <div> blocks
    const topBlocks = $$(".section, main > section, main > div", main)
      .filter(el => el.parentElement === main)
      .filter(el => el.offsetHeight > 120);

    topBlocks.forEach(el => {
      if(el.classList.contains("tms-section")) return;
      // Do not wrap nav injected blocks
      if(el.id && String(el.id).includes("pms-")) return;
      el.classList.add("tms-section");
    });
  }

  // -------- 3) Questionnaire engine: transform into question cards if page looks like a quiz
  // Heuristics: title contains "Questionnaire" OR many inputs radio
  const h1 = $("h1") || $("h2");
  const looksQuiz =
    /Questionnaire/i.test(text(h1)) ||
    $$('input[type="radio"]').length >= 6;

  if(looksQuiz){
    // Try to find question headings like "1." "2." etc
    const candidates = $$("h2, h3, strong").filter(el => /^\d+\./.test(text(el)));
    // If no headings, just style labels as options
    if(candidates.length){
      candidates.forEach((head) => {
        // Skip if already wrapped
        if(head.closest(".question-card")) return;

        // Collect nodes until next candidate heading
        const nodes = [head];
        let cur = head.nextSibling;
        while(cur){
          const nextEl = cur.nodeType === 1 ? cur : cur.nextSibling;
          const el = cur.nodeType === 1 ? cur : null;
          if(el && ( (el.matches("h2,h3,strong") && /^\d+\./.test(text(el))) )) break;
          nodes.push(cur);
          cur = cur.nextSibling;
        }

        const card = document.createElement("div");
        card.className = "question-card";

        // Build header
        const m = text(head).match(/^(\d+)\.\s*(.*)$/);
        const idx = m ? m[1] : "";
        const title = m ? m[2] : text(head);

        const headWrap = document.createElement("div");
        headWrap.className = "q-head";
        headWrap.innerHTML = `
          <div class="q-index">${idx ? idx+"." : "•"}</div>
          <div class="q-title">${title || "Question"}</div>
        `;

        // Replace original head by headWrap inside card
        // Put everything in card, then remove the original head text node if needed
        wrapNodes(nodes.filter(n => n.nodeType===1 || n.nodeType===3), card);
        // head is inside card; replace it with headWrap
        head.parentNode && head.parentNode.replaceChild(headWrap, head);

        // Context blocks: if paragraph contains "Contexte" or italic quote
        $$(".question-card p, .question-card em, .question-card blockquote", card).forEach(p => {
          if(/Contexte/i.test(text(p)) || p.tagName === "EM" || p.tagName === "BLOCKQUOTE"){
            const c = document.createElement("div");
            c.className = "context";
            c.appendChild(p.cloneNode(true));
            p.replaceWith(c);
          }
        });

        // Options: if there are radios/checkbox inside card, group labels
        const inputs = $$('input[type="radio"], input[type="checkbox"]', card);
        if(inputs.length){
          // ensure labels wrap inputs
          inputs.forEach(inp => {
            const lbl = inp.closest("label");
            if(!lbl){
              // if input is followed by text node, create label
              const lab = document.createElement("label");
              inp.parentNode.insertBefore(lab, inp);
              lab.appendChild(inp);
              // move immediate text siblings into label
              let sib = lab.nextSibling;
              if(sib && sib.nodeType===3){
                lab.appendChild(sib);
              }
            }
          });

          // Create options container
          const firstInput = inputs[0];
          const optionsContainer = document.createElement("div");
          optionsContainer.className = "options tms-options";

          // Move all labels that contain inputs into container
          const labels = $$("label", card).filter(l => l.querySelector('input[type="radio"],input[type="checkbox"]'));
          if(labels.length){
            labels.forEach(l => optionsContainer.appendChild(l));
            // insert options container after context or after head
            const after = $(".context", card) || $(".q-head", card);
            after && after.insertAdjacentElement("afterend", optionsContainer);
          }
        }
      });
    }else{
      // fallback: style any label+input as options
      const wrap = document.createElement("div");
      wrap.className = "tms-options";
      const labels = $$("label").filter(l=>l.querySelector('input[type="radio"],input[type="checkbox"]'));
      if(labels.length){
        labels[0].parentNode.insertBefore(wrap, labels[0]);
        labels.forEach(l=>wrap.appendChild(l));
      }
    }
  }

  // -------- 4) Forms: add section wrappers for long admin forms (registre-nc)
  const looksForm = $$("form").length >= 1 && $$('textarea, select, input[type="text"], input[type="date"]').length >= 6;
  if(looksForm){
    $$("form").forEach(form => {
      if(form.classList.contains("tms-section")) return;
      form.classList.add("tms-section");
    });
  }

})();
