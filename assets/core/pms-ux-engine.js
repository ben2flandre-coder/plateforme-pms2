document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  if (!main) return;

  main.classList.add("tms-app");
  window.scrollTo({ top: 0, behavior: "smooth" });

  /* ======================
     SECTIONS → CARDS
  ====================== */
  document.querySelectorAll("h1,h2").forEach((h) => {
    if (h.closest(".tms-section")) return;

    const section = document.createElement("section");
    section.className = "tms-section";

    h.parentNode.insertBefore(section, h);
    section.appendChild(h);

    let next = h.nextElementSibling;

    while (next && !["H1", "H2"].includes(next.tagName)) {
      const move = next;
      next = next.nextElementSibling;
      section.appendChild(move);
    }
  });

  /* ======================
     FORM NORMALIZATION
  ====================== */
  document.querySelectorAll("form").forEach((form) => {
    form.classList.add("tms-form");

    form.querySelectorAll("label,input,select,textarea").forEach((el) => {
      if (!el.parentNode || el.closest(".tms-field")) return;
      const wrap = document.createElement("div");
      wrap.className = "tms-field";
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
    });
  });

  /* ======================
     QUESTIONNAIRE MODE
  ====================== */
  document
    .querySelectorAll("input[type=radio],input[type=checkbox]")
    .forEach((input) => {
      const parent = input.closest(".tms-field");
      if (parent) parent.classList.add("tms-choice");
    });

  document
    .querySelectorAll(
      ".question, .question-item, .question-block, .question-card, .quiz-question, .q-item"
    )
    .forEach((block) => {
      block.classList.add("tms-section");
      block.removeAttribute("style");
      block.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    });

  /* ======================
     REGISTRE NC 2 COLS
  ====================== */
  document.querySelectorAll(".nc-details").forEach((details) => {
    details.classList.add("tms-nc-grid");
    details.querySelectorAll(".nc-detail-item").forEach((item) => {
      const text = (item.textContent || "").toLowerCase();
      if (text.includes("gravité")) item.classList.add("tms-nc-gravite");
      if (text.includes("détecté par")) item.classList.add("tms-nc-detecte");
      if (text.includes("cause")) item.classList.add("tms-nc-cause");
      if (text.includes("action immédiate")) item.classList.add("tms-nc-action");
    });
  });
});
