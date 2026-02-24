const test = require("node:test");
const assert = require("node:assert/strict");

const replayTools = require("../scripts/replay-tools.js");

const challengeModes = {
  CLASSIC: "classic",
  TIME_ATTACK: "time-attack",
};

test("sanitizeReplayPayload normalizes payload shape", () => {
  const sanitized = replayTools.sanitizeReplayPayload(
    {
      schemaVersion: 2,
      seed: "42",
      challengeMode: "time-attack",
      events: [
        { frame: 9.8, action: "left" },
        { frame: "12", action: "pause" },
        { frame: "bad", action: "right" },
      ],
      score: "550",
      level: "3",
    },
    {
      hashSeed: (value) => Number.parseInt(value, 10) + 100,
      challengeModes,
      defaultChallengeMode: challengeModes.CLASSIC,
      nowMs: () => 12345,
    }
  );

  assert.equal(sanitized.schemaVersion, 2);
  assert.equal(sanitized.seed, 142);
  assert.equal(sanitized.challengeMode, "time-attack");
  assert.deepEqual(sanitized.events, [
    { frame: 9, action: "left" },
    { frame: 12, action: "pause" },
  ]);
  assert.equal(sanitized.score, 550);
  assert.equal(sanitized.level, 3);
  assert.equal(sanitized.startedAt, 12345);
});

test("encodeReplayToString and decodeReplayFromString round-trip", () => {
  const payload = {
    schemaVersion: 2,
    seed: 9,
    challengeMode: "classic",
    events: [{ frame: 1, action: "start" }],
  };

  const encoded = replayTools.encodeReplayToString(payload);
  assert.ok(encoded.length > 0);

  const decoded = replayTools.decodeReplayFromString(encoded, {
    hashSeed: (value) => Number.parseInt(value, 10),
    challengeModes,
    defaultChallengeMode: challengeModes.CLASSIC,
    nowMs: () => 1,
  });

  assert.equal(decoded.schemaVersion, 2);
  assert.equal(decoded.seed, 9);
  assert.equal(decoded.challengeMode, "classic");
  assert.deepEqual(decoded.events, [{ frame: 1, action: "start" }]);
});

test("sanitizeReplayPayload migrates legacy v1 payload shape", () => {
  const sanitized = replayTools.sanitizeReplayPayload(
    {
      version: 1,
      runSeed: "77",
      mode: "time-attack",
      inputs: [
        [4, "RIGHT"],
        { tick: 9, input: "left" },
      ],
      finalScore: "1200",
      finalLevel: "5",
      startTime: 10,
      endTime: 22,
    },
    {
      hashSeed: (value) => Number.parseInt(value, 10),
      challengeModes,
      defaultChallengeMode: challengeModes.CLASSIC,
      nowMs: () => 1,
    }
  );

  assert.equal(sanitized.schemaVersion, 2);
  assert.equal(sanitized.seed, 77);
  assert.equal(sanitized.challengeMode, "time-attack");
  assert.deepEqual(sanitized.events, [
    { frame: 4, action: "right" },
    { frame: 9, action: "left" },
  ]);
  assert.equal(sanitized.score, 1200);
  assert.equal(sanitized.level, 5);
  assert.equal(sanitized.migratedFromVersion, 1);
});

test("parseReplayFromHash returns null for unrelated hashes", () => {
  const parsed = replayTools.parseReplayFromHash("#score=2000", "#replay=", {
    hashSeed: (value) => Number.parseInt(value, 10),
    challengeModes,
    defaultChallengeMode: challengeModes.CLASSIC,
  });

  assert.equal(parsed, null);
});
