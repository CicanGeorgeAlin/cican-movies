export const SOURCE_STATUS = Object.freeze({
  READY: "ready",
  REVIEW: "review",
  BLOCKED: "blocked",
  UNAVAILABLE: "unavailable"
});

export const CONTENT_TYPES = Object.freeze({
  MOVIE: "movie",
  TV: "tv",
  PODCAST: "podcast",
  DOCUMENTARY: "documentary",
  EDUCATION: "education",
  MUSIC: "music",
  NEWS: "news",
  SPORTS: "sports",
  GAMING: "gaming",
  SHORT: "short",
  LIVE: "live",
  LECTURE: "lecture",
  ARCHIVE: "archive",
  OTHER: "other"
});

export const SOURCE_TYPES = Object.freeze({
  EMBED: "embed",
  MEDIA: "media",
  EXTERNAL: "external"
});

export const RIGHTS_STATUS = Object.freeze({
  VERIFIED: "verified",
  REVIEW: "review",
  UNKNOWN: "unknown",
  RESTRICTED: "restricted"
});

export function normaliseMovie(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createSource(source = {}) {
  const provider = source.provider || "unknown";
  const type = source.type || SOURCE_TYPES.EXTERNAL;
  const reference = source.embedUrl || source.mediaUrl || source.url || source.name || "source";
  const identity = Array.from(String(reference)).map(char => char.codePointAt(0).toString(16)).join("");
  return {
    id: source.id || provider + "-" + type + "-" + identity,
    provider,
    name: source.name || source.provider || "Source",
    type,
    status: source.status || SOURCE_STATUS.REVIEW,
    embedUrl: source.embedUrl || null,
    mediaUrl: source.mediaUrl || null,
    url: source.url || null,
    rightsStatus: source.rightsStatus || RIGHTS_STATUS.UNKNOWN,
    rightsNote: source.rightsNote || "",
    lastChecked: source.lastChecked || null,
    capabilities: {
      subtitles: Boolean(source.capabilities?.subtitles),
      chapters: Boolean(source.capabilities?.chapters),
      pip: Boolean(source.capabilities?.pip),
      download: Boolean(source.capabilities?.download)
    },
    subtitles: Array.isArray(source.subtitles)
      ? source.subtitles
          .filter(track => track && track.src && track.srclang)
          .map(track => ({
            src: String(track.src),
            srclang: String(track.srclang).toLowerCase(),
            label: String(track.label || track.srclang).trim(),
            kind: String(track.kind || "subtitles"),
            default: Boolean(track.default)
          }))
      : []
  };
}

export function parseDurationSeconds(value = 0) {
  if (Number.isFinite(Number(value)) && Number(value) > 0) return Number(value);
  const text = String(value || "").toLowerCase().trim();
  if (!text) return 0;

  const clock = text.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (clock) {
    if (clock[3] !== undefined) {
      return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
    }
    return Number(clock[1]) * 60 + Number(clock[2]);
  }

  const hours = Number(text.match(/(\d+(?:\.\d+)?)\s*h(?:ours?|r)?/)?.[1] || 0);
  const minutes = Number(text.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?/)?.[1] || 0);
  const seconds = Number(text.match(/(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?/)?.[1] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : 0;
}

export function isFeatureMovie(movie = {}) {
  const genres = Array.isArray(movie.genres) ? movie.genres.map(item => String(item).toLowerCase()) : [];
  if (genres.some(genre => genre === "documentary" || genre === "documentaries")) return false;

  const text = String([
    movie.title || "",
    movie.description || "",
    ...(movie.searchTerms || [])
  ].join(" ")).toLowerCase();

  const excluded = [
    /\bdocumentar(y|ies)?\b/,
    /\bshort film\b/,
    /\bshort movie\b/,
    /\btrailer\b/,
    /\bteaser\b/,
    /\bclip\b/,
    /\bexcerpt\b/,
    /\bscene from\b/,
    /\bepisode\b/,
    /\bseries\b/,
    /\binterview\b/,
    /\blecture\b/,
    /\bnewsreel\b/,
    /\bnews\s+film\b/,
    /\bpromotional\b/,
    /\bbehind the scenes\b/,
    /\bmusic video\b/,
    /\bconcert film\b/,
    /\bcommercial\b/,
    /\badvertisement\b/
  ];

  if (excluded.some(pattern => pattern.test(text))) return false;

  const duration = parseDurationSeconds(movie.durationSeconds);
  if (Number.isFinite(duration) && duration > 0 && duration < 40 * 60) return false;

  return true;
}

export function createMovie(movie = {}) {
  return {
    id: movie.id || "",
    contentType: movie.contentType || CONTENT_TYPES.MOVIE,
    title: movie.title || "Untitled",
    language: movie.language || movie.originalLanguage || null,
    originalLanguage: movie.originalLanguage || movie.language || null,
    languages: Array.isArray(movie.languages) ? movie.languages : (movie.originalLanguage ? [movie.originalLanguage] : []),
    year: movie.year || null,
    description: movie.description || "",
    posterUrl: movie.posterUrl || "",
    durationSeconds: parseDurationSeconds(movie.durationSeconds),
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    searchTerms: Array.isArray(movie.searchTerms) ? movie.searchTerms : [],
    sources: Array.isArray(movie.sources) ? movie.sources.map(createSource) : []
  };
}
