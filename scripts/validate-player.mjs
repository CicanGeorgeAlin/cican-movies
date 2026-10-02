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
  [app.includes("cican-movies-source-v1"), "source memory key missing"],
  [!app.includes("cican-movies-playback-v1") && !app.includes("resume-notice") && !app.includes("savePosition("), "playback-position memory must be disabled"],
  [!app.includes("player-center-play"), "duplicate custom play control must be absent"],
  [app.includes("screen.orientation?.lock") && app.includes("screen.orientation?.unlock"), "screen orientation handling missing"],
  [app.includes('document.createElement("track")'), "native HTML5 track element missing"],
  [!app.includes("subtitle-select") && !css.includes(".subtitle-controls"), "custom subtitle overlay must be absent; use native subtitle controls"],
  [app.includes('kind = track.kind || "subtitles"'), "subtitle track kind missing"],
  [app.includes(".vtt") && app.includes(".srt"), "VTT/SRT subtitle discovery guard missing"],
  [app.includes("srtToVtt"), "SRT-to-WebVTT conversion missing"],
  [app.includes("zh-hans") && app.includes("zh-hant"), "BCP-47 subtitle language labels missing"],
  [(app.match(/async function addSubtitleTracks/g) || []).length === 1, "duplicate subtitle loader detected"],
  [css.includes(".player-stage:fullscreen") && css.includes("object-fit:contain"), "fullscreen aspect-ratio preservation missing"],
  [css.includes(".player-stage:fullscreen video{width:auto;height:auto"), "fullscreen video must preserve native dimensions"],
  [css.includes(".player-stage video{width:100%;height:auto"), "normal video must preserve aspect ratio"],
  [app.includes("cican-seek") && app.includes("currentTime"), "interactive movie timeline missing"],
  [css.includes(".cican-video-controls") && css.includes(".cican-seek"), "movie timeline styles missing"],
  [!app.includes("controls playsinline"), "native controls attribute must remain disabled for the custom player"],
  [schema.includes("default: Boolean(track.default)"), "subtitle default metadata missing"],
  [schema.includes("originalLanguage"), "movie original-language metadata missing"]
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error("PLAYER_VALIDATION_FAILED: " + message);
}

console.log("PLAYER_ARCHITECTURE_OK");
