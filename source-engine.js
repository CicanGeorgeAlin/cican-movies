import { catalog } from "./data/catalog.js";
import { normaliseMovie } from "./data/schema.js";
import { providers, getProviderStatus } from "./providers/registry.js";

function scoreMovie(movie, query) {
  const q = normaliseMovie(query);
  const title = normaliseMovie(movie.title);
  if (!q || !title) return 0;

  const tokens = q.split(" ").filter(Boolean);
  const titleTokens = title.split(" ").filter(Boolean);
  const haystack = normaliseMovie([
    movie.title,
    movie.year,
    ...(movie.genres || []),
    ...(movie.searchTerms || [])
  ].join(" "));

  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 75;
  if (tokens.length > 1 && tokens.every(token => titleTokens.some(item => item === token))) return 70;
  if (tokens.length > 1 && tokens.every(token => titleTokens.some(item => item.startsWith(token)))) return 60;
  if (haystack.includes(q)) return 45;
  if (tokens.length && tokens.every(token => haystack.includes(token))) return 35;

  return 0;
}

function sourceScore(source) {
  if (!source) return -1000;
  const status = source.status;
  const rightsStatus = source.rightsStatus || "unknown";
  const type = source.type;
  let score = 0;

  if (status === "ready") score += 100;
  else if (status === "review") score += 20;
  else return -1000;

  if (rightsStatus === "verified") score += 30;
  else if (rightsStatus === "review") score += 10;
  else if (rightsStatus === "restricted") score -= 80;

  if (type === "embed") score += 30;
  if (type === "media") score += 20;
  if (type === "external") score += 5;
  if (source.capabilities?.subtitles) score += 3;
  if (source.capabilities?.chapters) score += 2;

  return score;
}

function rankSources(sources = []) {
  return [...sources].sort((a, b) => sourceScore(b) - sourceScore(a));
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
    existing.sources = rankSources(sources);
  });

  return [...byKey.values()]
    .map(movie => ({
      movie: { ...movie, sources: rankSources(movie.sources || []) },
      score: scoreMovie(movie, query)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.movie);
}

export async function resolveMovies(query, { id = null } = {}) {
  const localMatches = catalog.filter(movie =>
    id ? movie.id === id : scoreMovie(movie, query) > 0
  );

  if (id && localMatches.length) return localMatches;

  if (id) {
    const directResults = await Promise.allSettled(
      providers.filter(provider => provider.enabled).map(provider => provider.getById?.(id))
    );
    const directMovies = directResults.flatMap(result =>
      result.status === "fulfilled" && result.value ? [result.value] : []
    );
    if (directMovies.length) return directMovies;
  }

  const remoteResults = await Promise.allSettled(
    providers
      .filter(provider => provider.enabled)
      .map(provider => provider.search(query))
  );

  const remoteMovies = remoteResults.flatMap(result =>
    result.status === "fulfilled" ? result.value : []
  );

  const merged = mergeMovies(localMatches, remoteMovies, query);
  return id
    ? merged.filter(movie => movie.id === id)
    : merged;
}

export { getProviderStatus };
