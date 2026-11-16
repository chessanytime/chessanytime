(() => {
  const home = document.querySelector("#home");
  if (!home) return;

  /* -------------------------------------------------------
     Selectable chess-benefit planets
     ------------------------------------------------------- */
  const benefits = {
    focus: {
      symbol: "◎",
      kicker: "SKILL 01 · FOCUS",
      title: "Focus & attention",
      description: "A chess position rewards careful observation. Look at the whole board, notice what has changed and give each decision your attention."
    },
    problem: {
      symbol: "⌁",
      kicker: "SKILL 02 · PROBLEM-SOLVING",
      title: "Problem-solving",
      description: "Every position presents a new challenge. Compare possible moves, calculate consequences and choose a practical solution."
    },
    ahead: {
      symbol: "↗",
      kicker: "SKILL 03 · THINKING AHEAD",
      title: "Thinking ahead",
      description: "Before making a move, consider how the opponent might respond. Chess gives students regular practice in looking beyond the first idea."
    },
    patience: {
      symbol: "◷",
      kicker: "SKILL 04 · PATIENCE",
      title: "Patience & planning",
      description: "Not every position calls for immediate action. Players learn to improve their position, wait for the right moment and follow a plan."
    },
    resilience: {
      symbol: "↻",
      kicker: "SKILL 05 · RESILIENCE",
      title: "Learning from mistakes",
      description: "A missed tactic or a difficult game can become a useful lesson. Review what happened, understand the position and try again."
    },
    confidence: {
      symbol: "♙",
      kicker: "SKILL 06 · DECISION-MAKING",
      title: "Confidence in decisions",
      description: "Chess asks players to make choices and take responsibility for them. Each game offers another opportunity to practise independent thinking."
    }
  };

  const symbol = home.querySelector("#benefit-active-symbol");
  const kicker = home.querySelector("#benefit-active-kicker");
  const title = home.querySelector("#benefit-active-title");
  const description = home.querySelector("#benefit-active-description");
  const planets = [...home.querySelectorAll("[data-benefit]")];

  function selectBenefit(button) {
    const item = benefits[button.dataset.benefit];
    if (!item || !symbol || !kicker || !title || !description) return;

    planets.forEach(planet => {
      const active = planet === button;
      planet.classList.toggle("is-active", active);
      planet.setAttribute("aria-pressed", String(active));
    });

    symbol.textContent = item.symbol;
    kicker.textContent = item.kicker;
    title.textContent = item.title;
    description.textContent = item.description;
  }

  planets.forEach(button => button.addEventListener("click", () => selectBenefit(button)));

  /* -------------------------------------------------------
     Free-to-watch video shelf
     Videos remain hosted by their original YouTube creators.
     ------------------------------------------------------- */
  const videos = {
    basics: {
      id: "YdnvlntAQH8",
      title: "How to Play Chess: Chess Rules for Beginners",
      description: "Learn how the pieces move, how a game is won and the special rules every new player should know.",
      source: "FREE LESSON · CHESSKID"
    },
    tactics: {
      id: "10IC86NSQZ8",
      title: "The Basic Tactics of Chess for Kids",
      description: "Explore tactical ideas and learn to recognise the patterns that can change a game.",
      source: "FREE LESSON · CHESSKID"
    },
    checkmates: {
      id: "RZSRfvE0K_0",
      title: "Everything You Need to Know About Basic Checkmates",
      description: "Get familiar with essential mating patterns and the basic checkmates every player should practise.",
      source: "FREE LESSON · CHESSKID"
    },
    endgames: {
      id: "UL8Jo4lc1Ms",
      title: "What Is the Endgame in Chess?",
      description: "Understand the final phase of a chess game and why king and pawn activity becomes so important.",
      source: "FREE LESSON · CHESSKID"
    }
  };

  const videoTabs = [...home.querySelectorAll("[data-video]")];
  const player = home.querySelector("#academy-video-player");
  const videoTitle = home.querySelector("#academy-video-title");
  const videoDescription = home.querySelector("#academy-video-description");
  const videoSource = home.querySelector("#academy-video-source");
  const originalLink = home.querySelector("#academy-video-original");

  function selectVideo(button) {
    const item = videos[button.dataset.video];
    if (!item || !player) return;

    videoTabs.forEach(tab => {
      const active = tab === button;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });

    const nextSrc = "https://www.youtube-nocookie.com/embed/" + item.id + "?rel=0&modestbranding=1";
    if (player.getAttribute("src") !== nextSrc) player.setAttribute("src", nextSrc);
    player.setAttribute("title", item.title + " by ChessKid");
    videoTitle.textContent = item.title;
    videoDescription.textContent = item.description;
    videoSource.textContent = item.source;
    originalLink.href = "https://www.youtube.com/watch?v=" + item.id;
  }

  videoTabs.forEach(button => button.addEventListener("click", () => selectVideo(button)));

  /* Use the browser's horizontal-key navigation for topic buttons. */
  videoTabs.forEach((button, index) => {
    button.addEventListener("keydown", event => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + direction + videoTabs.length) % videoTabs.length;
      videoTabs[next].focus();
      selectVideo(videoTabs[next]);
    });
  });
})();