# Roadmap

Last updated: **February 24, 2026**.

## Current State
- Core gameplay loop, arcade-style ghost AI, level progression, challenge modes, replay tooling, and deterministic debug controls are implemented.
- Accessibility and input coverage include keyboard remapping, touch controls, gamepad support, one-handed mode, reduced motion, palette options, and a lightweight live region for score/life/phase announcements.
- PWA packaging (manifest + service worker) and release workflows (quality checks, visual lane, release tagging/changelog, stable-tag static deployment) are present.
- Replay and settings portability now include replay schema versioning+migrations plus settings import/export presets.
- Runtime guardrails now include pacing monitor diagnostics, Playwright frame-time budget checks, and an optional Lighthouse baseline budget lane.
- Local validation currently passes for `npm run check`, static/PWA regression checks, and Playwright e2e browser matrix coverage.

## Next (High Priority)
- [x] Split `scripts/game.js` into smaller modules for persistence/replay/performance helpers to reduce maintenance risk while preserving deterministic behavior.
- [x] Expand Playwright coverage to a browser matrix (Chromium + Firefox + WebKit) plus a mobile viewport profile in CI.
- [x] Add frame-time guardrails (runtime pacing monitor + automated regression tests) to catch stutter regressions early.
- [x] Add lockfile-driven reproducible installs (`npm ci` in workflows and local contributor guidance).
- [x] Add automated static-site deployment on stable release tags (not only site artifact upload).
- [x] Add a lightweight accessibility live region for score/life/phase announcements for non-visual assistive tooling.

## Near-Term Enhancements
- [x] Add performance budgets (frame-time guardrails in test harness plus optional Lighthouse baseline for landing shell).
- [x] Version replay export schema explicitly and add migration handling for older replay payloads.
- [x] Add optional debug overlays (ghost target tile and path intent) for AI tuning and regression triage.
- [x] Add settings import/export so control/accessibility presets can move across devices.

## Backlog
- [ ] Endless mode with post-level-cap dynamic difficulty scaling.
- [ ] Split leaderboard views by daily-seed runs vs custom-seed runs.
- [ ] First-run mobile tutorial overlay for touch and virtual-stick controls.
- [ ] Optional CRT/post-process visual filter toggle.
