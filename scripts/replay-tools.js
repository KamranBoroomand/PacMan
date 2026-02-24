(function initReplayTools(globalScope) {
  const REPLAY_SCHEMA_VERSION = 2;
  const LEGACY_SCHEMA_VERSION = 1;

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

  function toSafeInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeReplayEvent(entry) {
    let frame = null;
    let action = null;

    if (Array.isArray(entry) && entry.length >= 2) {
      frame = entry[0];
      action = entry[1];
    } else if (entry && typeof entry === "object") {
      frame =
        entry.frame ??
        entry.tick ??
        entry.t ??
        entry.atFrame ??
        entry.whenFrame ??
        null;
      action =
        entry.action ??
        entry.input ??
        entry.key ??
        entry.command ??
        null;
    }

    const normalizedFrame = Math.max(0, Math.floor(Number(frame)));
    if (!Number.isFinite(normalizedFrame)) return null;
    if (typeof action !== "string") return null;

    const normalizedAction = action.trim().toLowerCase();
    if (!normalizedAction) return null;

    return {
      frame: normalizedFrame,
      action: normalizedAction,
    };
  }

  function normalizeReplayEvents(events) {
    if (!Array.isArray(events)) return [];
    return events
      .map((entry) => normalizeReplayEvent(entry))
      .filter(Boolean)
      .sort((a, b) => a.frame - b.frame);
  }

  function migrateReplayPayload(payload) {
    if (!payload || typeof payload !== "object") return null;

    const sourceSchemaVersion = Math.max(
      LEGACY_SCHEMA_VERSION,
      toSafeInteger(
        payload.schemaVersion ?? payload.replaySchemaVersion ?? payload.version,
        LEGACY_SCHEMA_VERSION
      )
    );

    if (sourceSchemaVersion > REPLAY_SCHEMA_VERSION) {
      return null;
    }

    if (sourceSchemaVersion >= REPLAY_SCHEMA_VERSION) {
      return {
        sourceSchemaVersion,
        migratedPayload: {
          ...payload,
          schemaVersion: REPLAY_SCHEMA_VERSION,
        },
      };
    }

    const migratedPayload = {
      schemaVersion: REPLAY_SCHEMA_VERSION,
      seed: payload.seed ?? payload.runSeed,
      challengeMode: payload.challengeMode ?? payload.mode ?? payload.challenge,
      events: payload.events ?? payload.inputs ?? payload.actions ?? [],
      startedAt: payload.startedAt ?? payload.startTime,
      endedAt: payload.endedAt ?? payload.endTime,
      score: payload.score ?? payload.finalScore ?? payload.points,
      level: payload.level ?? payload.finalLevel ?? payload.stage,
      reason: payload.reason,
      exportedAt: payload.exportedAt,
    };

    return {
      sourceSchemaVersion,
      migratedPayload,
    };
  }

  function sanitizeReplayPayload(payload, options = {}) {
    const migrationResult = migrateReplayPayload(payload);
    if (!migrationResult || !migrationResult.migratedPayload) return null;

    const migratedPayload = migrationResult.migratedPayload;

    const hashSeed =
      typeof options.hashSeed === "function"
        ? options.hashSeed
        : (value) => Number.parseInt(value, 10) || 1;
    const challengeModes = options.challengeModes || {};
    const fallbackMode =
      options.defaultChallengeMode || Object.values(challengeModes)[0] || "classic";

    const seed = hashSeed(migratedPayload.seed);
    const challengeMode = normalizeChallengeMode(
      migratedPayload.challengeMode,
      challengeModes,
      fallbackMode
    );
    const events = normalizeReplayEvents(migratedPayload.events);

    const sanitized = {
      schemaVersion: REPLAY_SCHEMA_VERSION,
      seed,
      challengeMode,
      events,
      startedAt: Number.isFinite(Number(migratedPayload.startedAt))
        ? Number(migratedPayload.startedAt)
        : safeNow(options.nowMs),
      endedAt: Number.isFinite(Number(migratedPayload.endedAt))
        ? Number(migratedPayload.endedAt)
        : safeNow(options.nowMs),
      score: Number.isFinite(Number(migratedPayload.score))
        ? Number(migratedPayload.score)
        : 0,
      level: Number.isFinite(Number(migratedPayload.level))
        ? Number(migratedPayload.level)
        : 1,
    };

    if (typeof migratedPayload.reason === "string" && migratedPayload.reason.length > 0) {
      sanitized.reason = migratedPayload.reason;
    }

    if (Number.isFinite(Number(migratedPayload.exportedAt))) {
      sanitized.exportedAt = Number(migratedPayload.exportedAt);
    }

    if (migrationResult.sourceSchemaVersion < REPLAY_SCHEMA_VERSION) {
      sanitized.migratedFromVersion = migrationResult.sourceSchemaVersion;
    }

    return sanitized;
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
      schemaVersion() {
        return REPLAY_SCHEMA_VERSION;
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
    REPLAY_SCHEMA_VERSION,
    createReplayCodec,
    decodeReplayFromString,
    encodeReplayToString,
    migrateReplayPayload,
    normalizeReplayEvents,
    parseReplayFromHash,
    sanitizeReplayPayload,
    toSafeInteger,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.ReplayTools = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
