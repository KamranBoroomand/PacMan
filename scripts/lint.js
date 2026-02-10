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
];

const testDirectory = path.join(projectRoot, "tests");
if (fs.existsSync(testDirectory)) {
  const testFiles = fs
    .readdirSync(testDirectory)
    .filter((file) => file.endsWith(".test.js"))
    .map((file) => path.join("tests", file));
  syntaxTargets.push(...testFiles);
}

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
ensureIncludes(indexHtml, 'id="pause-toggle"', "[structure] Pause button is missing from index.html.");
ensureIncludes(indexHtml, 'id="restart-game"', "[structure] Restart button is missing from index.html.");
ensureIncludes(indexHtml, 'id="mute-toggle"', "[structure] Mute button is missing from index.html.");
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
ensureIncludes(gameJs, "activateFrightenedMode", "[gameplay] Frightened mode activation is missing.");
ensureIncludes(gameJs, 'key === "p"', "[controls] Pause keyboard shortcut (P) is missing.");
ensureIncludes(gameJs, 'key === "r"', "[controls] Restart keyboard shortcut (R) is missing.");
ensureIncludes(gameJs, 'key === "m"', "[controls] Mute keyboard shortcut (M) is missing.");

if (failures.length > 0) {
  console.error("Lint checks failed:\n");
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log("Lint checks passed.");
