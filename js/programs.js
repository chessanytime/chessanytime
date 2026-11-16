(() => {
  const root = document.querySelector("#programs.ca-programs");
  if (!root) return;

  const cards = [...root.querySelectorAll("[data-curriculum-card]")];

  cards.forEach(card => {
    const toggle = card.querySelector("[data-curriculum-toggle]");
    const panelId = toggle?.getAttribute("aria-controls");
    const panel = panelId ? root.querySelector("#" + CSS.escape(panelId)) : null;
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const shouldOpen = toggle.getAttribute("aria-expanded") !== "true";

      cards.forEach(otherCard => {
        const otherToggle = otherCard.querySelector("[data-curriculum-toggle]");
        const otherPanelId = otherToggle?.getAttribute("aria-controls");
        const otherPanel = otherPanelId ? root.querySelector("#" + CSS.escape(otherPanelId)) : null;
        const active = otherCard === card && shouldOpen;

        otherCard.classList.toggle("is-open", active);
        if (otherToggle) otherToggle.setAttribute("aria-expanded", String(active));
        if (otherPanel) otherPanel.hidden = !active;
      });
    });
  });
})();