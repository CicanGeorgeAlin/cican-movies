import { createMovie, createSource, RIGHTS_STATUS, SOURCE_STATUS, SOURCE_TYPES } from "../data/schema.js";

const API_URL = "https://www.loc.gov/film-and-videos/";

function buildSearchUrl(query, limit = 20, page = 1) {
  const params = new URLSearchParams({
    q: String(query || "").trim(),
    fo: "json",
    c: String(Math.min(Math.max(limit, 1), 100)),
    sp: String(Math.max(1, page))
  });
  return API_URL + "?" + params.toString();
}

function clean(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function findMediaUrl(item) {
  const candidates = [
    ...(Array.isArray(item.resources) ? item.resources : []),
    ...(Array.isArray(item.media) ? item.media : [])
  ];

  for (const resource of candidates) {
    const url = String(resource?.url || resource?.file || "").trim();
    const format = String(resource?.format || resource?.mimetype || "").toLowerCase();
    if (url && (/\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url) || /video\/|mp4|quicktime|webm|ogg/.test(format))) {
      return url;
    }
  }

  return null;
}

function movieId(pageUrl) {
  return "loc-" + pageUrl.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function toMovie(item) {
  if (!item?.id || !item?.title) return null;

  const title = clean(item.title);
  const pageUrl = String(item.id);
  const date = String(item.date || item.created_published || "");
  const yearMatch = date.match(/\b(18|19|20)\d{2}\b/);
  const mediaUrl = findMediaUrl(item);
  const id = movieId(pageUrl);

  const source = createSource({
    id: "loc-source-" + id,
    provider: "loc.gov",
    name: "Library of Congress",
    type: mediaUrl ? SOURCE_TYPES.MEDIA : SOURCE_TYPES.EXTERNAL,
    status: mediaUrl ? SOURCE_STATUS.READY : SOURCE_STATUS.REVIEW,
    rightsStatus: RIGHTS_STATUS.REVIEW,
    mediaUrl,
    url: pageUrl,
    rightsNote: "Library of Congress source. Check the item's individual Rights & Access information before reuse or redistribution."
  });

  return createMovie({
    id,
    title,
    year: yearMatch ? Number(yearMatch[0]) : null,
    contentType: "movie",
    description: clean(item.description),
    posterUrl: item.image_url || item.thumbnail_url || null,
    searchTerms: [title, clean(item.contributor), clean(item.partof)].filter(Boolean),
    sources: [source]
  });
}

export async function searchLibraryOfCongress(query, { limit = 20 } = {}) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];

  const responses = await Promise.allSettled([
    fetch(buildSearchUrl(trimmed, limit, 1)),
    fetch(buildSearchUrl(trimmed, limit, 2))
  ]);

  const items = [];
  const seen = new Set();

  for (const result of responses) {
    if (result.status !== "fulfilled" || !result.value.ok) continue;
    try {
      const payload = await result.value.json();
      for (const item of Array.isArray(payload.results) ? payload.results : []) {
        if (!item?.id || seen.has(item.id)) continue;
        seen.add(item.id);
        const movie = toMovie(item);
        if (movie) items.push(movie);
      }
    } catch {}
  }

  return items;
}

export async function getLibraryOfCongressMovieById(id) {
  const prefix = "loc-";
  if (!String(id).startsWith(prefix)) return null;
  return null;
}
