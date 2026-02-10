const test = require("node:test");
const assert = require("node:assert/strict");

const gameplayUtils = require("../scripts/gameplay-utils.js");

test("computeGhostEatScore applies chain multiplier", () => {
  assert.equal(gameplayUtils.computeGhostEatScore(20, 0), 20);
  assert.equal(gameplayUtils.computeGhostEatScore(20, 1), 40);
  assert.equal(gameplayUtils.computeGhostEatScore(20, 3), 160);
});

test("nextGhostEatChain increments and clamps", () => {
  assert.equal(gameplayUtils.nextGhostEatChain(0, 6), 1);
  assert.equal(gameplayUtils.nextGhostEatChain(5, 6), 6);
  assert.equal(gameplayUtils.nextGhostEatChain(9, 6), 6);
});

test("pickFarthestTarget chooses farthest node", () => {
  const targets = [
    { x: 1, y: 1 },
    { x: 8, y: 8 },
    { x: 7, y: 2 },
  ];

  const picked = gameplayUtils.pickFarthestTarget(targets, 0, 0, () => 0);
  assert.deepEqual(picked, { x: 8, y: 8 });
});

test("pickFarthestTarget uses random tie-breaker", () => {
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
  assert.equal(
    gameplayUtils.isFrightenedFlashing(1000, until, 500, 100),
    false
  );
  assert.equal(
    gameplayUtils.isFrightenedFlashing(1600, until, 500, 100),
    true
  );
  assert.equal(
    gameplayUtils.isFrightenedFlashing(1650, until, 500, 100),
    false
  );
});

test("updateHighScore keeps the larger score", () => {
  assert.equal(gameplayUtils.updateHighScore(100, 30), 100);
  assert.equal(gameplayUtils.updateHighScore(100, 120), 120);
});
