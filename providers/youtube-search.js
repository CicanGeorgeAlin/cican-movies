import { CONTENT_TYPES, createMovie } from "../data/schema.js";
import { youtubeSource } from "./youtube.js";

const API_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEO_API_URL = "https://www.googleapis.com/youtube/v3/videos";

function getApiKey() {
  return String(globalThis.CICAN_CONFIG?.youtubeApiKey || "").trim();
}

export function isYouTubeSearchConfigured() {
  return Boolean(getApiKey());
}

export async function getYouTubeMovieById(id) {
  if (!isYouTubeSearchConfigured()) return null;

  const videoId = String(id || "").replace(/^youtube-/, "");
  if (!videoId) return null;

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoId,
    key: globalThis.CICAN_CONFIG.youtubeApiKey
  });

  const response = await fetch(VIDEO_API_URL + "?" + params.toString());
  if (!response.ok) throw new Error("YouTube video lookup failed");

  const data = await response.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    id: "youtube-" + item.id,
    title: item.snippet?.title || "YouTube video",
    year: Number(String(item.snippet?.publishedAt || "").slice(0, 4)) || null,
    description: item.snippet?.description || "",
    posterUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
    genres: ["Movie"],
    searchTerms: [item.snippet?.title || ""],
    sources: [youtubeSource(item.id, "YouTube")]
  };
}

export async function searchYouTube(query, { maxResults = 8, regionCode = "IE", contentType = CONTENT_TYPES.MOVIE } = {}) {
  const apiKey = getApiKey();
  const trimmed = String(query || "").trim();
  if (!apiKey || !trimmed) return [];

  const categoryHints = {
    movie: "feature film movie full movie",
    tv: "tv series episode",
    documentary: "documentary",
    podcast: "podcast",
    music: "music",
    education: "education lecture",
    news: "news",
    sports: "sports",
    gaming: "gaming",
    archive: "archive historical",
    other: "video"
  };
  const searchQuery = [trimmed, categoryHints[contentType] || ""].filter(Boolean).join(" ");

  const params = new URLSearchParams({
    part: "snippet",
    q: searchQuery,
    type: "video",
    videoDuration: contentType === CONTENT_TYPES.MOVIE ? "long" : "any",
    maxResults: String(Math.min(Math.max(maxResults, 1), 50)),
    regionCode,
    key: apiKey
  });

  const response = await fetch(API_URL + "?" + params.toString());
  if (!response.ok) throw new Error("YouTube search failed: " + response.status);

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  return items
    .filter(item => item.id?.videoId && item.snippet?.title)
    .map(item => {
      const videoId = item.id.videoId;
      return createMovie({
        id: "youtube-" + videoId,
        contentType,
        title: item.snippet.title,
        description: item.snippet.description || "",
        posterUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
        searchTerms: [
          item.snippet.channelTitle || "",
          ...(Array.isArray(item.snippet.tags) ? item.snippet.tags : [])
        ].filter(Boolean),
        sources: [
          youtubeSource(videoId, "YouTube")
        ].filter(Boolean)
      });
    });
}
