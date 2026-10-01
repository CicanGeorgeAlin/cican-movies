import { getArchiveMovieById, searchArchive } from "./archive-org.js";

export const providers = Object.freeze([
  {
    id: "archive.org",
    label: "Internet Archive",
    enabled: true,
    search: searchArchive,
    getById: getArchiveMovieById
  }
]);

export function getProviderStatus() {
  return providers.map(provider => ({
    id: provider.id,
    label: provider.label,
    enabled: provider.enabled
  }));
}
