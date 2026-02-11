(function initPerfGuardrails(globalScope) {
  const DEFAULTS = {
    minSamples: 120,
    windowSize: 240,
    targetFrameMs: 1000 / 60,
    slowFrameMs: 34,
    severeFrameMs: 50,
    maxSlowRatio: 0.12,
    maxSevereRatio: 0.03,
    maxP95Ms: 36,
    maxP99Ms: 52,
    breachCooldownMs: 6000,
  };

  function toSafeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function percentile(values, p) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const safeP = Math.max(0, Math.min(100, toSafeNumber(p, 50)));
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (safeP / 100) * (sorted.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    if (lowerIndex === upperIndex) {
      return sorted[lowerIndex];
    }

    const weight = index - lowerIndex;
    return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
  }

  function analyzeFrameDurations(durations, options = {}) {
    const config = { ...DEFAULTS, ...(options || {}) };
    const safeDurations = Array.isArray(durations)
      ? durations
          .map((value) => toSafeNumber(value, NaN))
          .filter((value) => Number.isFinite(value) && value >= 0)
      : [];

    const sampleCount = safeDurations.length;
    const totalMs = safeDurations.reduce((sum, value) => sum + value, 0);
    const averageMs = sampleCount > 0 ? totalMs / sampleCount : 0;
    const p95Ms = percentile(safeDurations, 95);
    const p99Ms = percentile(safeDurations, 99);
    const maxMs = sampleCount > 0 ? Math.max(...safeDurations) : 0;
    const slowFrameCount = safeDurations.filter(
      (value) => value > config.slowFrameMs
    ).length;
    const severeFrameCount = safeDurations.filter(
      (value) => value > config.severeFrameMs
    ).length;
    const slowRatio = sampleCount > 0 ? slowFrameCount / sampleCount : 0;
    const severeRatio = sampleCount > 0 ? severeFrameCount / sampleCount : 0;
    const jitterSum = safeDurations.reduce(
      (sum, value) => sum + Math.abs(value - config.targetFrameMs),
      0
    );
    const meanAbsoluteJitterMs = sampleCount > 0 ? jitterSum / sampleCount : 0;

    const reasons = [];
    if (sampleCount < config.minSamples) {
      reasons.push("insufficient-samples");
    }
    if (slowRatio > config.maxSlowRatio) {
      reasons.push("slow-frame-ratio");
    }
    if (severeRatio > config.maxSevereRatio) {
      reasons.push("severe-frame-ratio");
    }
    if (p95Ms > config.maxP95Ms) {
      reasons.push("p95-frame-time");
    }
    if (p99Ms > config.maxP99Ms) {
      reasons.push("p99-frame-time");
    }

    return {
      sampleCount,
      averageMs,
      p95Ms,
      p99Ms,
      maxMs,
      slowFrameCount,
      severeFrameCount,
      slowRatio,
      severeRatio,
      meanAbsoluteJitterMs,
      pass: reasons.length === 0,
      reasons,
      config,
    };
  }

  function createFramePacingMonitor(options = {}) {
    const config = { ...DEFAULTS, ...(options || {}) };
    const history = [];
    let lastBreachAt = -Infinity;
    let lastResult = analyzeFrameDurations([], config);

    function trimToWindow() {
      const windowSize = Math.max(
        config.minSamples,
        Math.floor(toSafeNumber(config.windowSize, DEFAULTS.windowSize))
      );
      while (history.length > windowSize) {
        history.shift();
      }
    }

    return {
      push(deltaMs, nowMs = Date.now()) {
        const delta = toSafeNumber(deltaMs, NaN);
        if (!Number.isFinite(delta) || delta < 0) return lastResult;

        history.push(delta);
        trimToWindow();

        lastResult = analyzeFrameDurations(history, config);

        const safeNow = toSafeNumber(nowMs, Date.now());
        const cooldownMs = Math.max(
          0,
          toSafeNumber(config.breachCooldownMs, DEFAULTS.breachCooldownMs)
        );
        const canEmitBreach = safeNow - lastBreachAt >= cooldownMs;
        if (!lastResult.pass && canEmitBreach && typeof config.onBreach === "function") {
          lastBreachAt = safeNow;
          config.onBreach(lastResult);
        }

        return lastResult;
      },
      getSnapshot() {
        return lastResult;
      },
      reset() {
        history.length = 0;
        lastBreachAt = -Infinity;
        lastResult = analyzeFrameDurations([], config);
      },
    };
  }

  const api = {
    analyzeFrameDurations,
    createFramePacingMonitor,
    percentile,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.PerfGuardrails = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
