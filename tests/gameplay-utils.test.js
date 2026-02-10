const test = require("node:test");
const assert = require("node:assert/strict");

const gameplayUtils = require("../scripts/gameplay-utils.js");

test("computeGhostEatScore applies chain multiplier", () => {
  assert.equal(gameplayUtils.computeGhostEatScore(200, 0), 200);
  assert.equal(gameplayUtils.computeGhostEatScore(200, 1), 400);
  assert.equal(gameplayUtils.computeGhostEatScore(200, 3), 1600);
});

test("nextGhostEatChain increments and clamps", () => {
  assert.equal(gameplayUtils.nextGhostEatChain(0, 6), 1);
  assert.equal(gameplayUtils.nextGhostEatChain(5, 6), 6);
  assert.equal(gameplayUtils.nextGhostEatChain(9, 6), 6);
});

test("computeScatterChaseMode follows schedule windows", () => {
  const schedule = [
    { mode: "scatter", durationMs: 1000 },
    { mode: "chase", durationMs: 2000 },
    { mode: "scatter", durationMs: Infinity },
  ];

  assert.equal(gameplayUtils.computeScatterChaseMode(200, schedule), "scatter");
  assert.equal(gameplayUtils.computeScatterChaseMode(1200, schedule), "chase");
  assert.equal(gameplayUtils.computeScatterChaseMode(4000, schedule), "scatter");
});

test("computePinkyTargetTile projects four tiles ahead", () => {
  const target = gameplayUtils.computePinkyTargetTile(
    { x: 10, y: 10 },
    4,
    { maxX: 27, maxY: 30 }
  );

  assert.deepEqual(target, { x: 14, y: 10 });
});

test("computeInkyTargetTile mirrors from blinky through pivot", () => {
  const target = gameplayUtils.computeInkyTargetTile(
    { x: 10, y: 10 },
    4,
    { x: 8, y: 10 },
    { maxX: 27, maxY: 30 }
  );

  assert.deepEqual(target, { x: 16, y: 10 });
});

test("computeClydeTargetTile switches to scatter when near pacman", () => {
  const chaseTarget = gameplayUtils.computeClydeTargetTile(
    { x: 10, y: 10 },
    { x: 20, y: 20 },
    { x: 1, y: 29 },
    8
  );
  const scatterTarget = gameplayUtils.computeClydeTargetTile(
    { x: 10, y: 10 },
    { x: 11, y: 10 },
    { x: 1, y: 29 },
    8
  );

  assert.deepEqual(chaseTarget, { x: 10, y: 10 });
  assert.deepEqual(scatterTarget, { x: 1, y: 29 });
});

test("shouldReleaseGhostFromHouse supports dots and timer", () => {
  assert.equal(
    gameplayUtils.shouldReleaseGhostFromHouse({
      dotsEatenThisRound: 10,
      releaseDotThreshold: 30,
      elapsedMs: 5000,
      forceReleaseMs: 10000,
    }),
    false
  );

  assert.equal(
    gameplayUtils.shouldReleaseGhostFromHouse({
      dotsEatenThisRound: 30,
      releaseDotThreshold: 30,
      elapsedMs: 100,
      forceReleaseMs: 10000,
    }),
    true
  );

  assert.equal(
    gameplayUtils.shouldReleaseGhostFromHouse({
      dotsEatenThisRound: 0,
      releaseDotThreshold: 30,
      elapsedMs: 12000,
      forceReleaseMs: 10000,
    }),
    true
  );
});

test("checkRectTileCollision returns collision status for walls and bounds", () => {
  const map = [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ];

  assert.equal(gameplayUtils.checkRectTileCollision(map, 10, 10, 8, 8, 10), false);
  assert.equal(gameplayUtils.checkRectTileCollision(map, 0, 0, 8, 8, 10), true);
  assert.equal(gameplayUtils.checkRectTileCollision(map, -1, 10, 8, 8, 10), true);
});

test("level tuning increases speed and shrinks frightened time", () => {
  const l1 = gameplayUtils.getLevelTuning(1);
  const l8 = gameplayUtils.getLevelTuning(8);

  assert.ok(l8.pacmanSpeedMultiplier > l1.pacmanSpeedMultiplier);
  assert.ok(l8.ghostSpeedMultiplier > l1.ghostSpeedMultiplier);
  assert.ok(l8.frightenedDurationMs < l1.frightenedDurationMs);
});

test("bonus life helpers work", () => {
  assert.equal(gameplayUtils.shouldAwardBonusLife(10000, 10000), true);
  assert.equal(gameplayUtils.shouldAwardBonusLife(9999, 10000), false);
  assert.equal(gameplayUtils.nextBonusLifeMilestone(10000, 10000), 20000);
});

test("pickFarthestTarget chooses farthest node with tie-breaking", () => {
  const targets = [
    { x: 9, y: 0 },
    { x: 0, y: 9 },
  ];

  const first = gameplayUtils.pickFarthestTarget(targets, 0, 0, () => 0);
  const second = gameplayUtils.pickFarthestTarget(targets, 0, 0, () => 0.99);

  assert.deepEqual(first, { x: 9, y: 0 });
  assert.deepEqual(second, { x: 0, y: 9 });
});

test("isFrightenedFlashing toggles inside flash window", () => {
  const until = 2000;
  assert.equal(gameplayUtils.isFrightenedFlashing(1000, until, 500, 100), false);
  assert.equal(gameplayUtils.isFrightenedFlashing(1600, until, 500, 100), true);
  assert.equal(gameplayUtils.isFrightenedFlashing(1650, until, 500, 100), false);
});

test("updateHighScore keeps larger score", () => {
  assert.equal(gameplayUtils.updateHighScore(100, 30), 100);
  assert.equal(gameplayUtils.updateHighScore(100, 120), 120);
});
