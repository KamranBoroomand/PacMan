const test = require("node:test");
const assert = require("node:assert/strict");

const perfGuardrails = require("../scripts/perf-guardrails.js");

test("analyzeFrameDurations passes stable frame pacing sample", () => {
  const durations = Array.from({ length: 180 }, (_, i) => 16.2 + (i % 5) * 0.4);
  const result = perfGuardrails.analyzeFrameDurations(durations, {
    minSamples: 120,
    maxSlowRatio: 0.15,
    maxSevereRatio: 0.03,
    maxP95Ms: 36,
    maxP99Ms: 52,
  });

  assert.equal(result.pass, true);
  assert.equal(result.sampleCount, 180);
  assert.equal(result.reasons.length, 0);
});

test("analyzeFrameDurations flags stutter-heavy sample", () => {
  const durations = [];
  for (let i = 0; i < 200; i++) {
    durations.push(i % 4 === 0 ? 58 : 17);
  }

  const result = perfGuardrails.analyzeFrameDurations(durations, {
    minSamples: 120,
    maxSlowRatio: 0.12,
    maxSevereRatio: 0.03,
    maxP95Ms: 36,
    maxP99Ms: 52,
  });

  assert.equal(result.pass, false);
  assert.ok(result.reasons.includes("slow-frame-ratio"));
  assert.ok(result.reasons.includes("severe-frame-ratio"));
});

test("createFramePacingMonitor emits breach callback with cooldown", () => {
  let breachCount = 0;
  const monitor = perfGuardrails.createFramePacingMonitor({
    minSamples: 6,
    windowSize: 8,
    breachCooldownMs: 1000,
    onBreach: () => {
      breachCount += 1;
    },
  });

  monitor.push(60, 0);
  monitor.push(60, 10);
  monitor.push(60, 20);
  monitor.push(60, 30);
  monitor.push(60, 40);
  monitor.push(60, 50);
  assert.equal(breachCount, 1);

  monitor.push(60, 200);
  monitor.push(60, 300);
  assert.equal(breachCount, 1);

  monitor.push(60, 1100);
  assert.equal(breachCount, 2);
});
