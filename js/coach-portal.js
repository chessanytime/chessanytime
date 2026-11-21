(() => {
  "use strict";
  const API_BASE = (window.CA_COACH_API_BASE || "http://127.0.0.1:8765").replace(/\/$/, "");
  const tokenKey = "caCoachToken";
  const $ = (id) => document.getElementById(id);

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = sessionStorage.getItem(tokenKey);
    if (token) headers.Authorization = "Bearer " + token;
    let response;
    try {
      response = await fetch(API_BASE + path, { ...options, headers });
    } catch (error) {
      throw new Error("Cannot reach your PC. Start the Chess AnyTime Python service and keep its window open.");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "The request could not be completed.");
    return data;
  }

  function showMessage(id, message, isError = false) {
    const node = $(id);
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("is-error", isError);
    node.classList.toggle("is-success", !isError);
  }

  async function checkService() {
    const status = $("coach-service-status");
    if (!status) return;
    status.textContent = "Checking your computer…";
    status.classList.remove("is-online", "is-offline");
    try {
      const health = await api("/api/health", { method: "GET", headers: {} });
      if (!health.csv_directory_exists) throw new Error("CSV folder not found on your computer.");
      status.textContent = "Connected · Puzzle database available";
      status.classList.add("is-online");
      const path = $("coach-output-folder");
      if (path) path.textContent = health.output_directory;
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("is-offline");
    }
  }

  const loginForm = $("coach-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = loginForm.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Signing in…";
      showMessage("coach-login-message", "");
      try {
        const result = await api("/api/login", {
          method: "POST",
          body: JSON.stringify({
            username: $("coach-username").value,
            password: $("coach-password").value
          }),
          headers: {}
        });
        sessionStorage.setItem(tokenKey, result.token);
        $("coach-password").value = "";
        location.hash = "#coach-dashboard";
      } catch (error) {
        showMessage("coach-login-message", error.message, true);
      } finally {
        button.disabled = false;
        button.textContent = "Log in to Coach Portal";
      }
    });
  }

  const generator = $("coach-generator-form");
  if (generator) {
    generator.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = $("coach-generate-button");
      const resultBox = $("coach-generation-result");
      button.disabled = true;
      button.textContent = "Searching your database…";
      resultBox.hidden = false;
      resultBox.textContent = "Scanning CSV files in their original NbPlays order. The search stops when the requested number of valid puzzles is found.";
      resultBox.className = "coach-result";
      const values = {
        theme: $("coach-theme").value.trim(),
        count: Number($("coach-count").value),
        min_rating: Number($("coach-min-rating").value),
        max_rating: Number($("coach-max-rating").value),
        max_rating_deviation: Number($("coach-max-rd").value),
        min_popularity: Number($("coach-min-popularity").value),
        max_pieces: Number($("coach-max-pieces").value),
        max_fullmove: Number($("coach-max-fullmove").value),
        output_filename: $("coach-filename").value.trim()
      };
      try {
        const result = await api("/api/generate-pgn", {
          method: "POST",
          body: JSON.stringify(values)
        });
        resultBox.className = "coach-result is-success";
        resultBox.innerHTML = "";
        const title = document.createElement("strong");
        title.textContent = "PGN created successfully";
        const details = document.createElement("p");
        details.textContent = result.puzzles_created + " puzzles saved · " + result.files_scanned + " files scanned · " + result.rows_scanned.toLocaleString() + " rows checked";
        const path = document.createElement("code");
        path.textContent = result.output_file;
        const skipped = document.createElement("p");
        skipped.textContent = "Invalid solutions skipped: " + result.invalid_solutions_skipped;
        resultBox.append(title, details, path, skipped);
      } catch (error) {
        resultBox.className = "coach-result is-error";
        resultBox.textContent = error.message;
        if (/session|log in/i.test(error.message)) {
          sessionStorage.removeItem(tokenKey);
          location.hash = "#coach-login";
        }
      } finally {
        button.disabled = false;
        button.textContent = "Generate PGN";
      }
    });
  }

  const logoutButton = $("coach-logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try { await api("/api/logout", { method: "POST" }); } catch (_) {}
      sessionStorage.removeItem(tokenKey);
      location.hash = "#coach-login";
    });
  }

  function onRoute() {
    if (location.hash.slice(1) === "coach-dashboard" && sessionStorage.getItem(tokenKey)) checkService();
  }
  window.addEventListener("hashchange", onRoute);
  onRoute();
})();
