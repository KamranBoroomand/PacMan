(function initGameplayUtils(globalScope) {
  const DEFAULT_MAX_CHAIN = 6;
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
    const maxX = bounds && Number.isFinite(bounds.maxX) ? bounds.maxX : Infinity;
    const maxY = bounds && Number.isFinite(bounds.maxY) ? bounds.maxY : Infinity;

    return {
      x: clamp(tile.x + vector.x * distance, 0, maxX),
      y: clamp(tile.y + vector.y * distance, 0, maxY),
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
    const maxX = bounds && Number.isFinite(bounds.maxX) ? bounds.maxX : Infinity;
    const maxY = bounds && Number.isFinite(bounds.maxY) ? bounds.maxY : Infinity;
    return {
      x: clamp(pivotTile.x + vectorX, 0, maxX),
      y: clamp(pivotTile.y + vectorY, 0, maxY),
    };
  }

  function computeClydeTargetTile(pacmanTile, clydeTile, scatterTile, chaseDistance = 8) {
    const distance = manhattanDistance(
      pacmanTile.x,
      pacmanTile.y,
      clydeTile.x,
      clydeTile.y
    );
    if (distance > chaseDistance) {
      return { x: pacmanTile.x, y: pacmanTile.y };
    }
    return { x: scatterTile.x, y: scatterTile.y };
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
      pacmanSpeedMultiplier: 1 + (clampedLevel - 1) * 0.015,
      ghostSpeedMultiplier: 1 + (clampedLevel - 1) * 0.018,
      frightenedDurationMs: Math.max(2400, 7000 - (safeLevel - 1) * 380),
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

  function checkRectTileCollision(map, x, y, width, height, blockSize) {
    if (!Array.isArray(map) || map.length === 0) return true;
    const tileRows = map.length;
    const tileCols = map[0].length;

    const top = Math.floor(y / blockSize);
    const left = Math.floor(x / blockSize);
    const bottom = Math.floor((y + height - 1) / blockSize);
    const right = Math.floor((x + width - 1) / blockSize);

    if (top < 0 || left < 0 || bottom >= tileRows || right >= tileCols) {
      return true;
    }

    return (
      map[top][left] === 1 ||
      map[bottom][left] === 1 ||
      map[top][right] === 1 ||
      map[bottom][right] === 1
    );
  }

  const api = {
    checkRectTileCollision,
    computeBlinkyTargetTile,
    computeClydeTargetTile,
    computeGhostEatScore,
    computeInkyTargetTile,
    computePinkyTargetTile,
    computeScatterChaseMode,
    getLevelTuning,
    isFrightenedFlashing,
    manhattanDistance,
    nextBonusLifeMilestone,
    nextGhostEatChain,
    pickFarthestTarget,
    shouldAwardBonusLife,
    shouldReleaseGhostFromHouse,
    updateHighScore,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.GameplayUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
