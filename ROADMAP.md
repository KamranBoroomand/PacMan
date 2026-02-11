# Roadmap

Last updated: **February 11, 2026**.

## Current State
- Core gameplay loop, arcade-style ghost AI, level progression, challenge modes, replay tooling, and deterministic debug controls are implemented.
- Accessibility and input coverage include keyboard remapping, touch controls, gamepad support, one-handed mode, reduced motion, and palette options.
- PWA packaging (manifest + service worker) and release workflows (quality checks, visual lane, release tagging/changelog) are present.
- Local quality checks are green for lint, unit/regression tests, and static/PWA regression suites.

## Next (High Priority)
- [x] Split `scripts/game.js` into smaller modules for persistence/replay/performance helpers to reduce maintenance risk while preserving deterministic behavior.
- [x] Expand Playwright coverage to a browser matrix (Chromium + Firefox + WebKit) plus a mobile viewport profile in CI.
- [x] Add frame-time guardrails (runtime pacing monitor + automated regression tests) to catch stutter regressions early.
- [ ] Add lockfile-driven reproducible installs (`npm ci` in workflows and local contributor guidance).
- [ ] Add automated static-site deployment on stable release tags (not only site artifact upload).
- [ ] Add a lightweight accessibility live region for score/life/phase announcements for non-visual assistive tooling.

## Near-Term Enhancements
- [ ] Add performance budgets (frame-time guardrails in test harness plus optional Lighthouse baseline for landing shell).
- [ ] Version replay export schema explicitly and add migration handling for older replay payloads.
- [ ] Add optional debug overlays (ghost target tile and path intent) for AI tuning and regression triage.
- [ ] Add settings import/export so control/accessibility presets can move across devices.

## Backlog
- [ ] Endless mode with post-level-cap dynamic difficulty scaling.
- [ ] Split leaderboard views by daily-seed runs vs custom-seed runs.
- [ ] First-run mobile tutorial overlay for touch and virtual-stick controls.
- [ ] Optional CRT/post-process visual filter toggle.
