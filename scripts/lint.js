const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const syntaxTargets = [
  "scripts/game.js",
  "scripts/ghost.js",
  "scripts/game-storage.js",
  "scripts/perf-guardrails.js",
  "scripts/pacman.js",
  "scripts/replay-tools.js",
  "scripts/gameplay-utils.js",
  "scripts/lint.js",
  "service-worker.js",
  "playwright.config.js",
];

function collectJsFilesRecursively(directoryPath, prefixPath = "") {
  if (!fs.existsSync(directoryPath)) return [];

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(prefixPath, entry.name);
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectJsFilesRecursively(absolutePath, relativePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(relativePath);
    }
  }

  return files;
}

const testFiles = collectJsFilesRecursively(path.join(projectRoot, "tests"), "tests");
syntaxTargets.push(...testFiles);

const failures = [];

function fail(message) {
  failures.push(message);
}

function checkJavaScriptSyntax(relativeFilePath) {
  const absolutePath = path.join(projectRoot, relativeFilePath);
  const result = spawnSync(process.execPath, ["--check", absolutePath], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const details = result.stderr || result.stdout || "Syntax check failed.";
    fail(`[syntax] ${relativeFilePath}\n${details.trim()}`);
  }
}

function readText(relativeFilePath) {
  return fs.readFileSync(path.join(projectRoot, relativeFilePath), "utf8");
}

function ensureIncludes(content, needle, errorMessage) {
  if (!content.includes(needle)) {
    fail(errorMessage);
  }
}

for (const targetFile of syntaxTargets) {
  checkJavaScriptSyntax(targetFile);
}

const indexHtml = readText("index.html");
ensureIncludes(indexHtml, 'id="start-game"', "[structure] Start button is missing from index.html.");
ensureIncludes(indexHtml, 'id="pause-toggle"', "[structure] Pause button is missing from index.html.");
ensureIncludes(indexHtml, 'id="restart-game"', "[structure] Restart button is missing from index.html.");
ensureIncludes(indexHtml, 'id="replay-last"', "[structure] Replay button is missing from index.html.");
ensureIncludes(indexHtml, 'id="daily-challenge"', "[progression] Daily challenge button is missing from index.html.");
ensureIncludes(indexHtml, 'id="mute-toggle"', "[structure] Mute button is missing from index.html.");
ensureIncludes(indexHtml, 'id="update-app"', "[pwa] Update button is missing from index.html.");
ensureIncludes(indexHtml, 'id="mobile-input-mode"', "[structure] Mobile input setting is missing from index.html.");
ensureIncludes(indexHtml, 'id="challenge-mode"', "[structure] Challenge mode setting is missing from index.html.");
ensureIncludes(indexHtml, 'id="palette-mode"', "[accessibility] Palette setting is missing from index.html.");
ensureIncludes(indexHtml, 'id="run-seed-input"', "[debug] Run seed input is missing from index.html.");
ensureIncludes(indexHtml, 'id="sim-debug-enabled"', "[debug] Deterministic debug toggle is missing from index.html.");
ensureIncludes(indexHtml, 'id="replay-export"', "[replay] Replay export button is missing from index.html.");
ensureIncludes(indexHtml, 'id="leaderboard-output"', "[leaderboard] Local leaderboard container is missing from index.html.");
ensureIncludes(indexHtml, 'id="virtual-stick"', "[structure] Virtual stick container is missing from index.html.");
ensureIncludes(indexHtml, "manifest.webmanifest", "[pwa] Web app manifest is not linked from index.html.");
ensureIncludes(indexHtml, "scripts/gameplay-utils.js", "[structure] gameplay-utils.js is not loaded in index.html.");
ensureIncludes(indexHtml, "scripts/game-storage.js", "[structure] game-storage.js is not loaded in index.html.");
ensureIncludes(indexHtml, "scripts/replay-tools.js", "[replay] replay-tools.js is not loaded in index.html.");
ensureIncludes(indexHtml, "scripts/perf-guardrails.js", "[perf] perf-guardrails.js is not loaded in index.html.");

const gameplayUtilsScriptPosition = indexHtml.indexOf("scripts/gameplay-utils.js");
const gameStorageScriptPosition = indexHtml.indexOf("scripts/game-storage.js");
const replayToolsScriptPosition = indexHtml.indexOf("scripts/replay-tools.js");
const perfGuardrailsScriptPosition = indexHtml.indexOf("scripts/perf-guardrails.js");
const pacmanScriptPosition = indexHtml.indexOf("scripts/pacman.js");
if (
  gameplayUtilsScriptPosition === -1 ||
  gameStorageScriptPosition === -1 ||
  replayToolsScriptPosition === -1 ||
  perfGuardrailsScriptPosition === -1 ||
  pacmanScriptPosition === -1 ||
  gameplayUtilsScriptPosition > pacmanScriptPosition ||
  gameStorageScriptPosition > pacmanScriptPosition ||
  replayToolsScriptPosition > pacmanScriptPosition ||
  perfGuardrailsScriptPosition > pacmanScriptPosition
) {
  fail("[structure] foundational utility scripts must load before pacman.js.");
}

const gameJs = readText("scripts/game.js");
ensureIncludes(gameJs, "HIGH_SCORE_STORAGE_KEY", "[gameplay] High score persistence key is missing.");
ensureIncludes(gameJs, "SETTINGS_STORAGE_KEY", "[settings] Settings persistence key is missing.");
ensureIncludes(gameJs, "GHOST_DEFINITIONS", "[ai] Ghost personality definitions are missing.");
ensureIncludes(gameJs, "GHOST_MODE_SCHEDULE", "[ai] Scatter/chase schedule is missing.");
ensureIncludes(gameJs, "GHOST_MODE_SCHEDULE_BY_LEVEL", "[ai] Per-level scatter/chase schedule is missing.");
ensureIncludes(gameJs, "startNextLevel", "[progression] Level progression helper is missing.");
ensureIncludes(gameJs, "attractModeActive", "[flow] Attract mode state is missing.");
ensureIncludes(gameJs, "startReplayLastRun", "[replay] Replay system is missing.");
ensureIncludes(gameJs, "computeDailySeed", "[daily] Daily challenge seed helper is missing.");
ensureIncludes(gameJs, "finalizeRunResult", "[leaderboard] Run result finalization is missing.");
ensureIncludes(gameJs, "setSimulationPaused", "[debug] Deterministic step/pause control is missing.");
ensureIncludes(gameJs, "gamepadMap", "[input] Gamepad remapping is missing.");
ensureIncludes(gameJs, "musicVolume", "[audio] Channel mixer settings are missing.");
ensureIncludes(gameJs, "navigator.getGamepads", "[input] Gamepad input support is missing.");
ensureIncludes(gameJs, "requestAnimationFrame(gameLoop)", "[perf] requestAnimationFrame loop is missing.");
ensureIncludes(gameJs, "navigator.serviceWorker", "[pwa] Service worker registration is missing.");
ensureIncludes(gameJs, "createFramePacingMonitor", "[perf] Frame pacing guardrails are missing.");
ensureIncludes(gameJs, "createReplayCodec", "[replay] Replay codec modularization is missing.");

if (!fs.existsSync(path.join(projectRoot, "manifest.webmanifest"))) {
  fail("[pwa] manifest.webmanifest file is missing.");
}
if (!fs.existsSync(path.join(projectRoot, "service-worker.js"))) {
  fail("[pwa] service-worker.js file is missing.");
}
if (!fs.existsSync(path.join(projectRoot, ".github/workflows/quality-checks.yml"))) {
  fail("[release] Quality checks workflow is missing.");
}
if (!fs.existsSync(path.join(projectRoot, ".github/workflows/release.yml"))) {
  fail("[release] Release workflow is missing.");
}
if (!fs.existsSync(path.join(projectRoot, ".github/workflows/visual-regression.yml"))) {
  fail("[quality] Visual regression workflow is missing.");
}
if (!fs.existsSync(path.join(projectRoot, ".github/workflows/flaky-quarantine.yml"))) {
  fail("[quality] Flaky quarantine workflow is missing.");
}

if (failures.length > 0) {
  console.error("Lint checks failed:\n");
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log("Lint checks passed.");
