(function initGameplayUtils(globalScope) {
  const DEFAULT_MAX_CHAIN = 6;

  function toSafeInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
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

  const api = {
    computeGhostEatScore,
    isFrightenedFlashing,
    manhattanDistance,
    nextGhostEatChain,
    pickFarthestTarget,
    updateHighScore,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.GameplayUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
