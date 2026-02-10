const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const gamePath = path.resolve(__dirname, "../scripts/game.js");
const gameJs = fs.readFileSync(gamePath, "utf8");

function extractLiteral(regex, label) {
  const match = gameJs.match(regex);
  assert.ok(match, `Could not find ${label} in scripts/game.js`);
  return match[1];
}

function evaluateLiteral(literalSource, label) {
  try {
    return Function(`"use strict"; return (${literalSource});`)();
  } catch (error) {
    throw new Error(`Failed to evaluate ${label}: ${error.message}`);
  }
}

function countWalkableNeighbors(map, tile) {
  const deltas = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  let walkable = 0;
  for (let i = 0; i < deltas.length; i++) {
    const nextX = tile.x + deltas[i].x;
    const nextY = tile.y + deltas[i].y;
    if (nextY < 0 || nextY >= map.length) continue;
    if (nextX < 0 || nextX >= map[0].length) continue;
    if (map[nextY][nextX] !== 1) {
      walkable++;
    }
  }

  return walkable;
}

test("ghost-house exit tiles are always walkable", () => {
  const classicMapLiteral = extractLiteral(
    /const classicMap = (\[[\s\S]*?\n\]);/,
    "classicMap"
  );
  const baseExitLiteral = extractLiteral(
    /const GHOST_HOUSE_EXIT_TILE = (\{[^;]+\});/,
    "GHOST_HOUSE_EXIT_TILE"
  );
  const personalityExitsLiteral = extractLiteral(
    /const GHOST_HOUSE_EXIT_BY_PERSONALITY = (\{[\s\S]*?\n\});/,
    "GHOST_HOUSE_EXIT_BY_PERSONALITY"
  );

  const classicMap = evaluateLiteral(classicMapLiteral, "classicMap");
  const baseExit = evaluateLiteral(baseExitLiteral, "GHOST_HOUSE_EXIT_TILE");
  const personalityExits = evaluateLiteral(
    personalityExitsLiteral,
    "GHOST_HOUSE_EXIT_BY_PERSONALITY"
  );

  const tilesToValidate = [baseExit, ...Object.values(personalityExits)];
  for (let i = 0; i < tilesToValidate.length; i++) {
    const tile = tilesToValidate[i];
    assert.ok(tile && Number.isInteger(tile.x) && Number.isInteger(tile.y));
    assert.ok(tile.y >= 0 && tile.y < classicMap.length);
    assert.ok(tile.x >= 0 && tile.x < classicMap[0].length);
    assert.notEqual(
      classicMap[tile.y][tile.x],
      1,
      `Ghost exit tile (${tile.x}, ${tile.y}) cannot be a wall`
    );
    assert.ok(
      countWalkableNeighbors(classicMap, tile) > 0,
      `Ghost exit tile (${tile.x}, ${tile.y}) must have at least one escape path`
    );
  }
});
