import { catalog } from "./data/catalog.js";
import { normaliseMovie } from "./data/schema.js";
import { searchArchive } from "./providers/archive-org.js";

const providers = [
  { id: "archive.org", search: searchArchive }
];

function scoreMovie(movie, query) {
  const q = normaliseMovie(query);
  const title = normaliseMovie(movie.title);
  if (!q || !title) return 0;
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;

  const haystack = normaliseMovie([
    movie.title,
    movie.year,
    ...(movie.genres || []),
    ...(movie.searchTerms || [])
  ].join(" "));

  return haystack.includes(q) ? 30 : 0;
}

function mergeMovies(localMovies, remoteMovies, query) {
  const byKey = new Map();

  [...localMovies, ...remoteMovies].forEach(movie => {
    const key = normaliseMovie(movie.title) + "|" + String(movie.year || "");
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, movie);
      return;
    }

    const sources = [...(existing.sources || [])];
    for (const source of movie.sources || []) {
      if (!sources.some(item => item.id === source.id)) sources.push(source);
    }
    existing.sources = sources;
  });

  return [...byKey.values()]
    .map(movie => ({ movie, score: scoreMovie(movie, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.movie);
}

export async function resolveMovies(query, { id = null } = {}) {
  const localMatches = catalog.filter(movie =>
    id ? movie.id === id : scoreMovie(movie, query) > 0
  );

  if (id && localMatches.length) return localMatches;

  const remoteResults = await Promise.allSettled(
    providers.map(provider => provider.search(query))
  );

  const remoteMovies = remoteResults.flatMap(result =>
    result.status === "fulfilled" ? result.value : []
  );

  const merged = mergeMovies(localMatches, remoteMovies, query);
  return id
    ? merged.filter(movie => movie.id === id)
    : merged;
}

export function getProviderStatus() {
  return providers.map(provider => ({ id: provider.id, enabled: true }));
}
