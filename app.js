import { resolveMovies } from "./source-engine.js";
import { createVoiceSearch, isVoiceSearchSupported } from "./voice-search.js";

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const results = document.querySelector("#results");
const playerView = document.querySelector("#player-view");
const playerTitle = document.querySelector("#player-title");
const playerStage = document.querySelector("#player-stage");
const sourceList = document.querySelector("#source-list");
const backButton = document.querySelector("#back-button");
const searchStatus = document.querySelector("#search-status");
const voiceButton = document.querySelector("#voice-button");
const shareButton = document.querySelector("#share-button");
const fullscreenButton = document.querySelector("#fullscreen-button");

let currentMovie = null;
let currentSource = null;
let voiceRecognition = null;

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
    const sources = Array.isArray(movie.sources) ? movie.sources : [];
    const playable = sources.some(s => s.status === "ready");
    const sourceCount = sources.length;
    const providerCount = new Set(sources.map(s => s.provider).filter(Boolean)).size;
    const rightsReview = sources.some(s => s.rightsStatus === "review" || s.rightsStatus === "unknown");

    card.innerHTML =
      '<div><h3>' + escapeHtml(movie.title) + '</h3>' +
      '<div class="result-meta">' +
      (movie.year ? escapeHtml(movie.year) + " · " : "") +
      escapeHtml((movie.genres || []).join(" · ") || "Movie") +
      '</div><div class="result-source">' +
      (playable ? "SOURCE READY" : "SOURCE AVAILABLE") +
      ' · ' + sourceCount + ' SOURCE' + (sourceCount === 1 ? "" : "S") +
      (providerCount > 1 ? ' · ' + providerCount + ' PROVIDERS' : '') +
      '</div>' +
      (rightsReview ? '<div class="result-note">SOURCE RIGHTS REQUIRE REVIEW</div>' : '') +
      '</div>' +
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
  currentSource = null;
  playerTitle.textContent = movie.title;
  playerStage.innerHTML =
    '<div class="player-empty"><div class="play-orb">▶</div>' +
    '<p>Choose a source below.</p></div>';

  sourceList.innerHTML = "";

  const sources = [...(movie.sources || [])].sort((a, b) => {
    const statusRank = { ready: 0, review: 1, unavailable: 2, blocked: 3 };
    const statusDifference = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
    if (statusDifference) return statusDifference;
    return sourcePriority(a) - sourcePriority(b);
  });

  sources.forEach(source => {
    const row = document.createElement("div");
    row.className = "source-row";

    const info = document.createElement("div");
    info.innerHTML =
      '<div class="source-name">' + escapeHtml(source.name) + '</div>' +
      '<div class="source-status">' +
      escapeHtml(String(source.status || "").toUpperCase()) +
      (source.rightsStatus ? " · RIGHTS " + escapeHtml(String(source.rightsStatus).toUpperCase()) : "") +
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
  currentSource = source;
  playerStage.innerHTML =
    '<iframe src="' + escapeAttribute(source.embedUrl) +
    '" title="' + escapeAttribute(currentMovie.title) +
    '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" ' +
    'allowfullscreen></iframe>';
}

function loadMedia(source) {
  currentSource = source;
  playerStage.innerHTML =
    '<video controls playsinline preload="metadata" src="' +
    escapeAttribute(source.mediaUrl) + '">' +
    'Your browser cannot play this media source.' +
    '</video>';
}

function setSearchStatus(message = "") {
  searchStatus.textContent = message;
}

async function shareCurrentVideo() {
  if (!currentMovie) return;

  const url = new URL(window.location.href);
  url.searchParams.set("watch", currentMovie.id);

  const shareData = {
    title: currentMovie.title,
    text: "Watch " + currentMovie.title + " on CICAN",
    url: url.toString()
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url.toString());
      setSearchStatus("CICAN video link copied.");
    }
  } catch (error) {
    if (error?.name !== "AbortError") console.error(error);
  }
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await playerStage.requestFullscreen?.();
  } catch (error) {
    console.error(error);
  }
}

function setupVoiceSearch() {
  if (!voiceButton) return;

  if (!isVoiceSearchSupported()) {
    voiceButton.hidden = true;
    return;
  }

  voiceRecognition = createVoiceSearch({
    onStart: () => {
      voiceButton.classList.add("listening");
      voiceButton.textContent = "●";
      setSearchStatus("Listening… speak your video search.");
    },
    onEnd: () => {
      voiceButton.classList.remove("listening");
      voiceButton.textContent = "🎙";
    },
    onError: error => {
      setSearchStatus(
        error === "not-allowed"
          ? "Microphone permission is required for voice search."
          : "Voice search is unavailable. Try typing instead."
      );
    },
    onResult: transcript => {
      input.value = transcript;
      form.requestSubmit();
    }
  });

  voiceButton.addEventListener("click", () => {
    try {
      voiceRecognition?.start();
    } catch (error) {
      if (error.name !== "InvalidStateError") console.error(error);
    }
  });
}

shareButton?.addEventListener("click", shareCurrentVideo);
fullscreenButton?.addEventListener("click", toggleFullscreen);
setupVoiceSearch();

backButton.onclick = () => {
  playerView.hidden = true;
  results.hidden = false;
  playerStage.innerHTML = "";
  currentMovie = null;
  currentSource = null;
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

const initialWatchId = new URLSearchParams(window.location.search).get("watch");
if (initialWatchId) {
  resolveMovies(initialWatchId, { id: initialWatchId })
    .then(items => {
      const movie = items.find(item => item.id === initialWatchId);
      if (movie) openMovie(movie);
    })
    .catch(() => {});
}
