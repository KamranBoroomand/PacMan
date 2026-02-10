const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const syntaxTargets = [
  "scripts/game.js",
  "scripts/ghost.js",
  "scripts/pacman.js",
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
ensureIncludes(indexHtml, 'id="mute-toggle"', "[structure] Mute button is missing from index.html.");
ensureIncludes(indexHtml, 'id="mobile-input-mode"', "[structure] Mobile input setting is missing from index.html.");
ensureIncludes(indexHtml, 'id="virtual-stick"', "[structure] Virtual stick container is missing from index.html.");
ensureIncludes(indexHtml, "manifest.webmanifest", "[pwa] Web app manifest is not linked from index.html.");
ensureIncludes(indexHtml, "scripts/gameplay-utils.js", "[structure] gameplay-utils.js is not loaded in index.html.");

const gameplayUtilsScriptPosition = indexHtml.indexOf("scripts/gameplay-utils.js");
const pacmanScriptPosition = indexHtml.indexOf("scripts/pacman.js");
if (
  gameplayUtilsScriptPosition === -1 ||
  pacmanScriptPosition === -1 ||
  gameplayUtilsScriptPosition > pacmanScriptPosition
) {
  fail("[structure] gameplay-utils.js must load before pacman.js.");
}

const gameJs = readText("scripts/game.js");
ensureIncludes(gameJs, "HIGH_SCORE_STORAGE_KEY", "[gameplay] High score persistence key is missing.");
ensureIncludes(gameJs, "SETTINGS_STORAGE_KEY", "[settings] Settings persistence key is missing.");
ensureIncludes(gameJs, "GHOST_DEFINITIONS", "[ai] Ghost personality definitions are missing.");
ensureIncludes(gameJs, "GHOST_MODE_SCHEDULE", "[ai] Scatter/chase schedule is missing.");
ensureIncludes(gameJs, "startNextLevel", "[progression] Level progression helper is missing.");
ensureIncludes(gameJs, "navigator.getGamepads", "[input] Gamepad input support is missing.");
ensureIncludes(gameJs, "requestAnimationFrame(gameLoop)", "[perf] requestAnimationFrame loop is missing.");
ensureIncludes(gameJs, "serviceWorker.register", "[pwa] Service worker registration is missing.");

if (!fs.existsSync(path.join(projectRoot, "manifest.webmanifest"))) {
  fail("[pwa] manifest.webmanifest file is missing.");
}
if (!fs.existsSync(path.join(projectRoot, "service-worker.js"))) {
  fail("[pwa] service-worker.js file is missing.");
}
if (!fs.existsSync(path.join(projectRoot, ".github/workflows/preview-checks.yml"))) {
  fail("[release] Preview checks workflow is missing.");
}
if (!fs.existsSync(path.join(projectRoot, ".github/workflows/release.yml"))) {
  fail("[release] Release workflow is missing.");
}

if (failures.length > 0) {
  console.error("Lint checks failed:\n");
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log("Lint checks passed.");
