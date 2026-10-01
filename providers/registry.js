import { getArchiveMovieById, searchArchive } from "./archive-org.js";
import { isYouTubeSearchConfigured, searchYouTube } from "./youtube-search.js";

export const providers = Object.freeze([
  {
    id: "archive.org",
    label: "Internet Archive",
    enabled: true,
    search: searchArchive,
    getById: getArchiveMovieById
  },
  {
    id: "youtube",
    label: "YouTube",
    enabled: isYouTubeSearchConfigured(),
    search: searchYouTube
  }
]);

export function getProviderStatus() {
  return providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    enabled: provider.enabled
  }));
}
