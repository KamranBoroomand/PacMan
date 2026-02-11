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

test("checkRectTileCollision supports horizontal tunnel overflow when enabled", () => {
  const map = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ];

  assert.equal(gameplayUtils.checkRectTileCollision(map, -1, 10, 8, 8, 10), true);
  assert.equal(
    gameplayUtils.checkRectTileCollision(map, -1, 10, 8, 8, 10, {
      allowHorizontalTunnelWrap: true,
    }),
    false
  );
  assert.equal(
    gameplayUtils.checkRectTileCollision(map, 43, 10, 8, 8, 10, {
      allowHorizontalTunnelWrap: true,
    }),
    false
  );
  assert.equal(
    gameplayUtils.checkRectTileCollision(map, -1, 0, 8, 8, 10, {
      allowHorizontalTunnelWrap: true,
    }),
    true
  );
});

test("rectsOverlap returns true only when rectangles overlap by area", () => {
  assert.equal(
    gameplayUtils.rectsOverlap(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 9, y: 2, width: 8, height: 8 }
    ),
    true
  );
  assert.equal(
    gameplayUtils.rectsOverlap(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 10, y: 0, width: 10, height: 10 }
    ),
    false
  );
});

test("didRectsCollideDuringStep catches pass-through swaps", () => {
  const collided = gameplayUtils.didRectsCollideDuringStep({
    previousRectA: { x: 0, y: 0, width: 10, height: 10 },
    currentRectA: { x: 20, y: 0, width: 10, height: 10 },
    previousRectB: { x: 20, y: 0, width: 10, height: 10 },
    currentRectB: { x: 0, y: 0, width: 10, height: 10 },
  });

  assert.equal(collided, true);
});

test("didRectsCollideDuringStep returns false for separated movement", () => {
  const collided = gameplayUtils.didRectsCollideDuringStep({
    previousRectA: { x: 0, y: 0, width: 10, height: 10 },
    currentRectA: { x: 10, y: 0, width: 10, height: 10 },
    previousRectB: { x: 40, y: 30, width: 10, height: 10 },
    currentRectB: { x: 50, y: 30, width: 10, height: 10 },
  });

  assert.equal(collided, false);
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

test("pickGhostDirection chooses nearest candidate tile", () => {
  const direction = gameplayUtils.pickGhostDirection({
    candidates: [
      { direction: 2, x: 4, y: 8 },
      { direction: 4, x: 11, y: 8 },
    ],
    targetTile: { x: 12, y: 8 },
    currentDirection: 2,
    personality: "blinky",
  });

  assert.equal(direction, 4);
});

test("pickGhostDirection uses personality tie-break order", () => {
  const candidates = [
    { direction: 3, x: 8, y: 7 },
    { direction: 2, x: 7, y: 8 },
  ];
  const target = { x: 7, y: 7 };

  const blinkyDirection = gameplayUtils.pickGhostDirection({
    candidates,
    targetTile: target,
    currentDirection: 1,
    personality: "blinky",
  });
  const pinkyDirection = gameplayUtils.pickGhostDirection({
    candidates,
    targetTile: target,
    currentDirection: 1,
    personality: "pinky",
  });

  assert.equal(blinkyDirection, 3);
  assert.equal(pinkyDirection, 2);
});

test("pickGhostDirection prefers continuing direction on equal scores", () => {
  const direction = gameplayUtils.pickGhostDirection({
    candidates: [
      { direction: 3, x: 8, y: 7 },
      { direction: 2, x: 7, y: 8 },
    ],
    targetTile: { x: 7, y: 7 },
    currentDirection: 2,
    personality: "blinky",
  });

  assert.equal(direction, 2);
});

test("getGhostModeScheduleForLevel returns advanced schedule for high levels", () => {
  const level1 = gameplayUtils.getGhostModeScheduleForLevel(1);
  const level6 = gameplayUtils.getGhostModeScheduleForLevel(6);
  const level99 = gameplayUtils.getGhostModeScheduleForLevel(99);

  assert.ok(Array.isArray(level1));
  assert.ok(Array.isArray(level6));
  assert.ok(Array.isArray(level99));
  assert.ok(level6.length <= level1.length);
});

test("computeCruiseElroyPhase resolves phases by remaining dots", () => {
  assert.equal(gameplayUtils.computeCruiseElroyPhase(80, 40, 20), 0);
  assert.equal(gameplayUtils.computeCruiseElroyPhase(40, 40, 20), 1);
  assert.equal(gameplayUtils.computeCruiseElroyPhase(18, 40, 20), 2);
});

test("createSeededRandom yields deterministic sequence", () => {
  const a = gameplayUtils.createSeededRandom(123);
  const b = gameplayUtils.createSeededRandom(123);
  const c = gameplayUtils.createSeededRandom(456);

  const aValues = [a(), a(), a()];
  const bValues = [b(), b(), b()];
  const cValues = [c(), c(), c()];

  assert.deepEqual(aValues, bValues);
  assert.notDeepEqual(aValues, cValues);
});

test("buildGhostPathSnapshot keeps deterministic golden path", () => {
  const map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];

  const snapshot = gameplayUtils.buildGhostPathSnapshot({
    map,
    startTile: { x: 1, y: 1 },
    targetTile: { x: 5, y: 4 },
    steps: 6,
    initialDirection: 4,
    personality: "blinky",
    mode: "normal",
  });

  const path = snapshot.map((tile) => `${tile.x},${tile.y}`);
  assert.deepEqual(path, ["2,1", "3,1", "4,1", "5,1", "5,2", "5,3"]);
});
