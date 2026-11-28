const LICHESS_ORIGIN = "https://lichess.org";
const LICHESS_CLIENT_ID = "chessanytime";
const LICHESS_PENDING_KEY = "caLichessAuthorization";
let lichessToken = null;
let lichessGamesController = null;
let lichessBusy = false;

function lichessMessage(id, text, isError = false) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = text;
  element.classList.toggle("is-error", isError);
}

function lichessBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function lichessRedirectUri() {
  return new URL("account.html", location.href).href;
}

function updateLichessView() {
  const content = document.getElementById("lichess-account-content");
  const signin = document.getElementById("lichess-account-signin");
  if (content) content.hidden = !me;
  if (signin) signin.hidden = !!me;
  renderMe();
  document.dispatchEvent(new CustomEvent("lichess-session-change"));
}

async function lichessRequest(path, options = {}, token = lichessToken) {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", "Bearer " + token);
  const response = await fetch(LICHESS_ORIGIN + path, {
    ...options,
    headers,
    credentials: "omit",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    signal: options.signal || AbortSignal.timeout(30000)
  });
  if (!response.ok) {
    if (response.status === 401 && token === lichessToken) {
      clearLichessSession();
      updateLichessView();
      lichessMessage("lichess-login-message", "Your Lichess session has expired. Please log in again.", true);
    }
    if (response.status === 429) throw new Error("Lichess is rate limiting requests. Wait at least one minute before trying again.");
    throw new Error("Lichess request failed (" + response.status + "). Please try again.");
  }
  return response;
}

async function startLichessLogin() {
  const button = document.getElementById("lichess-login");
  const next = new URLSearchParams(location.search).get("next") === "puzzles.html?mode=practice" ? "puzzles.html?mode=practice" : "account.html";
  if (me && lichessToken) { location.assign(next); return; }
  button.disabled = true;
  lichessMessage("lichess-login-message", "");
  try {
    if (location.protocol !== "https:" &&
        !(location.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname))) {
      throw new Error("Lichess login needs a website URL. Open this site at http://127.0.0.1:5500/login.html, not as a local file.");
    }
    const verifier = lichessBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const state = lichessBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = lichessBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
    const redirectUri = lichessRedirectUri();
    sessionStorage.setItem(LICHESS_PENDING_KEY, JSON.stringify({ verifier, state, redirectUri, next, createdAt: Date.now() }));
    const url = new URL("/oauth", LICHESS_ORIGIN);
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: LICHESS_CLIENT_ID,
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope: ""
    }).toString();
    location.assign(url.href);
  } catch (error) {
    sessionStorage.removeItem(LICHESS_PENDING_KEY);
    lichessMessage("lichess-login-message", error.message, true);
    button.disabled = false;
  }
}

function renderLichessProfile() {
  if (!document.getElementById("pw")) return;
  if(window.caPlayerDashboard){window.caPlayerDashboard.profile(me);return;}
  document.getElementById("pw").textContent = me.username;
  document.getElementById("lichess-avatar").textContent = me.username.slice(0,1).toUpperCase();
  document.getElementById("lichess-profile").href = LICHESS_ORIGIN + "/@/" + encodeURIComponent(me.username);
  const ratings = document.getElementById("lichess-ratings");
  ratings.replaceChildren();
  for (const [key, label] of [["bullet", "Bullet"], ["blitz", "Blitz"], ["rapid", "Rapid"], ["classical", "Classical"], ["puzzle", "Puzzles"]]) {
    const perf = me.perfs?.[key];
    if (!perf || !perf.games || !Number.isFinite(perf.rating)) continue;
    const card = document.createElement("div");
    card.dataset.perf = key;
    card.className = "lichess-rating";
    const rating = document.createElement("strong");
    rating.textContent = perf.rating + (perf.prov ? "?" : "");
    if(perf.prov)rating.title = "Provisional Lichess rating";
    const title = document.createElement("span");
    title.textContent = label;
    card.append(rating, title);
    ratings.append(card);
  }
}

function renderLichessGames(games) {
  if(window.caPlayerDashboard){window.caPlayerDashboard.games(games,me);return;}
  const container = document.getElementById("lichess-games");
  container.replaceChildren();
  const totals = {Win:0,Loss:0,Draw:0};
  for (const game of games) {
    if (typeof game.id !== "string" || !/^[A-Za-z0-9]{8}$/.test(game.id) || !game.players?.white || !game.players?.black) {
      throw new Error("Lichess returned incomplete game details. Please try again.");
    }
    const card = document.createElement("article");
    card.className = "lichess-game";
    const heading = document.createElement("h4");
    const playerName = player => player.user?.name || player.user?.id || (player.aiLevel ? "Stockfish level " + player.aiLevel : "Anonymous");
    heading.textContent = playerName(game.players.white) + " vs " + playerName(game.players.black);
    const details = document.createElement("p");
    details.className = "lichess-game-meta";
    const whiteId = game.players.white.user?.id?.toLowerCase();
    const color = whiteId === me.id.toLowerCase() ? "white" : "black";
    const result = game.winner ? (game.winner === color ? "Win" : "Loss") :
      (["draw", "stalemate"].includes(game.status) ? "Draw" : game.status || "Finished");
    if (Object.hasOwn(totals,result)) totals[result]++;
    const badge = document.createElement("span");
    badge.className = "lichess-result " + (result === "Win" ? "is-win" : result === "Loss" ? "is-loss" : "is-neutral");
    badge.textContent = result;
    const clock = game.clock ? " \u00b7 " + game.clock.initial / 60 + "+" + game.clock.increment : "";
    details.textContent = (game.speed || game.perf || game.variant || "Chess") + clock + " \u00b7 " + (game.rated ? "Rated" : "Casual") + " \u00b7 As " + color;
    const date = document.createElement("time");
    date.textContent = Number.isFinite(game.createdAt) ? new Date(game.createdAt).toLocaleString() : "";
    if(Number.isFinite(game.createdAt))date.dateTime = new Date(game.createdAt).toISOString();
    const link = document.createElement("a");
    link.href = LICHESS_ORIGIN + "/" + game.id;
    link.textContent = "Review game on Lichess \u2197";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const top = document.createElement("div");
    top.className = "lichess-game-top";
    top.append(heading,badge);
    card.append(top, details, date);
    if (game.opening?.name) {
      const opening = document.createElement("p");
      opening.className = "lichess-game-opening";
      opening.textContent = game.opening.name;
      card.append(opening);
    }
    card.append(link);
    container.append(card);
  }
  const count=(number,singular,plural)=>number+" "+(number===1?singular:plural);
  document.getElementById("lichess-recent-summary").textContent = games.length ?
    count(totals.Win,"win","wins")+" \u00b7 "+count(totals.Loss,"loss","losses")+" \u00b7 "+count(totals.Draw,"draw","draws")+" in the latest "+count(games.length,"game","games") : "";
}

async function loadLichessGames() {
  if (!me || lichessBusy) return;
  const account = me;
  const controller = new AbortController();
  lichessGamesController = controller;
  lichessBusy = true;
  document.getElementById("lichess-refresh").disabled = true;
  lichessMessage("lichess-games-message", "Loading recent games...");
  try {
    const params = new URLSearchParams({ max: "50", opening: "true", moves: "false", ongoing: "false" });
    const response = await lichessRequest("/api/games/user/" + encodeURIComponent(account.username) + "?" + params, {
      headers: { Accept: "application/x-ndjson" },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)])
    });
    const text = await response.text();
    if (controller.signal.aborted || me !== account) return;
    const games = text.split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line));
    renderLichessGames(games);
    lichessMessage("lichess-games-message", games.length ? "Your latest " + games.length + (games.length===1?" game.":" games.") : "No finished public games yet.");
    if(window.caPlayerDashboard)await window.caPlayerDashboard.history(account,controller.signal);
  } catch (error) {
    if (!controller.signal.aborted && me === account) lichessMessage("lichess-games-message", error.message, true);
  } finally {
    if (lichessGamesController === controller) {
      lichessGamesController = null;
      lichessBusy = false;
      document.getElementById("lichess-refresh").disabled = false;
    }
  }
}

function clearLichessSession(keepAuthorization = false) {
  lichessGamesController?.abort();
  window.caPlayerDashboard?.clear();
  lichessGamesController = null;
  lichessBusy = false;
  lichessToken = null;
  me = null;
  try{
    sessionStorage.removeItem(LICHESS_SESSION_KEY);
    sessionStorage.removeItem(LICHESS_ACCOUNT_KEY);
  }catch(error){console.error("Could not clear tab storage:",error)}
  if (!keepAuthorization) sessionStorage.removeItem(LICHESS_PENDING_KEY);
  const title = document.getElementById("pw");
  if (title) title.textContent = "Your Lichess account";
  document.getElementById("lichess-profile")?.removeAttribute("href");
  document.getElementById("lichess-ratings")?.replaceChildren();
  document.getElementById("lichess-games")?.replaceChildren();
  document.getElementById("lichess-recent-summary")?.replaceChildren();
  const refresh = document.getElementById("lichess-refresh");
  if (refresh) refresh.disabled = false;
  lichessMessage("lichess-games-message", "");
  updateLichessView();
}

async function logoutLichess() {
  const token = lichessToken;
  clearLichessSession();
  lichessMessage("lichess-login-message", "Logged out of Chess AnyTime. Your Lichess browser login is unchanged.");
  if (!token) return;
  try {
    await lichessRequest("/api/token", { method: "DELETE" }, token);
  } catch (error) {
    lichessMessage("lichess-login-message", "Logged out locally, but Lichess could not revoke the access token. Revoke Chess AnyTime access at lichess.org/account/oauth/token. " + error.message, true);
  }
}

async function finishLichessLogin() {
  const params = new URLSearchParams(location.search);
  if (!params.has("code") && !params.has("error")) return;
  const button = document.getElementById("lichess-login");
  if (button) button.disabled = true;
  const stored = sessionStorage.getItem(LICHESS_PENDING_KEY);
  sessionStorage.removeItem(LICHESS_PENDING_KEY);
  // Remove the authorization code from browser history before requesting account data.
  history.replaceState(null, "", lichessRedirectUri());
  lichessMessage("lichess-login-message", "Connecting your Lichess account...");
  try {
    const pending = stored ? JSON.parse(stored) : null;
    const age = pending ? Date.now() - pending.createdAt : NaN;
    if (!pending || !pending.state || !pending.verifier || !params.get("state") ||
        params.get("state") !== pending.state || !Number.isFinite(age) || age < 0 || age > 600000 ||
        pending.redirectUri !== lichessRedirectUri()) {
      throw new Error("This login request is invalid or expired. Please start a new Lichess login.");
    }
    if (params.has("error")) {
      throw new Error(params.get("error") === "access_denied" ? "Lichess login was cancelled. You can try again whenever you are ready." : "Lichess could not authorize this login. Please try again.");
    }
    if (!params.get("code")) throw new Error("Lichess did not return an authorization code. Please try again.");
    const response = await lichessRequest("/api/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: params.get("code"),
        code_verifier: pending.verifier,
        redirect_uri: pending.redirectUri,
        client_id: LICHESS_CLIENT_ID
      }),
      headers: { Accept: "application/json" }
    }, null);
    const authorization = await response.json();
    if (typeof authorization.access_token !== "string" || !authorization.access_token ||
        authorization.token_type?.toLowerCase() !== "bearer") {
      throw new Error("Lichess returned an invalid login response. Please try again.");
    }
    lichessToken = authorization.access_token;
    const accountResponse = await lichessRequest("/api/account", { headers: { Accept: "application/json" } });
    const account = await accountResponse.json();
    if (typeof account.username !== "string" || !account.username || typeof account.id !== "string" || !account.id) {
      throw new Error("Lichess returned an incomplete profile. Please try again.");
    }
    me = account;
    saveLichessSession();
    renderLichessProfile();
    updateLichessView();
    lichessMessage("lichess-login-message", "");
    if(pending.next === "puzzles.html?mode=practice"){
      location.replace(pending.next);
      return;
    }
    await loadLichessGames();
  } catch (error) {
    const token = lichessToken;
    clearLichessSession();
    lichessMessage("lichess-login-message", error.message, true);
    if (token) {
      try {
        await lichessRequest("/api/token", { method: "DELETE" }, token);
      } catch (revokeError) {
        lichessMessage("lichess-login-message", error.message + " Token revocation also failed; revoke Chess AnyTime access at lichess.org/account/oauth/token. " + revokeError.message, true);
      }
    }
  } finally {
    if (button) button.disabled = false;
  }
}

document.getElementById("lichess-login")?.addEventListener("click", startLichessLogin);
document.getElementById("lichess-logout")?.addEventListener("click", logoutLichess);
document.getElementById("lichess-refresh")?.addEventListener("click", loadLichessGames);
function saveLichessSession(){
  sessionStorage.setItem(LICHESS_SESSION_KEY,JSON.stringify({token:lichessToken,expiresAt:Date.now()+8*60*60*1000}));
  sessionStorage.setItem(LICHESS_ACCOUNT_KEY,JSON.stringify({id:me.id,username:me.username,perfs:me.perfs}));
}
async function restoreLichessSession(){
  try{
    const session=JSON.parse(sessionStorage.getItem(LICHESS_SESSION_KEY)||"null");
    if(!session||typeof session.token!=="string"||!session.token||!Number.isFinite(session.expiresAt)||session.expiresAt<=Date.now()){
      clearLichessSession(true);
      return;
    }
    lichessToken=session.token;
    const response=await lichessRequest("/api/account",{headers:{Accept:"application/json"}});
    const account=await response.json();
    if(typeof account.id!=="string"||!account.id||typeof account.username!=="string"||!account.username){
      throw new Error("Lichess returned an incomplete account. Please log in again.");
    }
    me=account;
    sessionStorage.setItem(LICHESS_ACCOUNT_KEY,JSON.stringify({id:me.id,username:me.username,perfs:me.perfs}));
    updateLichessView();
    renderLichessProfile();
    if(currentPage==="portal")await loadLichessGames();
  }catch(error){
    clearLichessSession(true);
    lichessMessage("lichess-login-message",error.message,true);
  }
}
const lichessReady=new URLSearchParams(location.search).has("code")||new URLSearchParams(location.search).has("error")?
  finishLichessLogin():restoreLichessSession();
addEventListener("pagehide",()=>{lichessGamesController?.abort()});
addEventListener("pageshow",event=>{if(event.persisted)restoreLichessSession()});
