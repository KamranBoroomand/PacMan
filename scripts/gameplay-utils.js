(function initGameplayUtils(globalScope) {
  const DEFAULT_MAX_CHAIN = 6;
  const DIRECTION_RIGHT = 4;
  const DIRECTION_UP = 3;
  const DIRECTION_LEFT = 2;
  const DIRECTION_BOTTOM = 1;
  const DEFAULT_GHOST_MODE_SCHEDULE = [
    { mode: "scatter", durationMs: 7000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 7000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: 20000 },
    { mode: "scatter", durationMs: 5000 },
    { mode: "chase", durationMs: Infinity },
  ];
  const LEVEL_TUNING_CAP = 14;

  function toSafeInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function manhattanDistance(ax, ay, bx, by) {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  function computeGhostEatScore(baseScore, chain) {
    const safeBase = Math.max(0, toSafeInteger(baseScore, 0));
    const safeChain = Math.max(0, toSafeInteger(chain, 0));
    return safeBase * Math.pow(2, safeChain);
  }

  function nextGhostEatChain(chain, maxChain = DEFAULT_MAX_CHAIN) {
    const safeChain = Math.max(0, toSafeInteger(chain, 0));
    const safeMax = Math.max(0, toSafeInteger(maxChain, DEFAULT_MAX_CHAIN));
    return Math.min(safeChain + 1, safeMax);
  }

  function pickFarthestTarget(targets, fromX, fromY, randomFn = Math.random) {
    if (!Array.isArray(targets) || targets.length === 0) return null;

    const weightedTargets = [];
    let farthestDistance = -1;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target) continue;

      const distance = manhattanDistance(fromX, fromY, target.x, target.y);
      if (distance > farthestDistance) {
        farthestDistance = distance;
        weightedTargets.length = 0;
        weightedTargets.push(target);
      } else if (distance === farthestDistance) {
        weightedTargets.push(target);
      }
    }

    if (weightedTargets.length === 0) return null;
    if (weightedTargets.length === 1) return weightedTargets[0];

    const randomValue = Math.max(0, Math.min(0.999999, Number(randomFn())));
    const randomIndex = Math.floor(randomValue * weightedTargets.length);
    return weightedTargets[randomIndex];
  }

  function isFrightenedFlashing(
    nowMs,
    frightenedUntilMs,
    flashWindowMs,
    flashIntervalMs
  ) {
    const safeNow = toSafeInteger(nowMs, 0);
    const safeUntil = toSafeInteger(frightenedUntilMs, 0);
    const safeWindow = Math.max(0, toSafeInteger(flashWindowMs, 0));
    const safeInterval = Math.max(1, toSafeInteger(flashIntervalMs, 1));

    if (safeUntil <= safeNow) return false;

    const remainingMs = safeUntil - safeNow;
    if (remainingMs > safeWindow) return false;

    return Math.floor(remainingMs / safeInterval) % 2 === 0;
  }

  function updateHighScore(currentHighScore, currentScore) {
    const safeHighScore = Math.max(0, toSafeInteger(currentHighScore, 0));
    const safeScore = Math.max(0, toSafeInteger(currentScore, 0));
    return Math.max(safeHighScore, safeScore);
  }

  function directionToVector(direction) {
    if (direction === 4) return { x: 1, y: 0 };
    if (direction === 3) return { x: 0, y: -1 };
    if (direction === 2) return { x: -1, y: 0 };
    return { x: 0, y: 1 };
  }

  function projectAheadTile(tile, direction, distance, bounds) {
    const vector = directionToVector(direction);
    return {
      x: tile.x + vector.x * distance - (direction === DIRECTION_UP ? distance : 0),
      y: tile.y + vector.y * distance,
    };
  }

  function computeBlinkyTargetTile(pacmanTile) {
    return { x: pacmanTile.x, y: pacmanTile.y };
  }

  function computePinkyTargetTile(pacmanTile, pacmanDirection, bounds) {
    return projectAheadTile(pacmanTile, pacmanDirection, 4, bounds);
  }

  function computeInkyTargetTile(pacmanTile, pacmanDirection, blinkyTile, bounds) {
    const pivotTile = projectAheadTile(pacmanTile, pacmanDirection, 2, bounds);
    const vectorX = pivotTile.x - blinkyTile.x;
    const vectorY = pivotTile.y - blinkyTile.y;
    return { x: pivotTile.x + vectorX, y: pivotTile.y + vectorY };
  }

  function computeClydeTargetTile(pacmanTile, clydeTile, scatterTile, chaseDistance = 8) {
    const dx = pacmanTile.x - clydeTile.x;
    const dy = pacmanTile.y - clydeTile.y;
    return dx * dx + dy * dy >= chaseDistance * chaseDistance
      ? { ...pacmanTile } : { ...scatterTile };
  }

  function computeScatterChaseMode(
    elapsedMs,
    schedule = DEFAULT_GHOST_MODE_SCHEDULE
  ) {
    const safeElapsed = Math.max(0, toSafeInteger(elapsedMs, 0));
    let remaining = safeElapsed;

    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];
      if (!item || typeof item.mode !== "string") continue;

      const duration = Number(item.durationMs);
      if (!Number.isFinite(duration) || duration === Infinity) {
        return item.mode;
      }

      if (remaining < duration) {
        return item.mode;
      }
      remaining -= duration;
    }

    return "chase";
  }

  function getGhostModeScheduleForLevel(level) {
    const firstScatter = level >= 5 ? 5000 : 7000;
    return [
      { mode: "scatter", durationMs: firstScatter }, { mode: "chase", durationMs: 20000 },
      { mode: "scatter", durationMs: firstScatter }, { mode: "chase", durationMs: 20000 },
      { mode: "scatter", durationMs: 5000 },
      { mode: "chase", durationMs: level === 1 ? 20000 : level >= 5 ? 1037000 : 1033000 },
      { mode: "scatter", durationMs: level === 1 ? 5000 : 1000 / 60 },
      { mode: "chase", durationMs: Infinity },
    ];
  }

  function computeCruiseElroyPhase(remainingDots, phase1Threshold, phase2Threshold) {
    const safeRemaining = Math.max(0, toSafeInteger(remainingDots, 0));
    const safePhase1 = Math.max(0, toSafeInteger(phase1Threshold, 0));
    const safePhase2 = Math.max(0, toSafeInteger(phase2Threshold, 0));

    if (safeRemaining <= safePhase2) return 2;
    if (safeRemaining <= safePhase1) return 1;
    return 0;
  }

  function createSeededRandom(seed) {
    let state = Math.abs(toSafeInteger(seed, 123456789)) % 2147483647;
    if (state === 0) {
      state = 123456789;
    }

    return function nextRandom() {
      state = (state * 48271) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  function getGhostDirectionPriority(direction, personality = "blinky") {
    return [DIRECTION_UP, DIRECTION_LEFT, DIRECTION_BOTTOM, DIRECTION_RIGHT].indexOf(direction);
  }

  function isWalkableTile(map, x, y) {
    if (!Array.isArray(map) || map.length === 0) return false;
    if (y < 0 || y >= map.length) return false;
    if (x < 0 || x >= map[0].length) return false;
    return map[y][x] !== 1;
  }

  function normalizeTunnelX(map, x, y) {
    if (!Array.isArray(map) || map.length === 0) return x;
    const cols = map[0].length;
    if (x >= 0 && x < cols) return x;
    if (y < 0 || y >= map.length) return x;

    const isTunnelRow = map[y][0] !== 1 && map[y][cols - 1] !== 1;
    if (!isTunnelRow) return x;
    return x < 0 ? cols - 1 : 0;
  }

  function getMapNeighbors(map, tileX, tileY) {
    const neighbors = [];
    const deltas = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    for (let i = 0; i < deltas.length; i++) {
      let nextX = tileX + deltas[i].x;
      const nextY = tileY + deltas[i].y;

      if (deltas[i].x !== 0) {
        nextX = normalizeTunnelX(map, nextX, tileY);
      }

      if (isWalkableTile(map, nextX, nextY)) {
        neighbors.push({ x: nextX, y: nextY });
      }
    }

    return neighbors;
  }

  function estimatePathDistance(map, fromTile, targetTile, maxDepth = 100) {
    if (!Array.isArray(map) || map.length === 0) return Infinity;
    if (!fromTile || !targetTile) return Infinity;

    const startX = toSafeInteger(fromTile.x, 0);
    const startY = toSafeInteger(fromTile.y, 0);
    const goalX = toSafeInteger(targetTile.x, 0);
    const goalY = toSafeInteger(targetTile.y, 0);
    const safeMaxDepth = Math.max(1, toSafeInteger(maxDepth, 100));

    if (!isWalkableTile(map, startX, startY)) return Infinity;
    if (startX === goalX && startY === goalY) return 0;

    const visited = Array.from({ length: map.length }, () =>
      Array(map[0].length).fill(false)
    );
    const queue = [{ x: startX, y: startY, depth: 0 }];
    visited[startY][startX] = true;
    let head = 0;

    while (head < queue.length) {
      const current = queue[head];
      head++;

      if (current.depth >= safeMaxDepth) continue;

      const neighbors = getMapNeighbors(map, current.x, current.y);
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (visited[neighbor.y][neighbor.x]) continue;

        const nextDepth = current.depth + 1;
        if (neighbor.x === goalX && neighbor.y === goalY) {
          return nextDepth;
        }

        visited[neighbor.y][neighbor.x] = true;
        queue.push({ x: neighbor.x, y: neighbor.y, depth: nextDepth });
      }
    }

    return Infinity;
  }

  function pickGhostDirection({
    candidates,
    targetTile,
    currentDirection,
    personality,
    map,
    mode = "normal",
    maxPathDepth = 100,
  }) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return currentDirection;
    }

    const safeTarget = targetTile || { x: 0, y: 0 };
    const usePathing =
      Array.isArray(map) &&
      map.length > 0 &&
      Array.isArray(map[0]) &&
      map[0].length > 0 &&
      mode === "eaten";
    let bestCandidate = null;
    let bestScore = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (!candidate) continue;
      if (!Number.isFinite(candidate.direction)) continue;
      if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) continue;

      const dx = safeTarget.x - candidate.x;
      const dy = safeTarget.y - candidate.y;
      const euclideanScore = dx * dx + dy * dy;
      let score = euclideanScore;

      if (usePathing) {
        const pathDistance = estimatePathDistance(
          map,
          { x: candidate.x, y: candidate.y },
          safeTarget,
          maxPathDepth
        );
        const pathScore = Number.isFinite(pathDistance)
          ? pathDistance * 100
          : 100000;
        score = pathScore + euclideanScore;

      }

      const beatsCurrentBest =
        score < bestScore ||
        (
          score === bestScore &&
          getGhostDirectionPriority(candidate.direction, personality) <
            getGhostDirectionPriority(bestCandidate.direction, personality)
        );

      if (!bestCandidate || beatsCurrentBest) {
        bestCandidate = candidate;
        bestScore = score;
      }
    }

    return bestCandidate ? bestCandidate.direction : currentDirection;
  }

  function buildGhostPathSnapshot({
    map,
    startTile,
    targetTile,
    steps = 12,
    initialDirection = DIRECTION_LEFT,
    personality = "blinky",
    mode = "normal",
  }) {
    if (!Array.isArray(map) || map.length === 0 || !startTile || !targetTile) {
      return [];
    }

    const safeSteps = Math.max(1, toSafeInteger(steps, 12));
    const path = [];
    let current = { x: toSafeInteger(startTile.x, 0), y: toSafeInteger(startTile.y, 0) };
    let currentDirection = initialDirection;

    function nextTile(tile, direction) {
      const vector = directionToVector(direction);
      let nextX = tile.x + vector.x;
      const nextY = tile.y + vector.y;
      if (vector.x !== 0) {
        nextX = normalizeTunnelX(map, nextX, tile.y);
      }
      if (!isWalkableTile(map, nextX, nextY)) {
        return null;
      }
      return { x: nextX, y: nextY };
    }

    function opposite(direction) {
      if (direction === DIRECTION_RIGHT) return DIRECTION_LEFT;
      if (direction === DIRECTION_LEFT) return DIRECTION_RIGHT;
      if (direction === DIRECTION_UP) return DIRECTION_BOTTOM;
      return DIRECTION_UP;
    }

    for (let stepIndex = 0; stepIndex < safeSteps; stepIndex++) {
      const candidates = [
        DIRECTION_UP,
        DIRECTION_LEFT,
        DIRECTION_BOTTOM,
        DIRECTION_RIGHT,
      ]
        .map((direction) => {
          const tile = nextTile(current, direction);
          if (!tile) return null;
          return { direction, x: tile.x, y: tile.y };
        })
        .filter(Boolean);

      if (candidates.length === 0) break;

      const reverse = opposite(currentDirection);
      let filtered = candidates;
      if (candidates.length > 1) {
        const nonReverse = candidates.filter((entry) => entry.direction !== reverse);
        if (nonReverse.length > 0) {
          filtered = nonReverse;
        }
      }

      const pickedDirection = pickGhostDirection({
        candidates: filtered,
        targetTile,
        currentDirection,
        personality,
        map,
        mode,
      });
      const next = filtered.find((entry) => entry.direction === pickedDirection) || filtered[0];
      currentDirection = next.direction;
      current = { x: next.x, y: next.y };
      path.push({ x: current.x, y: current.y, direction: currentDirection });
    }

    return path;
  }

  function shouldReleaseGhostFromHouse({
    dotsEatenThisRound,
    releaseDotThreshold,
    elapsedMs,
    forceReleaseMs,
  }) {
    const safeDots = Math.max(0, toSafeInteger(dotsEatenThisRound, 0));
    const safeThreshold = Math.max(0, toSafeInteger(releaseDotThreshold, 0));
    const safeElapsed = Math.max(0, toSafeInteger(elapsedMs, 0));
    const safeForceReleaseMs = Math.max(0, toSafeInteger(forceReleaseMs, 0));

    return safeDots >= safeThreshold || safeElapsed >= safeForceReleaseMs;
  }

  function getLevelTuning(level) {
    const safeLevel = Math.max(1, toSafeInteger(level, 1));
    const clampedLevel = Math.min(safeLevel, LEVEL_TUNING_CAP);

    return {
      level: safeLevel,
      pacmanSpeedMultiplier: 1 + (clampedLevel - 1) * 0.014,
      ghostSpeedMultiplier: 1 + (clampedLevel - 1) * 0.022,
      frightenedDurationMs: ([6,5,4,3,2,5,2,2,1,5,2,1,1,3,1,1,0,1][safeLevel - 1] || 0) * 1000,
      fruitSpawnDelayMs: Math.max(5000, 12000 - (safeLevel - 1) * 350),
      fruitVisibleMs: Math.max(4200, 10000 - (safeLevel - 1) * 220),
    };
  }

  function shouldAwardBonusLife(score, nextBonusLifeScore) {
    const safeScore = Math.max(0, toSafeInteger(score, 0));
    const safeMilestone = Math.max(0, toSafeInteger(nextBonusLifeScore, 0));
    return safeScore >= safeMilestone;
  }

  function nextBonusLifeMilestone(currentMilestone, step = 10000) {
    const safeMilestone = Math.max(0, toSafeInteger(currentMilestone, 0));
    const safeStep = Math.max(1, toSafeInteger(step, 10000));
    return safeMilestone + safeStep;
  }

  function checkRectTileCollision(
    map,
    x,
    y,
    width,
    height,
    blockSize,
    options = {}
  ) {
    if (!Array.isArray(map) || map.length === 0) return true;
    const tileRows = map.length;
    const tileCols = map[0].length;
    const allowHorizontalTunnelWrap = Boolean(
      options && options.allowHorizontalTunnelWrap
    );

    const top = Math.floor(y / blockSize);
    const left = Math.floor(x / blockSize);
    const bottom = Math.floor((y + height - 1) / blockSize);
    const right = Math.floor((x + width - 1) / blockSize);

    if (top < 0 || bottom >= tileRows) {
      return true;
    }

    const outOfHorizontalBounds = left < 0 || right >= tileCols;
    if (outOfHorizontalBounds) {
      if (!allowHorizontalTunnelWrap) {
        return true;
      }

      const centerY = Math.floor((y + height / 2) / blockSize);
      const isTunnelRow =
        centerY >= 0 &&
        centerY < tileRows &&
        map[centerY][0] !== 1 &&
        map[centerY][tileCols - 1] !== 1;
      if (!isTunnelRow) {
        return true;
      }
    }

    const corners = [
      { x: left, y: top },
      { x: left, y: bottom },
      { x: right, y: top },
      { x: right, y: bottom },
    ];

    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      if (corner.x < 0 || corner.x >= tileCols) {
        continue;
      }
      if (map[corner.y][corner.x] === 1 || (map[corner.y][corner.x] === 3 && !options.allowHouseGate)) {
        return true;
      }
    }

    return false;
  }

  function toCollisionRect(rect) {
    if (!rect || typeof rect !== "object") return null;

    const x = Number(rect.x);
    const y = Number(rect.y);
    const width = Number(rect.width);
    const height = Number(rect.height);

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    return { x, y, width, height };
  }

  function rectsOverlap(rectA, rectB) {
    const a = toCollisionRect(rectA);
    const b = toCollisionRect(rectB);

    if (!a || !b) return false;

    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function getAxisSweepInterval(relativeStart, relativeVelocity, halfExtent) {
    if (
      !Number.isFinite(relativeStart) ||
      !Number.isFinite(relativeVelocity) ||
      !Number.isFinite(halfExtent) ||
      halfExtent < 0
    ) {
      return null;
    }

    if (relativeVelocity === 0) {
      if (Math.abs(relativeStart) > halfExtent) return null;
      return { entry: -Infinity, exit: Infinity };
    }

    const t1 = (-halfExtent - relativeStart) / relativeVelocity;
    const t2 = (halfExtent - relativeStart) / relativeVelocity;

    return { entry: Math.min(t1, t2), exit: Math.max(t1, t2) };
  }

  function didRectsCollideDuringStep({
    previousRectA,
    currentRectA,
    previousRectB,
    currentRectB,
  }) {
    const prevA = toCollisionRect(previousRectA);
    const currA = toCollisionRect(currentRectA);
    const prevB = toCollisionRect(previousRectB);
    const currB = toCollisionRect(currentRectB);

    if (!prevA || !currA || !prevB || !currB) return false;

    if (rectsOverlap(prevA, prevB) || rectsOverlap(currA, currB)) {
      return true;
    }

    const prevCenterA = {
      x: prevA.x + prevA.width / 2,
      y: prevA.y + prevA.height / 2,
    };
    const currCenterA = {
      x: currA.x + currA.width / 2,
      y: currA.y + currA.height / 2,
    };
    const prevCenterB = {
      x: prevB.x + prevB.width / 2,
      y: prevB.y + prevB.height / 2,
    };
    const currCenterB = {
      x: currB.x + currB.width / 2,
      y: currB.y + currB.height / 2,
    };

    const relativeStartX = prevCenterA.x - prevCenterB.x;
    const relativeStartY = prevCenterA.y - prevCenterB.y;
    const relativeVelocityX =
      (currCenterA.x - prevCenterA.x) - (currCenterB.x - prevCenterB.x);
    const relativeVelocityY =
      (currCenterA.y - prevCenterA.y) - (currCenterB.y - prevCenterB.y);
    const halfExtentX =
      (Math.max(prevA.width, currA.width) + Math.max(prevB.width, currB.width)) /
      2;
    const halfExtentY =
      (Math.max(prevA.height, currA.height) + Math.max(prevB.height, currB.height)) /
      2;

    const xInterval = getAxisSweepInterval(
      relativeStartX,
      relativeVelocityX,
      halfExtentX
    );
    if (!xInterval) return false;

    const yInterval = getAxisSweepInterval(
      relativeStartY,
      relativeVelocityY,
      halfExtentY
    );
    if (!yInterval) return false;

    const entryTime = Math.max(xInterval.entry, yInterval.entry);
    const exitTime = Math.min(xInterval.exit, yInterval.exit);
    const epsilon = 1e-9;

    return (
      entryTime <= exitTime + epsilon &&
      exitTime >= -epsilon &&
      entryTime <= 1 + epsilon
    );
  }

  const api = {
    buildGhostPathSnapshot,
    checkRectTileCollision,
    didRectsCollideDuringStep,
    computeBlinkyTargetTile,
    computeClydeTargetTile,
    computeCruiseElroyPhase,
    computeGhostEatScore,
    computeInkyTargetTile,
    computePinkyTargetTile,
    computeScatterChaseMode,
    createSeededRandom,
    getGhostModeScheduleForLevel,
    getGhostDirectionPriority,
    getLevelTuning,
    isFrightenedFlashing,
    manhattanDistance,
    nextBonusLifeMilestone,
    nextGhostEatChain,
    pickGhostDirection,
    pickFarthestTarget,
    rectsOverlap,
    shouldAwardBonusLife,
    shouldReleaseGhostFromHouse,
    updateHighScore,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.GameplayUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
