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
// LOC records do not consistently expose a direct media file. The adapter
// treats those records as REVIEW/EXTERNAL until an item-level playable resource
// is actually present, so validate identity and artwork here without inventing
// playback capability.
if (!locItem.image_url) throw new Error("LOC movie poster URL missing");


// Runtime smoke test: importing the resolver must succeed, because the UI
// depends on this module before it can wire A–Z buttons and search input.
const { catalog } = await import("../data/catalog.js");
await import("../source-engine.js");
const playableCatalog = catalog.filter(movie =>
  movie.posterUrl &&
  Number(movie.durationSeconds) >= 40 * 60 &&
  Array.isArray(movie.sources) &&
  movie.sources.some(source =>
    source &&
    source.status !== "blocked" &&
    source.status !== "unavailable" &&
    (source.embedUrl || source.mediaUrl)
  )
);
const letterA = playableCatalog.filter(movie => String(movie.title || "").trim().toLowerCase().startsWith("a"));
const letterT = playableCatalog.filter(movie => String(movie.title || "").trim().toLowerCase().startsWith("t"));
if (!letterA.length || !letterT.length) {
  throw new Error("A-Z runtime smoke test failed: expected playable A and T titles");
}

const internationalTitles = [
  ["Le Chevalier de Maison-Rouge", "fr"],
  ["Die keusche Susanne", "de"],
  ["Wrzos", "pl"],
  ["Ludzie bez jutra", "pl"],
  ["Kísértetek vonata", "hu"],
  ["Cabiria", "it"],
  ["Battleship Potemkin", "ru"],
  ["Queen Kelly", "en"],
  ["Aelita: Queen of Mars", "ru"],
  ["Hårda viljor", "sv"],
  ["Gustaf Wasa", "sv"],
  ["Lahore", "hi"],
  ["Marthanda Varma", "ml"]
];

for (const [title, language] of internationalTitles) {
  const movie = catalog.find(item => item.title === title);
  if (!movie) throw new Error("International catalog movie missing: " + title);
  if (movie.originalLanguage !== language) throw new Error("International language metadata missing for: " + title);
  if (!movie.posterUrl || Number(movie.durationSeconds) < 40 * 60) {
    throw new Error("International feature metadata invalid for: " + title);
  }
  const media = movie.sources.find(source => source.mediaUrl && source.status !== "blocked" && source.status !== "unavailable");
  if (!media) throw new Error("International playable source missing for: " + title);
}

const documentary = catalog.find(item => (item.genres || []).some(genre => String(genre).toLowerCase() === "documentary"));
if (documentary && isFeatureMovie(documentary)) {
  throw new Error("Documentary genre must not pass feature-movie filter: " + documentary.title);
}

console.log("MOVIE_INTEGRITY_OK");
