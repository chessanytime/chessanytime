(() => {
  const root = document.getElementById("chess-benefits");
  if (!root) return;
  const benefits = {
    memory: ["Sharper memory", "Remember piece patterns, tactical ideas and details from positions you have seen before.", "\u265e"],
    focus: ["Deeper focus", "Stay with a position, notice the small details and give one problem your full attention.", "\u265c"],
    planning: ["Smarter planning", "Compare candidate moves and think through how your opponent is likely to respond.", "\u265f"],
    solving: ["Better problem-solving", "Spot threats, calculate different options and work towards a practical solution.", "\u2657"],
    creativity: ["More creativity", "Find unexpected ideas and discover imaginative ways to use your pieces.", "\u265d"],
    patience: ["Real patience", "Take your time, evaluate the position and avoid rushing into the first move you see.", "\u2659"]
  };
  const buttons = [...root.querySelectorAll("[data-benefit]")];
  const detail = root.querySelector("#academy-benefit-detail");
  const playback = root.querySelector("#academy-benefit-playback");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let selected = "memory";
  let transition;
  let timer;
  let inView = false;
  let hovered = false;
  let rotationEnabled = !reducedMotion.matches;

  function scheduleRotation() {
    clearTimeout(timer);
    if (!rotationEnabled || !inView || hovered || document.hidden || root.contains(document.activeElement)) return;
    timer = setTimeout(() => {
      const index = (buttons.findIndex(button => button.dataset.benefit === selected) + 1) % buttons.length;
      selectBenefit(buttons[index], index, false);
    }, 4000);
  }

  function updatePlayback() {
    playback.hidden = false;
    playback.textContent = rotationEnabled ? "Pause rotation" : "Play rotation";
    playback.setAttribute("aria-label", rotationEnabled ? "Pause automatic benefit rotation" : "Start automatic benefit rotation");
    scheduleRotation();
  }

  function selectBenefit(button, index, manual = true) {
    if (selected !== button.dataset.benefit) {
      selected = button.dataset.benefit;
      const [title, description, symbol] = benefits[selected];
      transition?.cancel();
      detail.setAttribute("aria-live", manual ? "polite" : "off");
      root.querySelector("#academy-benefit-title").textContent = title;
      root.querySelector("#academy-benefit-description").textContent = description;
      root.querySelector("#academy-benefit-symbol").textContent = symbol;
      root.querySelector("#academy-benefit-counter").textContent = String(index + 1).padStart(2, "0") + " / 06";
      buttons.forEach(candidate => candidate.setAttribute("aria-pressed", String(candidate === button)));
      if (!reducedMotion.matches && detail.animate) {
        transition = detail.animate([{ opacity: 0.75, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], {
          duration: 160,
          easing: "ease-out"
        });
      }
    }
    scheduleRotation();
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => selectBenefit(button, index));
  });
  playback.addEventListener("click", () => {
    rotationEnabled = !rotationEnabled;
    updatePlayback();
  });
  root.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch") return;
    hovered = true;
    scheduleRotation();
  });
  root.addEventListener("pointerleave", () => {
    hovered = false;
    scheduleRotation();
  });
  root.addEventListener("focusin", scheduleRotation);
  root.addEventListener("focusout", event => {
    if (!root.contains(event.relatedTarget)) queueMicrotask(scheduleRotation);
  });
  document.addEventListener("visibilitychange", scheduleRotation);
  addEventListener("pagehide", () => clearTimeout(timer));
  addEventListener("pageshow", scheduleRotation);
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    scheduleRotation();
  }, { threshold: 0 });
  observer.observe(root);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      transition?.cancel();
      rotationEnabled = false;
      updatePlayback();
    }
  });
  updatePlayback();
})();
