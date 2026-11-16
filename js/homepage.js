(() => {
  const home = document.querySelector("#home");
  if (!home) return;

  const benefits = {
    focus: {
      number: "01", label: "FOCUS", symbol: "◎", title: "Focus & attention",
      description: "Slow down, notice details and stay with a problem until you understand it. Every move invites a closer look."
    },
    problem: {
      number: "02", label: "PROBLEM-SOLVING", symbol: "⌁", title: "Problem-solving",
      description: "Explore candidate moves, compare options and look for a workable solution instead of choosing the first idea."
    },
    ahead: {
      number: "03", label: "THINKING AHEAD", symbol: "↗", title: "Thinking ahead",
      description: "Consider what might happen next, anticipate your opponent's ideas and prepare for more than one possibility."
    },
    patience: {
      number: "04", label: "PATIENCE & DISCIPLINE", symbol: "◷", title: "Patience & discipline",
      description: "Take time to calculate, practise regularly and learn that good decisions often come from a calm process."
    },
    resilience: {
      number: "05", label: "LEARNING FROM SETBACKS", symbol: "↻", title: "Learning from setbacks",
      description: "Review a loss, understand the mistake and return to the board with a new idea. A difficult game can become a lesson."
    },
    confidence: {
      number: "06", label: "CONFIDENCE & SPORTSMANSHIP", symbol: "♙", title: "Confidence & sportsmanship",
      description: "Make your own decisions, respect opponents and appreciate effort as well as results."
    }
  };

  const planetButtons = [...home.querySelectorAll("[data-benefit]")];
  const activeSymbol = home.querySelector("#benefit-active-symbol");
  const activeKicker = home.querySelector("#benefit-active-kicker");
  const activeTitle = home.querySelector("#benefit-active-title");
  const activeDescription = home.querySelector("#benefit-active-description");

  planetButtons.forEach(button => {
    button.addEventListener("click", () => {
      const item = benefits[button.dataset.benefit];
      if (!item) return;
      planetButtons.forEach(planet => {
        const active = planet === button;
        planet.classList.toggle("is-active", active);
        planet.setAttribute("aria-pressed", String(active));
      });
      activeSymbol.textContent = item.symbol;
      activeKicker.textContent = "SKILL " + item.number + " · " + item.label;
      activeTitle.textContent = item.title;
      activeDescription.textContent = item.description;
    });
  });

  const videos = {
    basics: {
      id: "YdnvlntAQH8",
      title: "How to Play Chess",
      source: "FEATURED VIDEO · CHESSKID",
      description: "Learn how the pieces move, how a game is won and the special rules every new player should know.",
      original: "https://www.youtube.com/watch?v=YdnvlntAQH8",
      iframeTitle: "How to Play Chess: Chess Rules for Beginners by ChessKid"
    },
    tactics: {
      id: "10IC86NSQZ8",
      title: "The Basic Tactics of Chess",
      source: "FEATURED VIDEO · CHESSKID",
      description: "Explore simple tactical ideas and see how patterns can help you spot opportunities on the chessboard.",
      original: "https://www.youtube.com/watch?v=10IC86NSQZ8",
      iframeTitle: "The Basic Tactics of Chess for Kids by ChessKid"
    }
  };
  const videoTabs = [...home.querySelectorAll("[data-video]")];
  const player = home.querySelector("#academy-video-player");
  const videoTitle = home.querySelector("#academy-video-title");
  const videoDescription = home.querySelector("#academy-video-description");
  const videoSource = home.querySelector("#academy-video-source");
  const originalLink = home.querySelector("#academy-video-original");

  videoTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const item = videos[tab.dataset.video];
      if (!item) return;
      videoTabs.forEach(option => {
        const active = option === tab;
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", String(active));
      });
      if (player.src !== "https://www.youtube-nocookie.com/embed/" + item.id + "?rel=0") {
        player.src = "https://www.youtube-nocookie.com/embed/" + item.id + "?rel=0";
      }
      player.title = item.iframeTitle;
      videoTitle.textContent = item.title;
      videoDescription.textContent = item.description;
      videoSource.textContent = item.source;
      originalLink.href = item.original;
    });
  });
})();