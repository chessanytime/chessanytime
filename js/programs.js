(() => {
  const root = document.querySelector("#programs.ca-programs");
  if (!root) return;

  const levels = {
    beginner: {
      tag: "LEVEL 01 · FOUNDATION",
      title: "Beginner",
      description: "For students starting their chess journey and building a strong understanding of the fundamentals.",
      duration: "45 minutes"
    },
    intermediate: {
      tag: "LEVEL 02 · DEVELOPMENT",
      title: "Intermediate",
      description: "For students with a good grasp of the basics who are ready to develop their chess understanding further.",
      duration: "60 minutes"
    },
    advanced1: {
      tag: "LEVEL 03 · ADVANCED",
      title: "Advanced Level 1",
      description: "Build stronger calculation skills and a deeper understanding of positional chess.",
      duration: "60 minutes"
    },
    advanced2: {
      tag: "LEVEL 04 · COMPETITIVE",
      title: "Advanced Level 2",
      description: "Develop deeper chess understanding and strengthen competitive skills.",
      duration: "60 minutes"
    }
  };

  const levelButtons = [...root.querySelectorAll("[data-level]")];
  const tag = root.querySelector("#cp-detail-tag");
  const title = root.querySelector("#cp-active-name");
  const description = root.querySelector("#cp-active-description");
  const duration = root.querySelector("#cp-active-duration");

  levelButtons.forEach(button => {
    button.addEventListener("click", () => {
      const item = levels[button.dataset.level];
      if (!item) return;
      levelButtons.forEach(option => {
        const active = option === button;
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", String(active));
      });
      tag.textContent = item.tag;
      title.textContent = item.title;
      description.textContent = item.description;
      duration.textContent = item.duration;
    });
  });

  const currencies = {
    india: { price: "₹19,200", label: "India", meta: "For 24 classes · Payment in advance" },
    international: { price: "$360", label: "International", meta: "For 24 classes · Payment in advance" }
  };
  const currencyButtons = [...root.querySelectorAll("[data-currency]")];
  const price = root.querySelector("#cp-price");
  const priceLabel = root.querySelector("#cp-price-label");
  const priceMeta = root.querySelector("#cp-price-meta");

  currencyButtons.forEach(button => {
    button.addEventListener("click", () => {
      const item = currencies[button.dataset.currency];
      if (!item) return;
      currencyButtons.forEach(option => {
        const active = option === button;
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", String(active));
      });
      price.textContent = item.price;
      priceLabel.textContent = item.label + " package fee";
      priceMeta.textContent = item.meta;
    });
  });
})();