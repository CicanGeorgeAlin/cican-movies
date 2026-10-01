import { createMovie, createSource, RIGHTS_STATUS, SOURCE_STATUS, SOURCE_TYPES } from "../data/schema.js";

const API_URL = "https://commons.wikimedia.org/w/api.php";

function buildSearchUrl(query, limit = 12, offset = 0) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: String(query || "").trim(),
    gsrnamespace: "6",
    gsrlimit: String(Math.min(Math.max(limit, 1), 50)),
    gsrqiprofile: "classic",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    gsroffset: String(Math.max(0, offset))
  });
  return API_URL + "?" + params.toString();
}

function isVideo(info) {
  const mime = String(info?.mime || "").toLowerCase();
  const url = String(info?.url || "").toLowerCase();
  return mime.startsWith("video/") || /\.(mp4|webm|ogv|m4v)(\?|$)/.test(url);
}

function licenseNote(metadata = {}) {
  const license = metadata.LicenseShortName?.value || metadata.License?.value || "";
  return license
    ? "Wikimedia Commons license metadata: " + String(license).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : "Review the Wikimedia Commons file page and license metadata before treating the work as cleared for reuse.";
}

function toMovie(page) {
  const info = page.imageinfo?.[0];
  if (!info || !isVideo(info)) return null;

  const title = String(page.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").trim();
  const pageUrl = "https://commons.wikimedia.org/wiki/" + encodeURIComponent(String(page.title || "").replace(/ /g, "_"));
  const source = createSource({
    id: "wikimedia-" + String(page.pageid),
    provider: "wikimedia-commons",
    name: "Wikimedia Commons",
    type: SOURCE_TYPES.MEDIA,
    status: SOURCE_STATUS.REVIEW,
    rightsStatus: RIGHTS_STATUS.REVIEW,
    mediaUrl: info.url || null,
    url: pageUrl,
    rightsNote: licenseNote(info.extmetadata || {}),
    capabilities: { download: true }
  });

  return createMovie({
    id: "wikimedia-" + String(page.pageid),
    title: title || "Wikimedia Commons video",
    contentType: "movie",
    description: info.extmetadata?.ImageDescription?.value || "",
    searchTerms: [String(page.title || ""), "Wikimedia Commons"],
    sources: [source]
  });
}

async function searchPage(query, limit, offset) {
  const response = await fetch(buildSearchUrl(query, limit, offset));
  if (!response.ok) throw new Error("Wikimedia Commons search failed: " + response.status);
  return response.json();
}

export async function searchWikimediaCommons(query, { limit = 12, browseLetter = "" } = {}) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];

  const letter = String(browseLetter || "").trim().toLowerCase();
  const pages = /^[a-z]$/.test(letter) ? [0, 50, 100, 150, 200] : [0, 50];
  const searchQuery = /^[a-z]$/.test(letter) ? letter + " filetype:video" : trimmed;

  const responses = await Promise.allSettled(
    pages.map(offset => searchPage(searchQuery, /^[a-z]$/.test(letter) ? 50 : limit, offset))
  );

  const movies = [];
  const seen = new Set();

  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    for (const page of Object.values(result.value?.query?.pages || {})) {
      if (!page?.pageid || seen.has(page.pageid)) continue;
      const movie = toMovie(page);
      if (!movie) continue;
      if (letter && !movie.title.toLowerCase().startsWith(letter)) continue;
      seen.add(page.pageid);
      movies.push(movie);
    }
  }

  return movies;
}

export async function getWikimediaCommonsMovieById(id) {
  const prefix = "wikimedia-";
  if (!String(id).startsWith(prefix)) return null;
  const pageid = String(id).slice(prefix.length);
  if (!/^\d+$/.test(pageid)) return null;

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    pageids: pageid,
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata"
  });

  const response = await fetch(API_URL + "?" + params.toString());
  if (!response.ok) throw new Error("Wikimedia Commons item lookup failed: " + response.status);

  const payload = await response.json();
  const page = Object.values(payload.query?.pages || {})[0];
  return page ? toMovie(page) : null;
}
