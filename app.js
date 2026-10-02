import { resolveMovies } from "./source-engine.js?v=az-final3-20261002";

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
let resultsScrollY = 0;
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

const subtitleDiscoveryCache = new Map();

const LANGUAGE_NAMES = {
  ar: "Arabic", bg: "Bulgarian", ca: "Catalan", cs: "Czech", da: "Danish",
  de: "German", el: "Greek", en: "English", es: "Spanish", et: "Estonian",
  fa: "Persian", fi: "Finnish", fr: "French", he: "Hebrew", hi: "Hindi",
  hr: "Croatian", hu: "Hungarian", id: "Indonesian", it: "Italian", ja: "Japanese",
  ko: "Korean", lt: "Lithuanian", lv: "Latvian", nl: "Dutch", no: "Norwegian",
  pl: "Polish", pt: "Portuguese", ro: "Romanian", ru: "Russian", sk: "Slovak",
  sl: "Slovenian", sr: "Serbian", sv: "Swedish", th: "Thai", tr: "Turkish",
  uk: "Ukrainian", vi: "Vietnamese", ryu: "Okinawan",
  zh: "Chinese", "zh-hans": "Simplified Chinese", "zh-hant": "Traditional Chinese"
};

function languageLabel(code) {
  const raw = String(code || "").toLowerCase();
  const key = raw.split("-")[0];
  return LANGUAGE_NAMES[raw] || LANGUAGE_NAMES[key] || String(code || "").toUpperCase();
}

function subtitleTracksForSource(source) {
  return Array.isArray(source?.subtitles)
    ? source.subtitles.filter(track => track?.src && track?.srclang)
    : [];
}

function getWikimediaFileName(source) {
  const sourceUrl = String(source?.url || "");
  const match = sourceUrl.match(/(?:\/wiki\/File:|\/wiki\/Special:Redirect\/file\/)([^?#]+)/i);
  if (match) return decodeURIComponent(match[1]);
  const mediaUrl = String(source?.mediaUrl || "");
  const fileName = mediaUrl.split("/").pop();
  return fileName ? decodeURIComponent(fileName) : "";
}

async function discoverWikimediaSubtitles(source) {
  if (!source || source.provider !== "wikimedia-commons") return [];
  const fileName = getWikimediaFileName(source);
  if (!fileName) return [];

  const cacheKey = fileName.toLowerCase();
  if (subtitleDiscoveryCache.has(cacheKey)) return subtitleDiscoveryCache.get(cacheKey);

  const promise = fetch(
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    "&list=allpages&apnamespace=102&aplimit=500&apprefix=" +
    encodeURIComponent("TimedText:" + fileName + ".")
  )
    .then(response => response.ok ? response.json() : { query: { allpages: [] } })
    .then(data => {
      const pages = Array.isArray(data?.query?.allpages) ? data.query.allpages : [];
      return pages.map(page => {
        const title = String(page.title || "");
        const suffix = title.slice(("TimedText:" + fileName + ".").length);
        const languageMatch = suffix.match(/^([a-z]{2,3}(?:-[a-z]{4})?(?:-[A-Z]{2})?)\.(?:vtt|srt)$/i);
        if (!languageMatch) return null;
        const srclang = languageMatch[1].toLowerCase();
        return {
          src: "https://commons.wikimedia.org/w/index.php?title=" +
            encodeURIComponent(title) + "&action=raw",
          srclang,
          label: languageLabel(srclang),
          kind: "subtitles"
        };
      }).filter(Boolean);
    })
    .catch(() => []);

  subtitleDiscoveryCache.set(cacheKey, promise);
  return promise;
}

function srtToVtt(text) {
  const normalized = String(text || "").replace(/^\\uFEFF/, "").replace(/\\r\\n?/g, "\\n").trim();
  if (!normalized) throw new Error("Empty subtitle file");
  const cues = normalized
    .split(/\\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => block.replace(/(\\d{2}:\\d{2}:\\d{2}),\\d{3}/g, "$1.$2"))
    .filter(block => /\\d{2}:\\d{2}:\\d{2}\\.\\d{3}\\s+-->\\s+\\d{2}:\\d{2}:\\d{2}\\.\\d{3}/.test(block));
  if (!cues.length) throw new Error("Invalid SRT subtitle timing");
  return "WEBVTT\\n\\n" + cues.join("\\n\\n") + "\\n";
}

async function prepareSubtitleTrack(track) {
  const url = String(track?.src || "");
  if (!url) return null;
  const isVtt = /\\.vtt(?:[?#]|$)/i.test(url);
  const isSrt = /\\.srt(?:[?#]|$)/i.test(url);
  if (!isVtt && !isSrt) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Subtitle request failed");
    const text = await response.text();

    if (isVtt) {
      if (!/^\\s*WEBVTT(?:\\s|$)/i.test(text)) throw new Error("Invalid WebVTT");
      return { ...track, src: url };
    }

    const vtt = srtToVtt(text);
    const blobUrl = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
    return { ...track, src: blobUrl, convertedFrom: "srt" };
  } catch {
    if (isVtt) return { ...track, src: url };
    return null;
  }
}

async function addSubtitleTracks(video, source) {
  const supplied = subtitleTracksForSource(source);
  const discovered = await discoverWikimediaSubtitles(source);
  const candidates = [...supplied, ...discovered]
    .filter(track => /\\.(?:vtt|srt)(?:[?#]|$)/i.test(String(track.src || "")))
    .filter((track, index, all) =>
      all.findIndex(item => item.src === track.src || item.srclang === track.srclang) === index
    );

  const tracks = (await Promise.all(candidates.map(prepareSubtitleTrack))).filter(Boolean);

  tracks.forEach((track, index) => {
    const element = document.createElement("track");
    element.kind = track.kind || "subtitles";
    element.label = track.label || languageLabel(track.srclang);
    element.srclang = track.srclang;
    element.src = track.src;
    element.default = Boolean(track.default) || (!tracks.some(item => item.default) && index === 0 && track.srclang.startsWith("en"));
    video.appendChild(element);
  });

  if (tracks.length) {
    source.capabilities = { ...(source.capabilities || {}), subtitles: true };

  } else {
    source.capabilities = { ...(source.capabilities || {}), subtitles: false };
  }
  return tracks.length;
}

async function lockLandscapeOrientation() {
  try {
    if (screen.orientation?.lock) await screen.orientation.lock("landscape");
  } catch {}
}

function unlockScreenOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch {}
}

function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function fitFullscreenVideo() {
  const video = playerStage?.querySelector("video");
  if (!video) return;
  video.style.removeProperty("width");
  video.style.removeProperty("height");
}
function syncFullscreenUi() {
  const active = isFullscreenActive();
  if (active) lockLandscapeOrientation();
  else unlockScreenOrientation();
  fullscreenButton?.setAttribute("aria-pressed", String(active));
  fullscreenButton?.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
  fullscreenButton?.setAttribute("title", active ? "Exit fullscreen" : "Enter fullscreen");
  if (fullscreenButton) fullscreenButton.textContent = active ? "× EXIT FULLSCREEN" : "⛶ FULLSCREEN";
  playerStage?.classList.toggle("is-fullscreen", active);
  window.requestAnimationFrame(fitFullscreenVideo);
}

function installFullscreenListeners() {
  document.addEventListener("fullscreenchange", syncFullscreenUi);
  document.addEventListener("webkitfullscreenchange", syncFullscreenUi);
  window.addEventListener("resize", fitFullscreenVideo);
  window.addEventListener("orientationchange", () => window.setTimeout(fitFullscreenVideo, 120));
  syncFullscreenUi();
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
  resultsScrollY = window.scrollY;
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
    row.dataset.sourceId = source.id;

    const info = document.createElement("div");
    info.innerHTML =
      '<div class="source-name">' + escapeHtml(source.name) + '</div>' +
      '<div class="source-status">' +
      (failedSourceIds.has(source.id) ? "FAILED THIS SESSION" : escapeHtml(String(source.status || "").toUpperCase())) +
      (source.rightsStatus ? " · RIGHTS " + escapeHtml(String(source.rightsStatus).toUpperCase()) : "") +
      '</div>';

    row.appendChild(info);

    const canPlay = source.status !== "blocked" && source.status !== "unavailable" &&
      ((source.type === "embed" && source.embedUrl) ||
       (source.type === "media" && source.mediaUrl));

    if (canPlay) {
      const button = document.createElement("button");
      button.className = "play-button";
      button.dataset.sourceId = source.id;
      button.textContent = failedSourceIds.has(source.id) ? "RETRY" : "PLAY";
      button.onclick = () => {
        failedSourceIds.delete(source.id);
        loadSource(source, { userInitiated: true, fullscreen: true, autoplay: true });
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
      source.status !== "blocked" && source.status !== "unavailable" &&
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
function updateSourceSelection() {
  sourceList.querySelectorAll(".source-row").forEach(row => {
    row.classList.toggle("active", row.dataset.sourceId === currentSource?.id);
  });
}

async function requestPlayerFullscreen() {
  if (isFullscreenActive()) return true;

  try {
    if (playerStage?.requestFullscreen) {
      await playerStage.requestFullscreen({ navigationUI: "hide" });
      return true;
    }
  } catch {}

  try {
    if (playerStage?.webkitRequestFullscreen) {
      playerStage.webkitRequestFullscreen();
      return true;
    }
  } catch {}

  return false;
}

function loadSource(source, options = {}) {
  const index = currentSources.findIndex(item => item.id === source.id);
  currentSourceIndex = index;
  currentSource = source;
  updateSourceSelection();

  if (source.type === "embed") return loadEmbed(source, options);
  if (source.type === "media") return loadMedia(source, options);

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

function loadEmbed(source, options = {}) {
  currentSource = source;
  playerStage.innerHTML =
    '<iframe src="' + escapeAttribute(source.embedUrl) +
    '" title="' + escapeAttribute(currentMovie.title) +
    '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" ' +
    'allowfullscreen></iframe>';

  const frame = playerStage.querySelector("iframe");
  frame?.addEventListener("load", () => saveLastSource(currentMovie, source));
  frame?.addEventListener("error", () => showPlaybackFallback("This embedded source failed to load."));
  if (options.userInitiated && options.fullscreen) {
    requestPlayerFullscreen();
  }
}

function formatPlayerTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours ? hours + ":" + String(minutes).padStart(2, "0") + ":" + secs : minutes + ":" + secs;
}

function buildVideoControls(video) {
  const controls = document.createElement("div");
  controls.className = "cican-video-controls";
  controls.innerHTML =
    '<button type="button" class="cican-center-play" aria-label="Play movie">▶</button>' +
    '<div class="cican-control-bar">' +
      '<button type="button" class="cican-control-play" aria-label="Play movie">▶</button>' +
      '<input class="cican-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Movie timeline">' +
      '<span class="cican-time">0:00 / 0:00</span>' +
      '<button type="button" class="cican-control-fullscreen" aria-label="Enter fullscreen">⛶</button>' +
    '</div>';

  const centerPlay = controls.querySelector(".cican-center-play");
  const play = controls.querySelector(".cican-control-play");
  const seek = controls.querySelector(".cican-seek");
  const time = controls.querySelector(".cican-time");
  const fullscreen = controls.querySelector(".cican-control-fullscreen");

  const sync = () => {
    const duration = Number(video.duration);
    const current = Number(video.currentTime) || 0;
    const hasDuration = Number.isFinite(duration) && duration > 0;
    seek.value = hasDuration ? String(Math.round((current / duration) * 1000)) : "0";
    time.textContent = formatPlayerTime(current) + " / " + formatPlayerTime(duration);
    const paused = video.paused || video.ended;
    play.textContent = paused ? "▶" : "❚❚";
    play.setAttribute("aria-label", paused ? "Play movie" : "Pause movie");
    centerPlay.textContent = paused ? "▶" : "❚❚";
    centerPlay.classList.toggle("visible", paused);
    fullscreen.textContent = isFullscreenActive() ? "×" : "⛶";
    fullscreen.setAttribute("aria-label", isFullscreenActive() ? "Exit fullscreen" : "Enter fullscreen");
  };

  const togglePlay = async () => {
    try {
      if (video.paused || video.ended) {
        if (video.ended) video.currentTime = 0;
        await video.play();
      } else {
        video.pause();
      }
    } catch {}
    sync();
  };

  centerPlay.addEventListener("click", togglePlay);
  play.addEventListener("click", togglePlay);

  seek.addEventListener("input", () => {
    const duration = Number(video.duration);
    if (Number.isFinite(duration) && duration > 0) {
      video.currentTime = (Number(seek.value) / 1000) * duration;
      sync();
    }
  });

  fullscreen.addEventListener("click", async () => {
    if (isFullscreenActive()) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch {}
    } else {
      await requestPlayerFullscreen();
    }
    sync();
  });

  video.addEventListener("click", () => {
    if (video.paused || video.ended) togglePlay();
  });

  ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended", "seeking", "seeked"].forEach(event => {
    video.addEventListener(event, sync);
  });

  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);

  sync();
  playerStage.appendChild(controls);
}

async function loadMedia(source, options = {}) {
  currentSource = source;
  playerStage.innerHTML =
    '<video playsinline webkit-playsinline preload="metadata" src="' +
    escapeAttribute(source.mediaUrl) + '">' +
    'Your browser cannot play this media source.' +
    '</video>';

  const video = playerStage.querySelector("video");
  if (!video) {
    showPlaybackFallback("CICAN could not create the video player.");
    return;
  }

  video.addEventListener("loadedmetadata", () => {
    saveLastSource(currentMovie, source);
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      playerStage.style.setProperty("--player-ratio", video.videoWidth + " / " + video.videoHeight);
      fitFullscreenVideo();
    }
  }, { once: true });

  video.addEventListener("error", () => {
    if (currentSource?.id === source.id) {
      showPlaybackFallback("This media source failed to load.", { autoTryNext: true });
    }
  });

  buildVideoControls(video);

  addSubtitleTracks(video, source).catch(() => {
    source.capabilities = { ...(source.capabilities || {}), subtitles: false };
  });

  if (options.userInitiated && options.autoplay) {
    if (options.fullscreen) {
      await requestPlayerFullscreen();
    }
    try {
      await video.play();
    } catch {}
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
      unlockScreenOrientation();
      return;
    }
    if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      unlockScreenOrientation();
      return;
    }
    await requestPlayerFullscreen();
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
installFullscreenListeners();
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

let searchDebounceTimer = null;
let searchRequestId = 0;

input.addEventListener("input", () => {
  const value = input.value.trim();

  document.querySelectorAll(".alphabet-button").forEach(button => {
    button.classList.toggle("active", value.length === 1 && value.toUpperCase() === button.dataset.letter);
  });

  clearTimeout(searchDebounceTimer);

  if (!value) {
    results.innerHTML = "";
    results.hidden = true;
    setSearchStatus("");
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    form.requestSubmit();
  }, 450);
});


function closePlayerView() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
  } catch {}

  const video = playerStage.querySelector("video");
  if (video) {
    try { video.pause(); } catch {}
    try { video.removeAttribute("src"); video.load(); } catch {}
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
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: Math.max(0, resultsScrollY), behavior: "smooth" });
  });
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

  if (!playerView.hidden) closePlayerView();
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  const requestId = ++searchRequestId;

  results.innerHTML =
    '<div class="searching">SEARCHING THE AVAILABLE MOVIE SOURCES…</div>';
  playerView.hidden = true;
  results.hidden = false;
  setSearchStatus(query.length === 1 && /^[a-z]$/i.test(query) ? "Browsing movies starting with " + query.toUpperCase() + "…" : "Searching movies in the CICAN index and enabled source providers…");

  try {
    const movies = await resolveMovies(query, { contentType: MOVIE_CONTENT_TYPE });
    if (requestId !== searchRequestId) return;
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