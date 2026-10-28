(function initGameStorage(globalScope) {
  function resolveStorage(storage) {
    if (
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function"
    ) {
      return storage;
    }

    try {
      const fallback = globalScope && globalScope.localStorage;
      if (fallback && typeof fallback.getItem === "function" && typeof fallback.setItem === "function") return fallback;
    } catch { return null; }

    return null;
  }

  function parseJson(raw, fallback) {
    if (typeof raw !== "string" || raw.length === 0) {
      return fallback;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function toSafeInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getDefaultDailyState() {
    return {
      streak: 0,
      lastPlayedDate: "",
      lastCompletedDate: "",
      history: [],
    };
  }

  function loadValidatedSettings({
    storage,
    key,
    defaults,
    validate,
  }) {
    const resolvedStorage = resolveStorage(storage);
    if (
      typeof validate !== "function" ||
      !resolvedStorage ||
      typeof key !== "string" ||
      !key
    ) {
      return typeof validate === "function" ? validate(defaults) : defaults;
    }

    try {
      const raw = resolvedStorage.getItem(key);
      if (!raw) return validate(defaults);
      const parsed = parseJson(raw, defaults);
      return validate(parsed);
    } catch (error) {
      return validate(defaults);
    }
  }

  function persistSettings({ storage, key, settings }) {
    const resolvedStorage = resolveStorage(storage);
    if (!resolvedStorage || typeof key !== "string" || !key) return false;

    try {
      resolvedStorage.setItem(key, JSON.stringify(settings));
      return true;
    } catch (error) {
      return false;
    }
  }

  function readHighScore({ storage, key }) {
    const resolvedStorage = resolveStorage(storage);
    if (!resolvedStorage || typeof key !== "string" || !key) return 0;

    try {
      const raw = resolvedStorage.getItem(key);
      return Math.max(0, toSafeInteger(raw, 0));
    } catch (error) {
      return 0;
    }
  }

  function persistHighScore({ storage, key, highScore }) {
    const resolvedStorage = resolveStorage(storage);
    if (!resolvedStorage || typeof key !== "string" || !key) return false;

    try {
      resolvedStorage.setItem(key, String(Math.max(0, toSafeInteger(highScore, 0))));
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadDailyState({ storage, key, maxHistory = 30 }) {
    const resolvedStorage = resolveStorage(storage);
    if (!resolvedStorage || typeof key !== "string" || !key) {
      return getDefaultDailyState();
    }

    try {
      const raw = resolvedStorage.getItem(key);
      if (!raw) return getDefaultDailyState();
      const parsed = parseJson(raw, null);
      if (!parsed || typeof parsed !== "object") {
        return getDefaultDailyState();
      }

      const history = Array.isArray(parsed.history)
        ? parsed.history.filter((entry) => entry && typeof entry === "object" && typeof entry.date === "string").slice(-Math.max(1, toSafeInteger(maxHistory, 30)))
        : [];

      return {
        streak: Math.max(0, toSafeInteger(parsed.streak, 0)),
        lastPlayedDate:
          typeof parsed.lastPlayedDate === "string" ? parsed.lastPlayedDate : "",
        lastCompletedDate:
          typeof parsed.lastCompletedDate === "string"
            ? parsed.lastCompletedDate
            : "",
        history,
      };
    } catch (error) {
      return getDefaultDailyState();
    }
  }

  function persistDailyState({ storage, key, state }) {
    const resolvedStorage = resolveStorage(storage);
    if (!resolvedStorage || typeof key !== "string" || !key) return false;

    try {
      resolvedStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadLeaderboardState({ storage, key }) {
    const resolvedStorage = resolveStorage(storage);
    if (!resolvedStorage || typeof key !== "string" || !key) {
      return { entries: {} };
    }

    try {
      const raw = resolvedStorage.getItem(key);
      if (!raw) return { entries: {} };
      const parsed = parseJson(raw, {});
      const entries = {};
      const incoming = parsed && parsed.entries;
      if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
        for (const entry of Object.values(incoming)) {
          if (!entry || typeof entry !== "object" ||
              !["classic", "time-attack", "no-power", "one-life"].includes(entry.mode) ||
              !Number.isSafeInteger(Number(entry.seed))) continue;
          const safe = {
            mode: entry.mode, seed: Number(entry.seed),
            bestScore: Math.max(0, toSafeInteger(entry.bestScore)),
            bestTimeMs: Number.isFinite(Number(entry.bestTimeMs)) && Number(entry.bestTimeMs) > 0 ? Number(entry.bestTimeMs) : Infinity,
            runs: Math.max(0, toSafeInteger(entry.runs)),
            completedRuns: Math.max(0, toSafeInteger(entry.completedRuns)),
            lastPlayed: typeof entry.lastPlayed === "string" ? entry.lastPlayed : "",
          };
          entries[`${safe.mode}:${safe.seed}`] = safe;
        }
      }
      return { entries };
    } catch (error) {
      return { entries: {} };
    }
  }

  function persistLeaderboardState({ storage, key, state }) {
    const resolvedStorage = resolveStorage(storage);
    if (!resolvedStorage || typeof key !== "string" || !key) return false;

    try {
      resolvedStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getTodayKey(now = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const api = {
    getTodayKey,
    loadDailyState,
    loadLeaderboardState,
    loadValidatedSettings,
    persistDailyState,
    persistHighScore,
    persistLeaderboardState,
    persistSettings,
    readHighScore,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.GameStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
