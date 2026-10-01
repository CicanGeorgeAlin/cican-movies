import { resolveMovies } from "./source-engine.js";

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const results = document.querySelector("#results");
const playerView = document.querySelector("#player-view");
const playerTitle = document.querySelector("#player-title");
const playerStage = document.querySelector("#player-stage");
const sourceList = document.querySelector("#source-list");
const backButton = document.querySelector("#back-button");
const searchStatus = document.querySelector("#search-status");

let currentMovie = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function sourcePriority(source) {
  if (source.type === "embed") return 0;
  if (source.type === "media") return 1;
  if (source.type === "external") return 2;
  return 3;
}

function renderResults(items, query) {
  results.innerHTML = "";

  if (!items.length) {
    results.innerHTML = query
      ? '<div class="no-results">No available indexed source found for “' + escapeHtml(query) + '”.</div>'
      : "";
    return;
  }

  items.forEach(movie => {
    const card = document.createElement("article");
    card.className = "result-card";
    const playable = (movie.sources || []).some(s => s.status === "ready");

    card.innerHTML =
      '<div><h3>' + escapeHtml(movie.title) + '</h3>' +
      '<div class="result-meta">' +
      (movie.year ? escapeHtml(movie.year) + " · " : "") +
      escapeHtml((movie.genres || []).join(" · ") || "Movie") +
      '</div><div class="result-source">' +
      (playable ? "SOURCE READY" : "SOURCE AVAILABLE") +
      '</div></div>' +
      '<button class="play-button" data-id="' + escapeAttribute(movie.id) + '">OPEN</button>';

    results.appendChild(card);
  });

  results.querySelectorAll("[data-id]").forEach(button => {
    button.addEventListener("click", () => {
      const movie = items.find(item => item.id === button.dataset.id);
      if (movie) openMovie(movie);
    });
  });
}

function openMovie(movie) {
  currentMovie = movie;
  playerTitle.textContent = movie.title;
  playerStage.innerHTML =
    '<div class="player-empty"><div class="play-orb">▶</div>' +
    '<p>Choose a source below.</p></div>';

  sourceList.innerHTML = "";

  const sources = [...(movie.sources || [])].sort(
    (a, b) => sourcePriority(a) - sourcePriority(b)
  );

  sources.forEach(source => {
    const row = document.createElement("div");
    row.className = "source-row";

    const info = document.createElement("div");
    info.innerHTML =
      '<div class="source-name">' + escapeHtml(source.name) + '</div>' +
      '<div class="source-status">' +
      escapeHtml(String(source.status || "").toUpperCase()) +
      '</div>';

    row.appendChild(info);

    if (source.type === "embed" && source.embedUrl) {
      const button = document.createElement("button");
      button.className = "play-button";
      button.textContent = "PLAY";
      button.onclick = () => loadEmbed(source);
      row.appendChild(button);
    } else if (source.type === "media" && source.mediaUrl) {
      const button = document.createElement("button");
      button.className = "play-button";
      button.textContent = "PLAY";
      button.onclick = () => loadMedia(source);
      row.appendChild(button);
    } else if (source.url) {
      const link = document.createElement("a");
      link.className = "play-button";
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "OPEN SOURCE";
      row.appendChild(link);
    }

    sourceList.appendChild(row);
  });

  results.hidden = true;
  playerView.hidden = false;
  playerView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadEmbed(source) {
  playerStage.innerHTML =
    '<iframe src="' + escapeAttribute(source.embedUrl) +
    '" title="' + escapeAttribute(currentMovie.title) +
    '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" ' +
    'allowfullscreen></iframe>';
}

function loadMedia(source) {
  playerStage.innerHTML =
    '<video controls playsinline preload="metadata" src="' +
    escapeAttribute(source.mediaUrl) + '">' +
    'Your browser cannot play this media source.' +
    '</video>';
}

function setSearchStatus(message = "") {
  searchStatus.textContent = message;
}

backButton.onclick = () => {
  playerView.hidden = true;
  results.hidden = false;
  playerStage.innerHTML = "";
  currentMovie = null;
  window.scrollTo({ top: results.offsetTop - 20, behavior: "smooth" });
};

form.addEventListener("submit", async event => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  results.innerHTML =
    '<div class="searching">SEARCHING THE AVAILABLE MOVIE SOURCES…</div>';
  playerView.hidden = true;
  results.hidden = false;
  setSearchStatus("Searching local index and enabled source providers…");

  try {
    const movies = await resolveMovies(query);
    renderResults(movies, query);
    setSearchStatus(
      movies.length
        ? movies.length + " movie result" + (movies.length === 1 ? "" : "s") + " found."
        : "No matching source found."
    );
  } catch (error) {
    results.innerHTML =
      '<div class="no-results">The source search is temporarily unavailable. Please try again.</div>';
    setSearchStatus("Source search error.");
    console.error(error);
  }

  results.scrollIntoView({ behavior: "smooth", block: "start" });
});
