# Architecture

The application is a static site. Scripts load in dependency order with `defer`; the browser needs no package loader, build transform, or server API. Node.js and Playwright are development tools.

| Module | Responsibility |
| --- | --- |
| `game-config.js` | Phase constants, challenge identifiers, palettes, schedules, tuning, and tone patterns |
| `simulation-clock.js` | Bounded fixed-step frame scheduler and stable state digest |
| `maze.js` | Remix maze construction, spawn point, and independent map copies |
| `gameplay-utils.js` | Targeting, path selection, collision math, difficulty, and scoring helpers |
| `pacman.js`, `ghost.js` | Actor movement, buffered turns, ghost decisions, and actor drawing |
| `maze-renderer.js` | Wall-layer rendering and invalidation by map, palette, or pixel scale |
| `hud.js` | Text-only updates to the semantic scoreboard |
| `audio.js` | Web Audio lifecycle, mixer, notes, ducking, pause, and cleanup |
| `game-storage.js` | Settings and score persistence, saved-record normalization, storage failure recovery |
| `replay-tools.js` | Replay limits, format migration, validation, and encoding |
| `perf-guardrails.js` | Analysis of real animation-frame intervals |
| `game.js` | Session ownership, phase transitions, gameplay orchestration, input/UI wiring, and diagnostics |

Session and UI state still share the coordinator in `game.js`. The extracted systems have narrower responsibilities, but this is an incremental separation rather than a complete conversion to isolated engine objects. A future change can move session ownership behind an explicit API once the behavioral tests cover more long-running play.

## Timing and phases

`requestAnimationFrame` feeds a scheduler with wall time. The scheduler runs up to six fixed 1/60-second steps per render and drops excess catch-up after long stalls. Every accepted step processes queued inputs and replay events before gameplay. The logical clock advances only while the session is unpaused; the debug pause prevents steps entirely except for an explicit request.

All phase deadlines and gameplay effects use logical time. Pausing saves the underlying phase and its deadline, so ready, death, intermission, and cutscene transitions resume with the same remaining time. The scatter/chase clock also stops while ghosts are frightened. Time Attack and result durations count active playing steps, excluding ready, pause, death, and cutscenes.

The scheduler resets on visibility changes. Focus loss requests one recorded pause; it does not replay accumulated background time. Music and actor animation follow the pause state. Wall rendering and HUD updates cannot consume gameplay randomness.

## Replay contract

Current exports use `schemaVersion: 3` and `rulesetVersion: "remix-2026-10"`. The persisted challenge identifier `classic` now displays as **Remix**, preserving saved settings and mode keys.

A run starts with its seed, a fresh random-number state, maze, actors, score, and timers. Direction, pause, and cutscene/start inputs are queued and recorded on the exact tick that consumes them. Inputs with equal tick numbers retain their order. Playback bypasses live gamepad input and uses the same phase and gameplay functions.

The diagnostic export includes `finalFrame` and an eight-character state hash for regression comparisons. The hash covers the maze, actor state, random-number state, score, lives, phase, and timers. Playback stops at this frame and reports a match, mismatch, or missing digest. The completed viewer can replay again or start a new session. The digest detects accidental divergence; it is not a cryptographic signature or proof that a score is legitimate.

Imports are limited to 2 MB files, 50,000 events, and one hour of tick indices. Current-format imports reject unknown actions, unsupported rulesets, and unsupported future schemas. Version 1/2 payloads retain legacy metadata, but their playback is refused with an explanation because wall-time behavior cannot be reconstructed by the new engine.

`window.advanceTime(ms)` enters manual stepping, with a bounded duration. It advances the actual update functions without adding performance samples. `resumeRealtime()` on the diagnostics object returns to wall-time scheduling with a fresh accumulator. `render_game_to_text()` describes player-visible state. These interfaces let browser tests check deterministic behavior without racing wall timers.

## Offline releases

Installation precaches the complete runtime, local font, icons, and sprite assets. Activation removes only caches owned by this app and scope. The worker serves its cached HTML and corresponding modules together, preventing a network-fresh shell from loading older cached code. Unknown requests are fetched without being stored.

A replacement worker waits until **Update Ready** sends `SKIP_WAITING`. After activation the page reloads. Cache names include the registration path so installations under different subpaths remain separate. Bump `CACHE_VERSION` for each changed runtime release.

## Tooling choices

Plain JavaScript and Canvas remain appropriate for a small static game. TypeScript or Vite could help a future engine-object migration, but adding a compilation boundary now would expand the change without removing the coordinator's shared-state contracts. No framework, backend, analytics service, or runtime dependency is required.

`npm run build` validates every runtime script against the offline asset list and emits a clean, disposable `dist/` containing only declared runtime assets and required license files. CI uses the same build command as local development. Browser tests treat uncaught runtime errors as failures; visual review captures are artifacts rather than checked-in platform goldens.
