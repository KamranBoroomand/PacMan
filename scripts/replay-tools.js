(function initReplayTools(globalScope) {
  function safeNow(nowFn) {
    if (typeof nowFn === "function") {
      const value = Number(nowFn());
      if (Number.isFinite(value)) return value;
    }
    return Date.now();
  }

  function encodeUtf8ToBase64(value) {
    const input = String(value || "");

    if (typeof globalScope.btoa === "function") {
      return globalScope.btoa(unescape(encodeURIComponent(input)));
    }

    if (typeof Buffer !== "undefined") {
      return Buffer.from(input, "utf8").toString("base64");
    }

    throw new Error("Base64 encode unavailable");
  }

  function decodeBase64ToUtf8(value) {
    const encoded = String(value || "");

    if (typeof globalScope.atob === "function") {
      return decodeURIComponent(escape(globalScope.atob(encoded)));
    }

    if (typeof Buffer !== "undefined") {
      return Buffer.from(encoded, "base64").toString("utf8");
    }

    throw new Error("Base64 decode unavailable");
  }

  function normalizeChallengeMode(mode, challengeModes, fallbackMode) {
    const values = Object.values(challengeModes || {});
    if (values.includes(mode)) {
      return mode;
    }
    return fallbackMode;
  }

  function sanitizeReplayPayload(payload, options = {}) {
    if (!payload || typeof payload !== "object") return null;

    const hashSeed =
      typeof options.hashSeed === "function"
        ? options.hashSeed
        : (value) => Number.parseInt(value, 10) || 1;
    const challengeModes = options.challengeModes || {};
    const fallbackMode =
      options.defaultChallengeMode || Object.values(challengeModes)[0] || "classic";

    const seed = hashSeed(payload.seed);
    const challengeMode = normalizeChallengeMode(
      payload.challengeMode,
      challengeModes,
      fallbackMode
    );
    const events = Array.isArray(payload.events)
      ? payload.events
          .filter(
            (entry) =>
              entry &&
              Number.isFinite(Number(entry.frame)) &&
              typeof entry.action === "string"
          )
          .map((entry) => ({
            frame: Math.max(0, Math.floor(Number(entry.frame))),
            action: entry.action,
          }))
      : [];

    return {
      seed,
      challengeMode,
      events,
      startedAt: Number.isFinite(Number(payload.startedAt))
        ? Number(payload.startedAt)
        : safeNow(options.nowMs),
      endedAt: Number.isFinite(Number(payload.endedAt))
        ? Number(payload.endedAt)
        : safeNow(options.nowMs),
      score: Number.isFinite(Number(payload.score)) ? Number(payload.score) : 0,
      level: Number.isFinite(Number(payload.level)) ? Number(payload.level) : 1,
    };
  }

  function encodeReplayToString(replayData) {
    try {
      return encodeUtf8ToBase64(JSON.stringify(replayData));
    } catch (error) {
      return "";
    }
  }

  function decodeReplayFromString(encoded, options = {}) {
    try {
      const json = decodeBase64ToUtf8(encoded);
      const parsed = JSON.parse(json);
      return sanitizeReplayPayload(parsed, options);
    } catch (error) {
      return null;
    }
  }

  function parseReplayFromHash(hash, prefix, options = {}) {
    const safeHash = String(hash || "");
    const safePrefix = String(prefix || "#replay=");
    if (!safeHash || !safeHash.startsWith(safePrefix)) return null;

    const encoded = safeHash.slice(safePrefix.length);
    if (!encoded) return null;

    return decodeReplayFromString(encoded, options);
  }

  function createReplayCodec(options = {}) {
    return {
      sanitize(payload) {
        return sanitizeReplayPayload(payload, options);
      },
      encode(replayData) {
        return encodeReplayToString(replayData);
      },
      decode(encoded) {
        return decodeReplayFromString(encoded, options);
      },
      parseHash(hash, prefix) {
        return parseReplayFromHash(hash, prefix, options);
      },
    };
  }

  const api = {
    createReplayCodec,
    decodeReplayFromString,
    encodeReplayToString,
    parseReplayFromHash,
    sanitizeReplayPayload,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.ReplayTools = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
