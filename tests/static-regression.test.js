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
  assert.match(indexHtml, /id="daily-challenge"/);
  assert.match(indexHtml, /id="mute-toggle"/);
  assert.match(indexHtml, /id="install-app"/);
  assert.match(indexHtml, /id="update-app"/);
  assert.match(indexHtml, /id="mobile-input-mode"/);
  assert.match(indexHtml, /id="challenge-mode"/);
  assert.match(indexHtml, /id="palette-mode"/);
  assert.match(indexHtml, /id="run-seed-input"/);
  assert.match(indexHtml, /id="sim-debug-enabled"/);
  assert.match(indexHtml, /id="ghost-debug-overlay"/);
  assert.match(indexHtml, /id="replay-export"/);
  assert.match(indexHtml, /id="settings-export"/);
  assert.match(indexHtml, /id="settings-import"/);
  assert.match(indexHtml, /id="settings-transfer-status"/);
  assert.match(indexHtml, /id="a11y-live-region"/);
  assert.match(indexHtml, /id="leaderboard-output"/);
  assert.match(indexHtml, /class="keybind-btn"/);
  assert.match(indexHtml, /id="virtual-stick"/);
  assert.match(indexHtml, /manifest\.webmanifest/);
  assert.match(indexHtml, /scripts\/game-storage\.js/);
  assert.match(indexHtml, /scripts\/replay-tools\.js/);
  assert.match(indexHtml, /scripts\/perf-guardrails\.js/);
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
  assert.match(gameJs, /computeDailySeed/);
  assert.match(gameJs, /finalizeRunResult/);
  assert.match(gameJs, /activeRunIsReplay/);
  assert.match(gameJs, /setSimulationPaused/);
  assert.match(gameJs, /createReplayCodec/);
  assert.match(gameJs, /createFramePacingMonitor/);
  assert.match(gameJs, /function applyChallengeModeSetting/);
  assert.match(gameJs, /skipFinalizeResult:\s*true/);
  assert.match(gameJs, /Mode applied:/);
  assert.match(gameJs, /requestAnimationFrame\(gameLoop\)/);
});

test("game.js retains settings persistence, key rebinding, and gamepad support", () => {
  const gameJs = read("scripts/game.js");

  assert.match(gameJs, /SETTINGS_STORAGE_KEY/);
  assert.match(gameJs, /function bindKey/);
  assert.match(gameJs, /pendingRebindAction/);
  assert.match(gameJs, /navigator\.getGamepads/);
  assert.match(gameJs, /gamepadMap/);
  assert.match(gameJs, /musicVolume/);
  assert.match(gameJs, /hapticsEnabled/);
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
  const visualWorkflow = read(".github/workflows/visual-regression.yml");
  const flakyWorkflow = read(".github/workflows/flaky-quarantine.yml");
  const deployWorkflow = read(".github/workflows/deploy-stable-site.yml");
  const lighthouseBudget = read("lighthouse-budget.json");

  assert.match(qualityWorkflow, /Quality Checks/);
  assert.match(qualityWorkflow, /test:e2e/);
  assert.match(releaseWorkflow, /workflow_dispatch/);
  assert.match(releaseWorkflow, /channel/);
  assert.match(releaseWorkflow, /Validate semantic version/);
  assert.match(releaseWorkflow, /Generate changelog/);
  assert.match(releaseWorkflow, /Rollback Guide/);
  assert.match(releaseWorkflow, /## Features/);
  assert.match(releaseWorkflow, /action-gh-release/);
  assert.match(visualWorkflow, /Visual Regression/);
  assert.match(visualWorkflow, /PLAYWRIGHT_VISUAL=1/);
  assert.match(flakyWorkflow, /Flaky Quarantine/);
  assert.match(flakyWorkflow, /npx playwright test/);
  assert.match(flakyWorkflow, /continue-on-error: true/);
  assert.match(deployWorkflow, /Deploy Stable Site/);
  assert.match(deployWorkflow, /actions\/deploy-pages/);
  assert.match(qualityWorkflow, /run_lighthouse/);
  assert.match(lighthouseBudget, /largest-contentful-paint/);
});
