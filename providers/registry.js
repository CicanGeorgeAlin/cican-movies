import { getArchiveMovieById, searchArchive } from "./archive-org.js";
import { getYouTubeMovieById, isYouTubeSearchConfigured, searchYouTube } from "./youtube-search.js";
import { getWikimediaCommonsMovieById, searchWikimediaCommons } from "./wikimedia-commons.js";

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
    search: searchYouTube,
    getById: getYouTubeMovieById
  },
  {
    id: "wikimedia-commons",
    label: "Wikimedia Commons",
    enabled: true,
    search: searchWikimediaCommons,
    getById: getWikimediaCommonsMovieById
  }
]);

export function getProviderStatus() {
  return providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    enabled: provider.enabled
  }));
}
