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
  uk: "Ukrainian", vi: "Vietnamese", zh: "Chinese"
};

function languageLabel(code) {
  const key = String(code || "").toLowerCase().split("-")[0];
  return LANGUAGE_NAMES[key] || String(code || "").toUpperCase();
}

function subtitleTracksForSource(source) {
  return Array.isArray(source?.subtitles) ? source.subtitles.filter(track =>
    track?.src && track?.srclang
  ) : [];
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
        const languageMatch = suffix.match(/^([a-z]{2,3}(?:-[A-Z]{2})?)\.(?:vtt|srt)$/i);
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

async function addSubtitleTracks(video, source) {
  const supplied = subtitleTracksForSource(source);
  const discovered = await discoverWikimediaSubtitles(source);
  const tracks = [...supplied, ...discovered].filter((track, index, all) =>
    track?.src && track?.srclang &&
    all.findIndex(item => item.src === track.src || item.srclang === track.srclang) === index
  );

  tracks.forEach((track, index) => {
    const element = document.createElement("track");
    element.kind = track.kind || "subtitles";
    element.label = track.label || languageLabel(track.srclang);
    element.srclang = track.srclang;
    element.src = track.src;
    element.default = index === 0 && track.srclang.startsWith("en");
    video.appendChild(element);
  });

  if (tracks.length) {
    source.capabilities = { ...(source.capabilities || {}), subtitles: true };
  }
  return tracks.length;
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
