const test = require("node:test");
const assert = require("node:assert/strict");
const { createAudioEngine } = require("../scripts/audio");

test("audio is optional when Web Audio is unavailable", () => {
  const engine = createAudioEngine({ getSettings: () => ({ muted: false }), canPlay: () => true, sfx: { ui: [{}] }, music: [] });
  assert.equal(engine.prime(), null);
  assert.doesNotThrow(() => { engine.play("ui"); engine.tick(1000, true); engine.setPaused(true); engine.dispose(); });
});

test("pause cannot be bypassed by priming audio from an interaction", () => {
  let resumes = 0;
  let suspends = 0;
  const gain = { gain: { setValueAtTime() {} }, connect() {} };
  globalThis.AudioContext = class {
    constructor() { this.state = "suspended"; this.currentTime = 0; }
    createGain() { return gain; }
    suspend() { suspends++; return Promise.resolve(); }
    resume() { resumes++; return Promise.resolve(); }
    close() { return Promise.resolve(); }
  };
  try {
    const engine = createAudioEngine({getSettings: () => ({volume:70,sfxVolume:70,musicVolume:30}), canPlay: () => true, sfx: {}, music: []});
    engine.prime();
    const before = resumes;
    engine.setPaused(true); engine.prime();
    assert.equal(resumes, before);
    assert.equal(suspends, 1);
    engine.setPaused(false);
    assert.equal(resumes, before + 1);
    engine.dispose();
  } finally { delete globalThis.AudioContext; }
});
