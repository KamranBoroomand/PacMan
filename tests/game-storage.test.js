const test = require("node:test");
const assert = require("node:assert/strict");

const gameStorage = require("../scripts/game-storage.js");

function createMockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

test("loadValidatedSettings returns validated defaults on empty storage", () => {
  const storage = createMockStorage();
  const defaults = { volume: 70 };
  const settings = gameStorage.loadValidatedSettings({
    storage,
    key: "settings",
    defaults,
    validate: (raw) => ({ volume: Number(raw.volume) || 70 }),
  });

  assert.deepEqual(settings, { volume: 70 });
});

test("persist and read high score work with integer coercion", () => {
  const storage = createMockStorage();

  gameStorage.persistHighScore({
    storage,
    key: "high",
    highScore: 1234.9,
  });

  const value = gameStorage.readHighScore({ storage, key: "high" });
  assert.equal(value, 1234);
});

test("loadDailyState trims history and normalizes fields", () => {
  const history = Array.from({ length: 40 }, (_, i) => ({ date: String(i) }));
  const storage = createMockStorage({
    daily: JSON.stringify({
      streak: "4",
      lastPlayedDate: "2026-02-10",
      lastCompletedDate: "2026-02-09",
      history,
    }),
  });

  const state = gameStorage.loadDailyState({
    storage,
    key: "daily",
    maxHistory: 30,
  });

  assert.equal(state.streak, 4);
  assert.equal(state.history.length, 30);
  assert.equal(state.history[0].date, "10");
});

test("loadLeaderboardState falls back to empty entries", () => {
  const storage = createMockStorage({ board: "{}" });
  const board = gameStorage.loadLeaderboardState({
    storage,
    key: "board",
  });

  assert.deepEqual(board, { entries: {} });
});

test("getTodayKey returns YYYY-MM-DD", () => {
  const key = gameStorage.getTodayKey(new Date("2026-02-11T12:30:00Z"));
  assert.equal(key, "2026-02-11");
});

test("corrupt leaderboard entries are discarded and old score fields survive", () => {
  const storage = createMockStorage({ board: JSON.stringify({entries: {
    invalid: null,
    valid: {mode: "classic", seed: 777, bestScore: 42, bestTimeMs: null, runs: 2},
    malformed: {mode: "unknown", seed: 1},
  }}) });
  const board = gameStorage.loadLeaderboardState({storage, key: "board"});
  assert.deepEqual(Object.keys(board.entries), ["classic:777"]);
  assert.equal(board.entries["classic:777"].bestScore, 42);
  assert.equal(board.entries["classic:777"].bestTimeMs, Infinity);
});

test("unavailable storage getters and quota failures keep the game usable", () => {
  Object.defineProperty(globalThis, "localStorage", {configurable: true, get() {throw new Error("denied");}});
  try {
    assert.equal(gameStorage.readHighScore({key: "high"}), 0);
    assert.equal(gameStorage.persistSettings({key: "settings", settings: {}}), false);
  } finally { delete globalThis.localStorage; }
  const broken = {getItem() {throw new Error("denied");}, setItem() {throw new Error("quota");}};
  assert.equal(gameStorage.persistHighScore({storage: broken, key: "high", highScore: 2}), false);
});
