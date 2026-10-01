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
let currentSourceIndex = -1;
let currentSources = [];
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
  currentSources = playableSources(movie);
  currentSourceIndex = -1;

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
      button.onclick = () => loadSource(source);
      row.appendChild(button);
    } else if (source.type === "media" && source.mediaUrl) {
      const button = document.createElement("button");
      button.className = "play-button";
      button.textContent = "PLAY";
      button.onclick = () => loadSource(source);
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

  const bestSource = selectBestSource(movie);
  if (bestSource) {
    loadSource(bestSource);
  }

  results.hidden = true;
  playerView.hidden = false;
  playerView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function playableSources(movie) {
  return [...(movie.sources || [])]
    .filter(source =>
      source.status === "ready" &&
      ((source.type === "embed" && source.embedUrl) ||
       (source.type === "media" && source.mediaUrl))
    );
}

function showPlaybackFallback(message = "This source could not be played.") {
  const remaining = currentSources.slice(currentSourceIndex + 1);
  playerStage.innerHTML =
    '<div class="player-error"><strong>' + escapeHtml(message) + '</strong>' +
    (remaining.length
      ? '<p>CICAN found another playable source.</p><button class="play-button" id="fallback-play">TRY NEXT SOURCE</button>'
      : '<p>No additional playable source is currently available.</p>') +
    '</div>';

  document.querySelector("#fallback-play")?.addEventListener("click", () => {
    const next = currentSources[currentSourceIndex + 1];
    if (next) loadSource(next);
  });
}

function loadSource(source) {
  const index = currentSources.findIndex(item => item.id === source.id);
  currentSourceIndex = index;
  currentSource = source;

  if (source.type === "embed") return loadEmbed(source);
  if (source.type === "media") return loadMedia(source);

  showPlaybackFallback("This source is not playable in CICAN.");
}

function selectBestSource(movie) {
  const candidates = playableSources(movie);
  return candidates[0] || null;
}

const PLAYBACK_KEY = "cican-movies-playback-v1";

function playbackId(movie) {
  return movie?.id ? String(movie.id) : "";
}

function getSavedPosition(movie) {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYBACK_KEY) || "{}");
    const value = Number(saved[playbackId(movie)]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function savePosition(movie, position) {
  const id = playbackId(movie);
  if (!id || !Number.isFinite(position) || position <= 0) return;
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYBACK_KEY) || "{}");
    saved[id] = position;
    localStorage.setItem(PLAYBACK_KEY, JSON.stringify(saved));
  } catch {}
}

function clearPosition(movie) {
  const id = playbackId(movie);
  if (!id) return;
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYBACK_KEY) || "{}");
    delete saved[id];
    localStorage.setItem(PLAYBACK_KEY, JSON.stringify(saved));
  } catch {}
}

function restoreMediaPosition(video) {
  const position = getSavedPosition(currentMovie);
  if (!position) return;

  const restore = () => {
    if (Number.isFinite(video.duration) && position < video.duration - 2) {
      try { video.currentTime = position; } catch {}
    }
    video.removeEventListener("loadedmetadata", restore);
  };

  video.addEventListener("loadedmetadata", restore);
}

function formatPlaybackTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return minutes + ":" + String(secs).padStart(2, "0");
}

function attachMediaMemory(video) {
  const savedPosition = getSavedPosition(currentMovie);
  restoreMediaPosition(video);

  if (savedPosition > 5) {
    const notice = document.createElement("div");
    notice.className = "resume-notice";
    notice.innerHTML =
      '<strong>RESUME FROM ' + escapeHtml(formatPlaybackTime(savedPosition)) + '</strong>' +
      '<button type="button" class="resume-start">START FROM BEGINNING</button>';
    playerStage.appendChild(notice);

    notice.querySelector(".resume-start")?.addEventListener("click", () => {
      clearPosition(currentMovie);
      try { video.currentTime = 0; } catch {}
      notice.remove();
    });
  }

  video.addEventListener("timeupdate", () => {
    if (video.currentTime > 0 && !video.ended) {
      savePosition(currentMovie, video.currentTime);
    }
  });

  video.addEventListener("pause", () => {
    if (!video.ended) savePosition(currentMovie, video.currentTime);
  });

  video.addEventListener("ended", () => clearPosition(currentMovie));
}

function loadEmbed(source) {
  currentSource = source;
  playerStage.innerHTML =
    '<iframe src="' + escapeAttribute(source.embedUrl) +
    '" title="' + escapeAttribute(currentMovie.title) +
    '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" ' +
    'allowfullscreen></iframe>';

  const frame = playerStage.querySelector("iframe");
  frame?.addEventListener("error", () => showPlaybackFallback("This embedded source failed to load."));
}

function loadMedia(source) {
  currentSource = source;
  playerStage.innerHTML =
    '<video controls playsinline preload="metadata" src="' +
    escapeAttribute(source.mediaUrl) + '">' +
    'Your browser cannot play this media source.' +
    '</video>';

  const video = playerStage.querySelector("video");
  if (video) {
    attachMediaMemory(video);
    video.addEventListener("error", () => showPlaybackFallback("This media source failed to load."));
  }
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
  currentSourceIndex = -1;
  currentSources = [];
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
