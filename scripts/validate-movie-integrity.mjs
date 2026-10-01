import { isFeatureMovie } from "../data/schema.js";

const cases = [
  { title: "Nosferatu", durationSeconds: 5519 },
  { title: "The General", durationSeconds: 79 * 60 },
  { title: "Example Documentary", description: "documentary film", durationSeconds: 3600, expected: false },
  { title: "Example Trailer", description: "official trailer", durationSeconds: 120, expected: false },
  { title: "Example Short", description: "short film", durationSeconds: 1800, expected: false },
  { title: "Example Feature", durationSeconds: 35 * 60, expected: false }
];

for (const item of cases) {
  const actual = isFeatureMovie(item);
  const expected = item.expected ?? true;
  if (actual !== expected) {
    throw new Error(`Feature-movie filter failed for "${item.title}": expected ${expected}, got ${actual}`);
  }
}

const archiveMeta = await fetch("https://archive.org/metadata/TheGeneral1926");
if (!archiveMeta.ok) throw new Error("Archive metadata endpoint failed: " + archiveMeta.status);
const archive = await archiveMeta.json();
const archiveFiles = Array.isArray(archive.files) ? archive.files : [];
const archiveVideo = archiveFiles.find(file => /\.(mp4|m4v|webm|ogv)$/i.test(String(file.name || "")));
if (!archiveVideo) throw new Error("Archive test movie has no playable video file");
const archiveUrl = "https://archive.org/download/TheGeneral1926/" + String(archiveVideo.name).split("/").map(encodeURIComponent).join("/");
const archiveHead = await fetch(archiveUrl, { method: "HEAD" });
if (!archiveHead.ok) throw new Error("Archive test movie media failed: " + archiveHead.status);
const archivePoster = await fetch("https://archive.org/services/img/TheGeneral1926", { method: "HEAD" });
if (!archivePoster.ok) throw new Error("Archive movie poster failed: " + archivePoster.status);

const commonsApi = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&titles=File%3ANosferatu%20%281922%29.webm&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata%7Cthumburl&iiurlwidth=400";
const commonsResponse = await fetch(commonsApi);
if (!commonsResponse.ok) throw new Error("Wikimedia API failed: " + commonsResponse.status);
const commons = await commonsResponse.json();
const commonsPage = Object.values(commons.query?.pages || {})[0];
const commonsInfo = commonsPage?.imageinfo?.[0];
if (!commonsInfo?.url || !String(commonsInfo.mime || "").startsWith("video/")) {
  throw new Error("Wikimedia movie test did not return a playable video");
}
const commonsHead = await fetch(commonsInfo.url, { method: "HEAD" });
if (!commonsHead.ok) throw new Error("Wikimedia movie media failed: " + commonsHead.status);
if (!commonsInfo.thumburl) throw new Error("Wikimedia movie poster URL missing");
const commonsPoster = await fetch(commonsInfo.thumburl, { method: "HEAD" });
if (!commonsPoster.ok) throw new Error("Wikimedia movie poster failed: " + commonsPoster.status);

const locResponse = await fetch("https://www.loc.gov/item/90716884/?fo=json", {
  headers: {
    "User-Agent": "CICAN-MOVIES-integrity/1.0 (+https://github.com/CicanGeorgeAlin/cican-movies)",
    "Accept": "application/json"
  }
});
if (!locResponse.ok) throw new Error("Library of Congress movie endpoint failed: " + locResponse.status);
const loc = await locResponse.json();
const locItem = loc.item || loc;
const locTitle = String(locItem.title || "");
if (!/the general/i.test(locTitle)) throw new Error("LOC movie identity check failed");
const locResources = Array.isArray(locItem.resources) ? locItem.resources : [];
const locMedia = locResources.find(resource => {
  const url = String(resource?.url || resource?.file || "");
  const format = String(resource?.format || resource?.mimetype || "").toLowerCase();
  return /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url) || /video\/|mp4|quicktime|webm|ogg/.test(format);
});
if (!locMedia?.url && !locMedia?.file) throw new Error("LOC movie test has no direct playable media resource");
const locMediaUrl = String(locMedia.url || locMedia.file);
const locHead = await fetch(locMediaUrl, { method: "HEAD" });
if (!locHead.ok) throw new Error("LOC movie media failed: " + locHead.status);
if (!locItem.image_url) throw new Error("LOC movie poster URL missing");
const locPoster = await fetch(locItem.image_url, { method: "HEAD" });
if (!locPoster.ok) throw new Error("LOC movie poster failed: " + locPoster.status);

console.log("MOVIE_INTEGRITY_OK");
