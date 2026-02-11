const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("index.html exposes upgraded controls and settings", () => {
  const indexHtml = read("index.html");

  assert.match(indexHtml, /id="start-game"/);
  assert.match(indexHtml, /id="pause-toggle"/);
  assert.match(indexHtml, /id="restart-game"/);
  assert.match(indexHtml, /id="replay-last"/);
  assert.match(indexHtml, /id="mute-toggle"/);
  assert.match(indexHtml, /id="install-app"/);
  assert.match(indexHtml, /id="update-app"/);
  assert.match(indexHtml, /id="mobile-input-mode"/);
  assert.match(indexHtml, /id="challenge-mode"/);
  assert.match(indexHtml, /id="palette-mode"/);
  assert.match(indexHtml, /class="keybind-btn"/);
  assert.match(indexHtml, /id="virtual-stick"/);
  assert.match(indexHtml, /manifest\.webmanifest/);
});

test("game.js keeps arcade AI, level progression, and phase states", () => {
  const gameJs = read("scripts/game.js");

  assert.match(gameJs, /GHOST_DEFINITIONS/);
  assert.match(gameJs, /GHOST_MODE_SCHEDULE/);
  assert.match(gameJs, /GHOST_MODE_SCHEDULE_BY_LEVEL/);
  assert.match(gameJs, /updateCruiseElroyState/);
  assert.match(gameJs, /getGhostTargetForPersonality/);
  assert.match(gameJs, /function startNextLevel/);
  assert.match(gameJs, /function setPhase/);
  assert.match(gameJs, /GAME_PHASE_READY/);
  assert.match(gameJs, /GAME_PHASE_INTERMISSION/);
  assert.match(gameJs, /GAME_PHASE_CUTSCENE/);
  assert.match(gameJs, /FRUIT_TABLE/);
  assert.match(gameJs, /BONUS_LIFE_STEP/);
  assert.match(gameJs, /attractModeActive/);
  assert.match(gameJs, /startReplayLastRun/);
  assert.match(gameJs, /requestAnimationFrame\(gameLoop\)/);
});

test("game.js retains settings persistence, key rebinding, and gamepad support", () => {
  const gameJs = read("scripts/game.js");

  assert.match(gameJs, /SETTINGS_STORAGE_KEY/);
  assert.match(gameJs, /function bindKey/);
  assert.match(gameJs, /pendingRebindAction/);
  assert.match(gameJs, /navigator\.getGamepads/);
  assert.match(gameJs, /mobileInputMode/);
  assert.match(gameJs, /virtual-stick/);
});

test("ghost.js supports personalities and ghost house states", () => {
  const ghostJs = read("scripts/ghost.js");

  assert.match(ghostJs, /this\.personality/);
  assert.match(ghostJs, /houseState/);
  assert.match(ghostJs, /maybeReleaseFromHouse/);
  assert.match(ghostJs, /getPersonalityTarget/);
  assert.match(ghostJs, /setFrightenedMode/);
  assert.match(ghostJs, /setEatenMode/);
});

test("pwa files exist and include offline cache", () => {
  const manifest = read("manifest.webmanifest");
  const sw = read("service-worker.js");

  assert.match(manifest, /"name"\s*:\s*"PacMan"/);
  assert.match(manifest, /"display"\s*:\s*"standalone"/);
  assert.match(sw, /CACHE_VERSION/);
  assert.match(sw, /STATIC_CACHE_NAME/);
  assert.match(sw, /addEventListener\("install"/);
  assert.match(sw, /addEventListener\("fetch"/);
  assert.match(sw, /SKIP_WAITING/);
});

test("release and quality workflows are present", () => {
  const qualityWorkflow = read(".github/workflows/quality-checks.yml");
  const releaseWorkflow = read(".github/workflows/release.yml");

  assert.match(qualityWorkflow, /Quality Checks/);
  assert.match(qualityWorkflow, /test:e2e/);
  assert.match(releaseWorkflow, /workflow_dispatch/);
  assert.match(releaseWorkflow, /Validate semantic version/);
  assert.match(releaseWorkflow, /Generate changelog/);
  assert.match(releaseWorkflow, /## Features/);
  assert.match(releaseWorkflow, /action-gh-release/);
});
