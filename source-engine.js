import { catalog } from "./data/catalog.js";
import { CONTENT_TYPES, normaliseMovie } from "./data/schema.js";
import { providers, getProviderStatus } from "./providers/registry.js";

function parseQuery(query = "") {
  const raw = String(query).trim();
  const normalised = normaliseMovie(raw);
  const yearMatch = normalised.match(/\b(18|19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : null;
  const title = normalised
    .replace(/\b(18|19|20)\d{2}\b/g, " ")
    .replace(/\b(watch|movie|film|full|online|free)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { raw, normalised, title, year };
}

function scoreMovie(movie, query) {
  const parsed = parseQuery(query);
  const q = parsed.title;
  const title = normaliseTitle(movie.title);
  if (!q || !title) return 0;

  const tokens = q.split(" ").filter(Boolean);
  const titleTokens = title.split(" ").filter(Boolean);
  const haystack = normaliseMovie([
    movie.title,
    movie.year,
    ...(movie.genres || []),
    ...(movie.searchTerms || [])
  ].join(" "));

  let score = 0;

  if (title === q) score = 100;
  else if (title.startsWith(q)) score = 90;
  else if (title.includes(q)) score = 75;
  else if (tokens.length > 1 && tokens.every(token => titleTokens.includes(token))) score = 70;
  else if (tokens.length > 1 && tokens.every(token => titleTokens.some(item => item.startsWith(token)))) score = 60;
  else if (haystack.includes(q)) score = 45;
  else if (tokens.length && tokens.every(token => haystack.includes(token))) score = 35;

  if (!score) return 0;

  if (parsed.year) {
    const movieYear = Number.parseInt(String(movie.year || "").slice(0, 4), 10);
    const requestedYear = Number.parseInt(parsed.year, 10);

    if (!Number.isFinite(movieYear)) return Math.max(score - 15, 1);
    if (movieYear === requestedYear) score += 25;
    else score -= 45;
  }

  return Math.max(score, 0);
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

function normaliseTitle(title = "") {
  return normaliseMovie(title)
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function movieIdentity(movie) {
  const title = normaliseTitle(movie.title);
  const year = movie.year ? String(movie.year).slice(0, 4) : "";
  return title + "|" + year;
}

function identitySimilarity(a, b) {
  const at = normaliseTitle(a.title);
  const bt = normaliseTitle(b.title);
  if (!at || !bt) return 0;
  if (at === bt && a.year && b.year && String(a.year) !== String(b.year)) return 0;
  if (at === bt) return 1;

  const aTokens = new Set(at.split(" ").filter(Boolean));
  const bTokens = new Set(bt.split(" ").filter(Boolean));
  const intersection = [...aTokens].filter(token => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  const jaccard = union ? intersection / union : 0;

  if (jaccard < 0.75) return 0;
  if (a.year && b.year) {
    const ay = Number.parseInt(String(a.year).slice(0, 4), 10);
    const by = Number.parseInt(String(b.year).slice(0, 4), 10);
    if (Number.isFinite(ay) && Number.isFinite(by) && ay !== by) return 0;
  }
  return jaccard;
}

function mergeMovieInto(existing, movie) {
  const sources = [...(existing.sources || [])];
  for (const source of movie.sources || []) {
    if (!sources.some(item => item.id === source.id)) sources.push(source);
  }

  return {
    ...existing,
    year: existing.year || movie.year || null,
    description: existing.description || movie.description || "",
    genres: existing.genres?.length ? existing.genres : (movie.genres || []),
    searchTerms: [...new Set([
      ...(existing.searchTerms || []),
      ...(movie.searchTerms || [])
    ])],
    sources: rankSources(sources)
  };
}

function mergeMovies(localMovies, remoteMovies, query) {
  const groups = [];

  [...localMovies, ...remoteMovies].forEach(movie => {
    const exactKey = movieIdentity(movie);
    const exact = groups.find(group => movieIdentity(group.movie) === exactKey);

    if (exact) {
      exact.movie = mergeMovieInto(exact.movie, movie);
      return;
    }

    const similar = groups
      .map(group => ({ group, similarity: identitySimilarity(group.movie, movie) }))
      .filter(item => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)[0];

    if (similar) {
      similar.group.movie = mergeMovieInto(similar.group.movie, movie);
    } else {
      groups.push({ movie });
    }
  });

  return groups
    .map(group => ({
      movie: {
        ...group.movie,
        sources: rankSources(group.movie.sources || [])
      },
      score: scoreMovie(group.movie, query)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.movie);
}

export async function resolveMovies(query, { id = null, contentType = CONTENT_TYPES.MOVIE } = {}) {
  const parsedQuery = parseQuery(query);
  const providerQuery = parsedQuery.title || parsedQuery.normalised;
  const allVideo = contentType === "other";
  const localMatches = catalog.filter(movie =>
    id ? movie.id === id :
      (!allVideo && movie.contentType && movie.contentType !== contentType ? false : scoreMovie(movie, query) > 0)
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
      .map(provider => provider.search(providerQuery, { contentType }))
  );

  const remoteMovies = remoteResults.flatMap(result =>
    result.status === "fulfilled"
      ? result.value.filter(movie => allVideo || !movie.contentType || movie.contentType === contentType)
      : []
  );

  const merged = mergeMovies(localMatches, remoteMovies, query);
  return id
    ? merged.filter(movie => movie.id === id)
    : merged;
}

export { getProviderStatus };
