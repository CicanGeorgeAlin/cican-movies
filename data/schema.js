export const SOURCE_STATUS = Object.freeze({
  READY: "ready",
  REVIEW: "review",
  BLOCKED: "blocked",
  UNAVAILABLE: "unavailable"
});

export const CONTENT_TYPES = Object.freeze({
  MOVIE: "movie",
  TV: "tv",
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
  return {
    id: source.id || "",
    provider: source.provider || "unknown",
    name: source.name || source.provider || "Source",
    type: source.type || SOURCE_TYPES.EXTERNAL,
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

export function createMovie(movie = {}) {
  return {
    id: movie.id || "",
    contentType: movie.contentType || CONTENT_TYPES.MOVIE,
    title: movie.title || "Untitled",
    year: movie.year || null,
    description: movie.description || "",
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    searchTerms: Array.isArray(movie.searchTerms) ? movie.searchTerms : [],
    sources: Array.isArray(movie.sources) ? movie.sources.map(createSource) : []
  };
}
