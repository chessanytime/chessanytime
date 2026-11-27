(() => {
  const section = document.getElementById("life-skills");
  if (!section) return;
  const descriptions = {
    focus: ["Focus", "Take a closer look at the board. Notice threats, changes and opportunities before choosing your move."],
    memory: ["Memory", "Recognise familiar positions and recall the patterns you have practised in earlier games."],
    planning: ["Planning", "Think about your opponent's reply and compare different ways to improve your position."],
    creativity: ["Creativity", "Explore fresh ideas. Sometimes an unexpected move opens up a completely new possibility."],
    solving: ["Problem-solving", "Break a difficult position into smaller questions, then test your candidate moves."],
    patience: ["Patience", "Pause, calculate and make a considered decision instead of rushing into the first move you see."]
  };
  const buttons = [...section.querySelectorAll("[data-life-skill]")];
  const description = section.querySelector("#life-skill-description");
  function select(button) {
    const item = descriptions[button.dataset.lifeSkill];
    buttons.forEach(candidate => candidate.setAttribute("aria-pressed", String(candidate === button)));
    const title = document.createElement("strong");
    title.textContent = item[0];
    description.replaceChildren(title, document.createTextNode(item[1]));
  }
  buttons.forEach(button => button.addEventListener("click", () => select(button)));
  if (buttons[0]) select(buttons[0]);
})();
