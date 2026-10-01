import { createSource, RIGHTS_STATUS, SOURCE_STATUS, SOURCE_TYPES } from "../data/schema.js";

export function youtubeSource(videoId, name = "YouTube") {
  if (!videoId) return null;
  return createSource({
    id: "youtube-" + videoId,
    provider: "youtube",
    name,
    type: SOURCE_TYPES.EMBED,
    status: SOURCE_STATUS.READY,
    rightsStatus: RIGHTS_STATUS.REVIEW,
    embedUrl: "https://www.youtube.com/embed/" + encodeURIComponent(videoId) + "?playsinline=1&rel=0",
    url: "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId),
    rightsNote: "Uses the official YouTube embedded player. Availability and embedding permissions remain controlled by YouTube and the uploader."
  });
}

export function extractYouTubeId(value = "") {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null;
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
    }
  } catch {
    return null;
  }
  return null;
}
