import { createMovie, createSource, RIGHTS_STATUS, SOURCE_STATUS, SOURCE_TYPES } from "../data/schema.js";

const SEARCH_URL = "https://archive.org/advancedsearch.php";
const METADATA_URL = "https://archive.org/metadata/";

function buildSearchUrl(query, rows = 12, exactTitle = true, prefix = false) {
  const cleanQuery = query.replace(/"/g, "").trim();
  const titleQuery = prefix
    ? 'title:' + cleanQuery.toLowerCase() + '*'
    : exactTitle
      ? 'title:("' + cleanQuery + '")'
      : 'title:(' + cleanQuery.split(/\s+/).filter(Boolean).join(" AND ") + ')';
  const q = titleQuery + ' AND mediatype:movies';
  const params = new URLSearchParams();
  params.set("q", q);
  params.append("fl[]", "identifier");
  params.append("fl[]", "title");
  params.append("fl[]", "year");
  params.append("fl[]", "description");
  params.append("fl[]", "creator");
  params.set("rows", String(rows));
  params.set("page", "1");
  params.set("output", "json");
  if (prefix) params.set("sort[]", "title asc");
  return SEARCH_URL + "?" + params.toString();
}

function pickPlayableFile(files = []) {
  const candidates = files
    .filter(file => file && file.name)
    .filter(file => {
      const name = String(file.name).toLowerCase();
      const format = String(file.format || "").toLowerCase();
      return /\.(mp4|m4v|webm|ogv)$/.test(name) ||
        /mpeg-4|mpeg4|ogg video|webm/.test(format);
    })
    .filter(file => !String(file.name).toLowerCase().includes("_thumb"));

  candidates.sort((a, b) => {
    const af = String(a.format || a.name).toLowerCase();
    const bf = String(b.format || b.name).toLowerCase();
    return (/mp4|mpeg-4|mpeg4/.test(af) ? 0 : 1) -
           (/mp4|mpeg-4|mpeg4/.test(bf) ? 0 : 1);
  });
  return candidates[0] || null;
}

function mediaUrl(identifier, fileName) {
  return "https://archive.org/download/" +
    encodeURIComponent(identifier) + "/" +
    String(fileName).split("/").map(encodeURIComponent).join("/");
}

async function enrichItem(item) {
  const identifier = item.identifier;
  if (!identifier) return null;

  try {
    const response = await fetch(METADATA_URL + encodeURIComponent(identifier));
    if (!response.ok) throw new Error("metadata " + response.status);

    const metadata = await response.json();
    const file = pickPlayableFile(metadata.files || []);
    const sourcePage = "https://archive.org/details/" + encodeURIComponent(identifier);

    const source = file
      ? createSource({
          id: "archive-" + identifier,
          provider: "archive.org",
          name: "Internet Archive",
          type: SOURCE_TYPES.MEDIA,
          status: SOURCE_STATUS.READY,
          rightsStatus: RIGHTS_STATUS.REVIEW,
          mediaUrl: mediaUrl(identifier, file.name),
          url: sourcePage,
          rightsNote: "Playback is supplied by Internet Archive. Review the item's rights information before treating it as public-domain or otherwise cleared."
        })
      : createSource({
          id: "archive-" + identifier,
          provider: "archive.org",
          name: "Internet Archive",
          type: SOURCE_TYPES.EXTERNAL,
          status: SOURCE_STATUS.REVIEW,
          rightsStatus: RIGHTS_STATUS.REVIEW,
          url: sourcePage,
          rightsNote: "No directly playable media file was detected by the CICAN adapter."
        });

    return createMovie({
      id: "archive-" + identifier,
      title: String(metadata.metadata?.title || item.title || identifier).replace(/\s+/g, " ").trim(),
      year: metadata.metadata?.year || item.year || null,
      description: metadata.metadata?.description || item.description || "",
      posterUrl: "https://archive.org/services/img/" + encodeURIComponent(identifier),
      genres: [],
      searchTerms: [metadata.metadata?.creator || item.creator || "", identifier].filter(Boolean),
      sources: [source]
    });
  } catch {
    return createMovie({
      id: "archive-" + identifier,
      title: String(item.title || identifier).replace(/\s+/g, " ").trim(),
      year: item.year || null,
      genres: [],
      searchTerms: [identifier],
      sources: [createSource({
        id: "archive-" + identifier,
        provider: "archive.org",
        name: "Internet Archive",
        type: SOURCE_TYPES.EXTERNAL,
        status: SOURCE_STATUS.REVIEW,
        rightsStatus: RIGHTS_STATUS.UNKNOWN,
        url: "https://archive.org/details/" + encodeURIComponent(identifier),
        rightsNote: "Metadata lookup failed. Review the source directly."
      })]
    });
  }
}

export async function getArchiveMovieById(id) {
  const prefix = "archive-";
  if (!String(id).startsWith(prefix)) return null;
  const identifier = String(id).slice(prefix.length);
  if (!identifier) return null;
  return enrichItem({ identifier });
}

async function enrichItems(items = [], concurrency = 8) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await enrichItem(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results.filter(Boolean);
}

export async function searchArchive(query, { rows = 16, browseLetter = "" } = {}) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];

  const normalised = trimmed.replace(/\s+/g, " ").trim();
  const letter = String(browseLetter || "").trim().toLowerCase();
  if (/^[a-z]$/.test(letter)) {
    const response = await fetch(buildSearchUrl(letter, Math.max(rows, 100), true, true));
    if (!response.ok) throw new Error("Internet Archive movie browse failed: " + response.status);
    const payload = await response.json();
    const docs = Array.isArray(payload.response?.docs) ? payload.response.docs : [];
    return enrichItems(docs, 8);
  }

  const variants = [
    normalised,
    normalised.replace(/\b(the|a|an)\b/gi, " ").replace(/\s+/g, " ").trim()
  ].filter(Boolean);

  if (/\s/.test(normalised)) {
    variants.push(normalised.split(/\s+/).filter(Boolean).join(" AND "));
  }

  const uniqueVariants = [...new Set(variants)];
  const responses = await Promise.allSettled(
    uniqueVariants.map((variant, index) =>
      fetch(buildSearchUrl(variant, rows, index < 2))
    )
  );

  const docsById = new Map();

  for (const result of responses) {
    if (result.status !== "fulfilled" || !result.value.ok) continue;
    try {
      const payload = await result.value.json();
      const docs = Array.isArray(payload.response?.docs) ? payload.response.docs : [];
      for (const doc of docs) {
        if (doc?.identifier && !docsById.has(doc.identifier)) {
          docsById.set(doc.identifier, doc);
        }
      }
    } catch {}
  }

  const docs = [...docsById.values()].slice(0, Math.max(rows, 16));
  return enrichItems(docs, 8);
}
