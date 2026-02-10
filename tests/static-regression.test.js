const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("index.html exposes gameplay controls and utility script", () => {
  const indexHtml = read("index.html");

  assert.match(indexHtml, /id="pause-toggle"/);
  assert.match(indexHtml, /id="restart-game"/);
  assert.match(indexHtml, /id="mute-toggle"/);
  assert.match(indexHtml, /scripts\/gameplay-utils\.js/);
});

test("game.js keeps high score persistence and frightened mode hooks", () => {
  const gameJs = read("scripts/game.js");

  assert.match(gameJs, /HIGH_SCORE_STORAGE_KEY/);
  assert.match(gameJs, /localStorage\.setItem\(HIGH_SCORE_STORAGE_KEY/);
  assert.match(gameJs, /function activateFrightenedMode/);
  assert.match(gameJs, /function isGhostFrightened/);
});

test("game.js retains keyboard shortcuts for pause, restart, and mute", () => {
  const gameJs = read("scripts/game.js");

  assert.match(gameJs, /key === "p"/);
  assert.match(gameJs, /key === "r"/);
  assert.match(gameJs, /key === "m"/);
});

test("ghost.js supports frightened and eaten ghost states", () => {
  const ghostJs = read("scripts/ghost.js");

  assert.match(ghostJs, /setFrightenedMode\(enabled\)/);
  assert.match(ghostJs, /setEatenMode\(\)/);
  assert.match(ghostJs, /drawFrightenedGhost\(\)/);
  assert.match(ghostJs, /drawEatenGhostEyes\(\)/);
});
