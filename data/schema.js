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
    }
  };
}

export function isFeatureMovie(movie = {}) {
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

  const duration = Number(movie.durationSeconds);
  if (Number.isFinite(duration) && duration > 0 && duration < 40 * 60) return false;

  return true;
}

export function createMovie(movie = {}) {
  return {
    id: movie.id || "",
    contentType: movie.contentType || CONTENT_TYPES.MOVIE,
    title: movie.title || "Untitled",
    year: movie.year || null,
    description: movie.description || "",
    posterUrl: movie.posterUrl || "",
    durationSeconds: Number(movie.durationSeconds) || 0,
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    searchTerms: Array.isArray(movie.searchTerms) ? movie.searchTerms : [],
    sources: Array.isArray(movie.sources) ? movie.sources.map(createSource) : []
  };
}
