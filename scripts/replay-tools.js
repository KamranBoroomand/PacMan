(function initReplayTools(globalScope) {
  const REPLAY_SCHEMA_VERSION = 4;
  const RULESET_VERSION = "arcade-maps-2026-10-v1";
  const MAX_REPLAY_EVENTS = 50000;
  const MAX_REPLAY_FRAMES = 216000;
  const REPLAY_ACTIONS = new Set(["left", "up", "right", "down", "pause", "start"]);
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
    if (!Number.isSafeInteger(normalizedFrame) || normalizedFrame > MAX_REPLAY_FRAMES) return null;
    if (typeof action !== "string") return null;

    const normalizedAction = action.trim().toLowerCase();
    if (!REPLAY_ACTIONS.has(normalizedAction)) return null;

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
      rulesetVersion: payload.rulesetVersion || `legacy-v${sourceSchemaVersion}`,
      finalFrame: payload.finalFrame,
      stateHash: payload.stateHash,
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
    if (!Array.isArray(migratedPayload.events) || migratedPayload.events.length > MAX_REPLAY_EVENTS) return null;
    if (migrationResult.sourceSchemaVersion === REPLAY_SCHEMA_VERSION &&
        (migratedPayload.rulesetVersion !== RULESET_VERSION ||
         migratedPayload.events.some((event) => !normalizeReplayEvent(event)))) return null;

    if (migrationResult.sourceSchemaVersion === REPLAY_SCHEMA_VERSION &&
        (migratedPayload.events.some((event,index,events) =>
          !Number.isSafeInteger(event.frame) || event.frame < 0 || event.frame > migratedPayload.finalFrame ||
          !REPLAY_ACTIONS.has(event.action) || (index > 0 && event.frame < events[index-1].frame)) ||
          !["classic","time-attack","no-power","one-life"].includes(migratedPayload.challengeMode))) return null;

    const hashSeed =
      typeof options.hashSeed === "function"
        ? options.hashSeed
        : (value) => Number.parseInt(value, 10) || 1;
    const challengeModes = options.challengeModes || {};
    const fallbackMode =
      options.defaultChallengeMode || Object.values(challengeModes)[0] || "classic";

    if (migrationResult.sourceSchemaVersion === REPLAY_SCHEMA_VERSION &&
        (!['original-arcade','remix','labyrinth','procedural'].includes(migratedPayload.mapId) ||
         !Number.isSafeInteger(migratedPayload.seed) || migratedPayload.seed < 1 || migratedPayload.seed > 2147483646 ||
         !Number.isSafeInteger(migratedPayload.finalFrame) || !/^[a-f0-9]{8}$/.test(migratedPayload.stateHash))) return null;
    const seed = migrationResult.sourceSchemaVersion === REPLAY_SCHEMA_VERSION ? migratedPayload.seed : hashSeed(migratedPayload.seed);
    const challengeMode = normalizeChallengeMode(
      migratedPayload.challengeMode,
      challengeModes,
      fallbackMode
    );
    const events = normalizeReplayEvents(migratedPayload.events);

    const sanitized = {
      schemaVersion: REPLAY_SCHEMA_VERSION,
      rulesetVersion: migratedPayload.rulesetVersion || `legacy-v${migrationResult.sourceSchemaVersion}`,
      seed,
      mapId: migratedPayload.mapId || "remix",
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

    if (Number.isSafeInteger(migratedPayload.finalFrame) && migratedPayload.finalFrame >= 0 &&
        migratedPayload.finalFrame <= MAX_REPLAY_FRAMES) sanitized.finalFrame = migratedPayload.finalFrame;
    if (/^[a-f0-9]{8}$/.test(migratedPayload.stateHash)) sanitized.stateHash = migratedPayload.stateHash;

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
      const json = JSON.stringify(replayData);
      if (json.length > 2_000_000) return "";
      return encodeUtf8ToBase64(json);
    } catch (error) {
      return "";
    }
  }

  function decodeReplayFromString(encoded, options = {}) {
    try {
      if (typeof encoded !== "string" || encoded.length > 2_700_000) return null;
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
    RULESET_VERSION,
    MAX_REPLAY_EVENTS,
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
