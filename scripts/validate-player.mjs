import fs from "node:fs";

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles.css", "utf8");
const schema = fs.readFileSync("data/schema.js", "utf8");

const checks = [
  [app.includes("playerStage.requestFullscreen"), "player fullscreen must target the stage"],
  [!app.includes("requestPlayerFullscreen(video)"), "player fullscreen must not target the video element"],
  [app.includes("fullscreenchange"), "fullscreen state listener missing"],
  [app.includes("webkitfullscreenchange"), "WebKit fullscreen listener missing"],
  [app.includes("popstate"), "browser back-state handler missing"],
  [app.includes("cican-movies-playback-v1"), "playback memory key missing"],
  [app.includes("cican-movies-source-v1"), "source memory key missing"],
  [app.includes("<track"), "native HTML5 track element missing"],
  [app.includes("subtitle-select"), "subtitle language selector missing"],
  [app.includes('kind = track.kind || "subtitles"'), "subtitle track kind missing"],
  [app.includes(".vtt"), "VTT-only subtitle guard missing"],
  [css.includes(".player-stage:fullscreen") && css.includes("object-fit:contain"), "fullscreen aspect-ratio preservation missing"],
  [schema.includes("default: Boolean(track.default)"), "subtitle default metadata missing"],
  [schema.includes("originalLanguage"), "movie original-language metadata missing"]
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error("PLAYER_VALIDATION_FAILED: " + message);
}

console.log("PLAYER_ARCHITECTURE_OK");
