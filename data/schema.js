export const SOURCE_STATUS = Object.freeze({
  READY: "ready",
  REVIEW: "review",
  BLOCKED: "blocked",
  UNAVAILABLE: "unavailable"
});

export const CONTENT_TYPES = Object.freeze({\n  MOVIE: "movie",\n  TV: "tv",\n  DOCUMENTARY: "documentary",\n  EDUCATION: "education",\n  MUSIC: "music",\n  NEWS: "news",\n  SPORTS: "sports",\n  GAMING: "gaming",\n  SHORT: "short",\n  LIVE: "live",\n  LECTURE: "lecture",\n  ARCHIVE: "archive",\n  OTHER: "other"\n});\n\nexport const SOURCE_TYPES = Object.freeze({
  EMBED: "embed",
  MEDIA: "media",
  EXTERNAL: "external"
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
    id: source.id || "",\n    capabilities: {\n      subtitles: Boolean(source.capabilities?.subtitles),\n      chapters: Boolean(source.capabilities?.chapters),\n      pip: Boolean(source.capabilities?.pip),\n      download: Boolean(source.capabilities?.download)\n    },
    provider: source.provider || "unknown",
    name: source.name || source.provider || "Source",
    type: source.type || SOURCE_TYPES.EXTERNAL,
    status: source.status || SOURCE_STATUS.REVIEW,
    embedUrl: source.embedUrl || null,
    mediaUrl: source.mediaUrl || null,
    url: source.url || null,
    rightsNote: source.rightsNote || "",
    lastChecked: source.lastChecked || null
  };
}

export function createMovie(movie = {}) {
  return {
    id: movie.id || "",
    title: movie.title || "Untitled",
    year: movie.year || null,
    description: movie.description || "",
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    searchTerms: Array.isArray(movie.searchTerms) ? movie.searchTerms : [],
    sources: Array.isArray(movie.sources) ? movie.sources.map(createSource) : []
  };
}
