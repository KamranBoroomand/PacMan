const test = require("node:test");
const assert = require("node:assert/strict");
const { createFrameScheduler, hashState } = require("../scripts/simulation-clock");

test("frame grouping does not change the number of logical steps", () => {
  for (const fps of [30, 60, 120, 144]) {
    let ticks = 0;
    const clock = createFrameScheduler(() => ticks++);
    for (let frame = 0; frame <= fps * 3; frame++) clock.advance(frame * 1000 / fps);
    assert.equal(ticks, 180, `${fps} Hz`);
  }
});

test("background gaps have bounded catch-up and reset discards old time", () => {
  let ticks = 0;
  const clock = createFrameScheduler(() => ticks++);
  clock.advance(0);
  clock.advance(60000);
  assert.equal(ticks, 6);
  clock.reset();
  clock.advance(120000);
  assert.equal(ticks, 6);
  clock.advance(120000 + 1000 / 60);
  assert.equal(ticks, 7);
});

test("state hash changes with gameplay state", () => {
  assert.equal(hashState({ score: 10 }), hashState({ score: 10 }));
  assert.notEqual(hashState({ score: 10 }), hashState({ score: 11 }));
});
