(function (scope) {
  const STEP_MS = 1000 / 60;

  function createFrameScheduler(update, maxCatchUpSteps = 6) {
    let previous = null;
    let accumulator = 0;
    return {
      reset() { previous = null; accumulator = 0; },
      advance(now) {
        if (previous === null) { previous = now; return; }
        const elapsed = Math.max(0, now - previous);
        previous = now;
        accumulator += Math.min(elapsed, STEP_MS * maxCatchUpSteps);
        let steps = 0;
        while (accumulator + 1e-7 >= STEP_MS && steps < maxCatchUpSteps) {
          accumulator = Math.max(0, accumulator - STEP_MS);
          update();
          steps += 1;
        }
      },
    };
  }

  function hashState(state) {
    const text = JSON.stringify(state);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  const api = { STEP_MS, createFrameScheduler, hashState };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  scope.SimulationClock = api;
})(globalThis);
