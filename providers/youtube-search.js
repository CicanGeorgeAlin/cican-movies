import { createMovie } from "../data/schema.js";
import { youtubeSource } from "./youtube.js";

const API_URL = "https://www.googleapis.com/youtube/v3/search";

function getApiKey() {
  return String(globalThis.CICAN_CONFIG?.youtubeApiKey || "").trim();
}

export function isYouTubeSearchConfigured() {
  return Boolean(getApiKey());
}

export async function searchYouTube(query, { maxResults = 8, regionCode = "IE" } = {}) {
  const apiKey = getApiKey();
  const trimmed = String(query || "").trim();
  if (!apiKey || !trimmed) return [];

  const params = new URLSearchParams({
    part: "snippet",
    q: trimmed,
    type: "video",
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
        title: item.snippet.title,
        description: item.snippet.description || "",
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
