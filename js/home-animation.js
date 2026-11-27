(() => {
  const home = document.getElementById("home");
  if (!home || !("IntersectionObserver" in window)) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const targets = home.querySelectorAll(
    ".hub-copy > *, .hub-hero-photo, .life-skills-heading, .life-king-stage, .hub-quick > a, .hub-heading, .hub-feature, .hub-resource-grid > a, .hub-activity, .hub-academy"
  );
  let observer;

  function updateMotion() {
    observer?.disconnect();
    if (reducedMotion.matches) {
      targets.forEach(element => element.classList.remove("ca-reveal", "is-revealed"));
      return;
    }
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    targets.forEach(element => {
      const siblings = Array.from(element.parentElement.children);
      element.style.setProperty("--reveal-delay", Math.min(siblings.indexOf(element), 4) * 90 + "ms");
      element.classList.add("ca-reveal");
      observer.observe(element);
    });
  }

  updateMotion();
  reducedMotion.addEventListener("change", updateMotion);
})();
