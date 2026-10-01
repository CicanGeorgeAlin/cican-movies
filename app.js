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
const shareButton = document.querySelector("#share-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const searchToggle = document.querySelector("#search-toggle");

let currentMovie = null;
let currentSource = null;
let currentSourceIndex = -1;
let currentSources = [];
let failedSourceIds = new Set();
const MOVIE_CONTENT_TYPE = "movie";

const FEATURED_MOVIE_QUERIES = [
  "Night of the Living Dead",
  "His Girl Friday",
  "The General",
  "Carnival of Souls",
  "Nosferatu",
  "Metropolis",
  "The Cabinet of Dr. Caligari",
  "Sherlock Jr.",
  "Safety Last",
  "The Kid",
  "The Gold Rush",
  "A Trip to the Moon",
  "Detour",
  "D.O.A.",
  "The Stranger",
  "House on Haunted Hill"
];

function moviePoster(movie) {
  if (movie.posterUrl) return movie.posterUrl;
  const archiveSource = (movie.sources || []).find(source => source.provider === "archive.org");
  const match = archiveSource?.id?.match(/^archive-(.+)$/);
  return match ? "https://archive.org/services/img/" + encodeURIComponent(match[1]) : "";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function addFullscreenExitButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "fullscreen-exit";
  button.setAttribute("aria-label", "Exit fullscreen");
  button.title = "Exit fullscreen";
  button.textContent = "×";
  button.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (error) {
      console.error(error);
    }
  });
  playerStage.appendChild(button);
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
      ? '<div class="no-results">No movie source found for “' + escapeHtml(query) + '”.</div>'
      : "";
    return;
  }

  items.forEach(movie => {
    const card = document.createElement("article");
    card.className = "result-card";
    const sources = Array.isArray(movie.sources) ? movie.sources : [];
    const playable = sources.some(s => s.status === "ready");
    const sourceCount = sources.length;
    const poster = moviePoster(movie);
    const description = String(movie.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    card.innerHTML =
      '<div class="result-poster">' +
      (poster
        ? '<img src="' + escapeAttribute(poster) + '" alt="" loading="lazy">'
        : '<div class="result-poster-empty">CICAN</div>') +
      '</div>' +
      '<div class="result-card-body">' +
      '<h3>' + escapeHtml(movie.title) + '</h3>' +
      '<div class="result-meta">' + (movie.year ? escapeHtml(movie.year) + " · " : "") + 'MOVIE</div>' +
      '<div class="result-source">' +
      (playable ? "SOURCE READY" : "SOURCE AVAILABLE") +
      ' · ' + sourceCount + ' SOURCE' + (sourceCount === 1 ? "" : "S") +
      '</div>' +
      (description ? '<div class="result-note">' + escapeHtml(description.slice(0, 140)) + '</div>' : '') +
      '</div>' +
      '<button class="play-button" data-id="' + escapeAttribute(movie.id) + '">WATCH</button>';

    results.appendChild(card);
  });

  results.querySelectorAll("[data-id]").forEach(button => {
    button.addEventListener("click", () => {
      const movie = items.find(item => item.id === button.dataset.id);
      if (movie) openMovie(movie);
    });
  });
}

function syncWatchUrl(movie) {
  if (!movie?.id || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  const currentId = url.searchParams.get("watch");
  url.searchParams.set("watch", movie.id);

  if (currentId === movie.id) {
    window.history.replaceState({ watch: movie.id }, "", url);
    return;
  }

  window.history.pushState({ watch: movie.id }, "", url);
}

function clearWatchUrl() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("watch");
  window.history.replaceState({}, "", url);
}

function openMovie(movie) {
  currentMovie = movie;
  syncWatchUrl(movie);
  currentSource = null;
  playerTitle.textContent = movie.title;
  playerStage.innerHTML =
    '<div class="player-empty"><div class="play-orb">▶</div>' +
    '<p>Choose a source below.</p></div>';

  sourceList.innerHTML = "";
  currentSources = playableSources(movie);
  currentSourceIndex = -1;
  failedSourceIds = new Set();

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
      (failedSourceIds.has(source.id) ? "FAILED THIS SESSION" : escapeHtml(String(source.status || "").toUpperCase())) +
      (source.rightsStatus ? " · RIGHTS " + escapeHtml(String(source.rightsStatus).toUpperCase()) : "") +
      '</div>';

    row.appendChild(info);

    const canPlay = source.status === "ready" &&
      ((source.type === "embed" && source.embedUrl) ||
       (source.type === "media" && source.mediaUrl));

    if (canPlay) {
      const button = document.createElement("button");
      button.className = "play-button";
      button.textContent = failedSourceIds.has(source.id) ? "RETRY" : "PLAY";
      button.onclick = () => {
        failedSourceIds.delete(source.id);
        loadSource(source);
      };
      row.appendChild(button);
    } else if (source.url) {
      const link = document.createElement("a");
      link.className = "play-button";
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.status === "ready" ? "OPEN SOURCE" : "REVIEW SOURCE";
      row.appendChild(link);
    } else {
      const label = document.createElement("span");
      label.className = "source-status";
      label.textContent = "NOT PLAYABLE";
      row.appendChild(label);
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

function getNextPlayableSource() {
  return currentSources
    .slice(currentSourceIndex + 1)
    .find(source => !failedSourceIds.has(source.id)) || null;
}

function showPlaybackFallback(message = "This source could not be played.", { autoTryNext = false } = {}) {
  const failedSource = currentSource;
  if (failedSource?.id) failedSourceIds.add(failedSource.id);

  const video = playerStage.querySelector("video");
  if (video && currentMovie && video.currentTime > 0 && !video.ended) {
    savePosition(currentMovie, video.currentTime, video.duration);
  }

  currentSource = null;
  const next = getNextPlayableSource();

  if (autoTryNext && next) {
    loadSource(next);
    return;
  }

  playerStage.innerHTML =
    '<div class="player-error"><strong>' + escapeHtml(message) + '</strong>' +
    (next
      ? '<p>CICAN found another playable source.</p><button class="play-button" id="fallback-play">TRY NEXT SOURCE</button>'
      : '<p>No additional playable source is currently available.</p>') +
    '</div>';

  document.querySelector("#fallback-play")?.addEventListener("click", () => {
    const nextSource = getNextPlayableSource();
    if (nextSource) loadSource(nextSource);
  });
}
function loadSource(source) {
  const previousVideo = playerStage.querySelector("video");
  if (previousVideo && currentMovie && previousVideo.currentTime > 0 && !previousVideo.ended) {
    savePosition(currentMovie, previousVideo.currentTime, previousVideo.duration);
  }

  const index = currentSources.findIndex(item => item.id === source.id);
  currentSourceIndex = index;
  currentSource = source;

  if (source.type === "embed") return loadEmbed(source);
  if (source.type === "media") return loadMedia(source);

  showPlaybackFallback("This source is not playable in CICAN.");
}

function selectBestSource(movie) {
  const candidates = playableSources(movie)
    .filter(source => !failedSourceIds.has(source.id));
  if (!candidates.length) return null;

  const lastSourceId = getLastSourceId(movie);
  const remembered = candidates.find(source => source.id === lastSourceId);
  if (remembered) return remembered;

  return candidates[0];
}

const PLAYBACK_KEY = "cican-movies-playback-v1";
const SOURCE_MEMORY_KEY = "cican-movies-source-v1";

function getLastSourceId(movie) {
  try {
    const saved = JSON.parse(localStorage.getItem(SOURCE_MEMORY_KEY) || "{}");
    return saved[playbackId(movie)] || "";
  } catch {
    return "";
  }
}

function saveLastSource(movie, source) {
  const id = playbackId(movie);
  if (!id || !source?.id) return;
  try {
    const saved = JSON.parse(localStorage.getItem(SOURCE_MEMORY_KEY) || "{}");
    saved[id] = source.id;
    localStorage.setItem(SOURCE_MEMORY_KEY, JSON.stringify(saved));
  } catch {}
}

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

function savePosition(movie, position, duration = 0) {
  const id = playbackId(movie);
  if (!id || !Number.isFinite(position) || position < 5) return;

  if (Number.isFinite(duration) && duration > 0 && position >= duration - 5) {
    clearPosition(movie);
    return;
  }

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

  if (savedPosition > 5 && (!Number.isFinite(video.duration) || savedPosition < video.duration - 2)) {
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
      savePosition(currentMovie, video.currentTime, video.duration);
    }
  });

  video.addEventListener("pause", () => {
    if (!video.ended) savePosition(currentMovie, video.currentTime, video.duration);
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
  addFullscreenExitButton();

  const frame = playerStage.querySelector("iframe");
  frame?.addEventListener("load", () => saveLastSource(currentMovie, source));
  frame?.addEventListener("error", () => showPlaybackFallback("This embedded source failed to load."));
}

function loadMedia(source) {
  currentSource = source;
  playerStage.innerHTML =
    '<video controls playsinline preload="metadata" src="' +
    escapeAttribute(source.mediaUrl) + '">' +
    'Your browser cannot play this media source.' +
    '</video>';
  addFullscreenExitButton();

  const video = playerStage.querySelector("video");
  if (video) {
    attachMediaMemory(video);
    video.addEventListener("loadeddata", () => saveLastSource(currentMovie, source));
    video.addEventListener("error", () => showPlaybackFallback("This media source failed to load.", { autoTryNext: true }));
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

shareButton?.addEventListener("click", shareCurrentVideo);

searchToggle?.addEventListener("click", () => {
  const open = searchToggle.getAttribute("aria-expanded") === "true";
  searchToggle.setAttribute("aria-expanded", String(!open));
  searchToggle.textContent = open ? "⌕ SEARCH MOVIES" : "× CLOSE SEARCH";
  form.hidden = open;
  if (!open) {
    input.focus();
  } else {
    input.value = "";
    setSearchStatus("");
  }
});
fullscreenButton?.addEventListener("click", toggleFullscreen);
document.querySelectorAll(".alphabet-button").forEach(button => {
  button.addEventListener("click", () => {
    const letter = button.dataset.letter || "";
    input.value = letter;
    document.querySelectorAll(".alphabet-button").forEach(item =>
      item.classList.toggle("active", item === button)
    );
    results.innerHTML = '<div class="searching">LOADING MOVIES STARTING WITH ' + escapeHtml(letter) + '…</div>';
    results.hidden = false;
    form.requestSubmit();
  });
});

input.addEventListener("input", () => {
  const value = input.value.trim();
  document.querySelectorAll(".alphabet-button").forEach(button => {
    button.classList.toggle("active", value.length === 1 && value.toUpperCase() === button.dataset.letter);
  });
});


function closePlayerView({ updateHistory = true } = {}) {
  if (updateHistory && new URL(window.location.href).searchParams.has("watch")) {
    window.history.back();
    return;
  }

  clearWatchUrl();
  playerView.hidden = true;
  results.hidden = false;
  playerStage.innerHTML = "";
  currentMovie = null;
  currentSource = null;
  currentSourceIndex = -1;
  currentSources = [];
  failedSourceIds = new Set();
  window.scrollTo({ top: results.offsetTop - 20, behavior: "smooth" });
}

backButton.onclick = () => closePlayerView();

window.addEventListener("popstate", event => {
  const watchId = new URLSearchParams(window.location.search).get("watch");

  if (watchId) {
    resolveMovies(watchId, { id: watchId })
      .then(items => {
        const movie = items.find(item => item.id === watchId);
        if (movie) openMovie(movie);
      })
      .catch(() => {});
    return;
  }

  if (!playerView.hidden) closePlayerView({ updateHistory: false });
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  results.innerHTML =
    '<div class="searching">SEARCHING THE AVAILABLE MOVIE SOURCES…</div>';
  playerView.hidden = true;
  results.hidden = false;
  setSearchStatus(query.length === 1 && /^[a-z]$/i.test(query) ? "Browsing movies starting with " + query.toUpperCase() + "…" : "Searching movies in the CICAN index and enabled source providers…");

  try {
    const movies = await resolveMovies(query, { contentType: MOVIE_CONTENT_TYPE });
    renderResults(movies, query);
    const isLetterBrowse = query.length === 1 && /^[a-z]$/i.test(query);
    setSearchStatus(
      movies.length
        ? (isLetterBrowse ? movies.length + " movies starting with " + query.toUpperCase() + "." : movies.length + " movie" + (movies.length === 1 ? "" : "s") + " found.")
        : (isLetterBrowse ? "No movies starting with " + query.toUpperCase() + " are currently available." : "No matching movie source found. Try another title.")
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
