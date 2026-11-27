(() => {
  const header = document.querySelector("header");
  const menu = header?.querySelector(".resources-menu");
  const toggle = header?.querySelector(".nav-toggle");
  const primary = header?.querySelector(".primary-navigation");
  if (!header || !menu || !toggle || !primary) return;
  const mobile = matchMedia("(max-width: 760px)");
  function closeNavigation() {
    menu.open = false;
    header.classList.remove("is-menu-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    header.classList.toggle("is-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (!open) menu.open = false;
  });
  document.addEventListener("click", event => {
    if (!header.contains(event.target)) closeNavigation();
    else if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    } else if (header.classList.contains("is-menu-open")) {
      closeNavigation();
      toggle.focus();
    }
  });
  header.addEventListener("focusout", event => {
    if (!header.contains(event.relatedTarget)) closeNavigation();
  });
  mobile.addEventListener("change", closeNavigation);
})();
