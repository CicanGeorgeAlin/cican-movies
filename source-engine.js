import { catalog } from "./data/catalog.js?v=az-final3-20261002";
import { CONTENT_TYPES, isFeatureMovie, normaliseMovie } from "./data/schema.js?v=az-landing-fix-20261002";
import { providers, getProviderStatus } from "./providers/registry.js?v=az-landing-fix-20261002";

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
    posterUrl: existing.posterUrl || movie.posterUrl || "",
    durationSeconds: existing.durationSeconds || movie.durationSeconds || 0,
    genres: existing.genres?.length ? existing.genres : (movie.genres || []),
    searchTerms: [...new Set([
      ...(existing.searchTerms || []),
      ...(movie.searchTerms || [])
    ])],
    sources: rankSources(sources)
  };
}

function mergeMovies(localMovies, remoteMovies, query, browseLetter = "") {
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
      score: browseLetter
        ? (String(group.movie.title || "").trim().toLowerCase().startsWith(browseLetter) ? 100 : 0)
        : scoreMovie(group.movie, query)
    }))
    .filter(item =>
      item.score > 0 &&
      isFeatureMovie(item.movie) &&
      Boolean(item.movie.posterUrl) &&
      Number(item.movie.durationSeconds) >= 40 * 60 &&
      Array.isArray(item.movie.sources) &&
      item.movie.sources.some(source =>
        source &&
        source.status !== "blocked" &&
        source.status !== "unavailable" &&
        (source.embedUrl || source.mediaUrl)
      )
    )
    .sort((a, b) => b.score - a.score)
    .map(item => item.movie);
}

export async function resolveMovies(query, { id = null, contentType = CONTENT_TYPES.MOVIE, country = "", language = "" } = {}) {
  const normaliseFilter = value => normaliseMovie(String(value || ""));
  const countryFilter = normaliseFilter(country);
  const languageFilter = normaliseFilter(language);
  const matchesBrowseFilters = movie => {
    if (countryFilter) {
      const countries = [
        movie.country,
        ...(Array.isArray(movie.countries) ? movie.countries : [])
      ].filter(Boolean).map(normaliseFilter);
      if (!countries.includes(countryFilter)) return false;
    }
    if (languageFilter) {
      const languages = [
        movie.originalLanguage,
        movie.language,
        ...(Array.isArray(movie.languages) ? movie.languages : [])
      ].filter(Boolean).map(normaliseFilter);
      if (!languages.includes(languageFilter)) return false;
    }
    return true;
  };
  const parsedQuery = parseQuery(query);
  const providerQuery = parsedQuery.title || parsedQuery.normalised;
  const allVideo = contentType === "other";
  const browseLetter = /^[a-z]$/i.test(parsedQuery.normalised)
    ? parsedQuery.normalised.toLowerCase()
    : "";

  const localMatches = catalog.filter(movie => {
    if (id) return movie.id === id;
    if (!allVideo && movie.contentType && movie.contentType !== contentType) return false;

    // A–Z browsing is an explicit title-prefix operation. Do not route it
    // through general search scoring; that can discard valid local titles
    // such as "The ..." before mergeMovies gets a chance to sort them.
    if (browseLetter) {
      return normaliseMovie(movie.title).startsWith(browseLetter);
    }

    return scoreMovie(movie, query) > 0;
  });

  if (id && localMatches.some(movie => (movie.sources || []).some(source => source?.embedUrl || source?.mediaUrl))) {
    const playableLocal = localMatches.filter(movie => movie.posterUrl && isFeatureMovie(movie));
    if (playableLocal.length) return playableLocal;
  }

  // A–Z is navigation, not a provider search. Render the verified local catalog
  // immediately instead of waiting for every remote provider to scan an entire letter.
  // This prevents mobile browsers from being overwhelmed by hundreds of remote metadata
  // requests and ensures pressing a letter repeatedly always produces deterministic results.
  if (browseLetter) {
    return mergeMovies(localMatches, [], query, browseLetter)
      .filter(movie => normaliseMovie(movie.title).startsWith(browseLetter))
      .sort((a, b) => normaliseTitle(a.title).localeCompare(normaliseTitle(b.title)));
  }

  if (countryFilter || languageFilter) {
    return localMatches
      .sort((a, b) => normaliseTitle(a.title).localeCompare(normaliseTitle(b.title)));
  }

  if (id) {
    const directResults = await Promise.allSettled(
      providers.filter(provider => provider.enabled).map(provider => provider.getById?.(id))
    );
    const directMovies = directResults.flatMap(result =>
      result.status === "fulfilled" && result.value ? [result.value] : []
    ).filter(movie =>
      isFeatureMovie(movie) &&
      Number(movie.durationSeconds) >= 40 * 60 &&
      Boolean(movie.posterUrl) &&
      Array.isArray(movie.sources) &&
      movie.sources.some(source =>
        source &&
        source.status !== "blocked" &&
        source.status !== "unavailable" &&
        (source.embedUrl || source.mediaUrl)
      )
    );
    if (directMovies.length) return directMovies;
  }

  const movieQueries = contentType === CONTENT_TYPES.MOVIE
    ? browseLetter
      ? [browseLetter]
      : [...new Set([
          providerQuery,
          parsedQuery.raw,
          parsedQuery.title.replace(/\s+/g, " ").trim()
        ].filter(Boolean))]
    : [providerQuery];

  const remoteResults = await Promise.allSettled(
    providers
      .filter(provider => provider.enabled)
      .flatMap(provider =>
        movieQueries.map(searchQuery =>
          provider.search(searchQuery, { contentType, browseLetter })
        )
      )
  );

  const remoteMovies = remoteResults.flatMap(result =>
    result.status === "fulfilled"
      ? result.value.filter(movie => allVideo || !movie.contentType || movie.contentType === contentType)
      : []
  );

  // Always retain local catalog matches. Remote providers are merged into them
  // so additional sources enrich a known movie instead of replacing its
  // working/playable source.
  const seedMatches = localMatches.map(movie => ({
    ...movie,
    sources: movie.sources || []
  }));

  const merged = mergeMovies(seedMatches, remoteMovies, query, browseLetter);

  if (browseLetter) {
    const letterMovies = merged
      .filter(movie => normaliseMovie(movie.title).startsWith(browseLetter))
      .sort((a, b) => normaliseTitle(a.title).localeCompare(normaliseTitle(b.title)));
    return letterMovies;
  }

  return id
    ? merged.filter(movie => movie.id === id)
    : merged;
}

export { getProviderStatus };
