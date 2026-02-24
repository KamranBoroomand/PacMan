Original prompt: do these and then update roadmap

- Initialized progress log.
- Audited current codebase and workflows.
- Confirmed pending work items: lockfile/npm ci, stable-tag static deployment, accessibility live region, replay schema version+migration, debug overlays, settings import/export, performance budget harness + optional Lighthouse baseline, roadmap refresh.

- Implemented replay schema versioning + migration in scripts/replay-tools.js and integrated schema-aware import/export status in scripts/game.js.
- Added settings import/export pipeline (UI, file handling, validation, diagnostics API hooks).
- Added accessibility live region with score/life/phase announcements.
- Added ghost debug overlay toggle + rendering of target tile and chosen path intent.
- Added diagnostics API surface: window.render_game_to_text, window.advanceTime, and window.__PACMAN_DIAGNOSTICS__.
- Added performance budget e2e test lane and optional Lighthouse baseline budget files/workflow wiring.
- Updated workflows to use npm ci and added stable-tag deploy workflow.
- Added package-lock.json fallback with pinned versions because live npm lockfile generation is blocked by network sandbox.
- Validation: npm run check passed (lint + 46 node tests).
- Validation gap: Playwright e2e could not run locally because playwright binary is unavailable until dependencies can be installed.
- Validation gap: npm ci cannot complete in this sandbox due blocked network access to registry.npmjs.org.
- TODO (next agent): install dependencies with npm ci once network is available, then run npm run test:e2e and npm run test:e2e:perf to validate browser/runtime budgets.
- TODO (next agent): run LIGHTHOUSE_RUN=1 npm run test:lighthouse (or workflow_dispatch run_lighthouse=true) to record first baseline artifact.
- Skill-loop validation attempt with web_game_playwright_client blocked: local playwright package is unavailable in sandbox (ERR_MODULE_NOT_FOUND), so screenshot/state capture loop could not run.
- Follow-up pass (Feb 24, 2026): completed `npm ci`, installed Playwright browsers (`chromium firefox webkit`), and ran full local validation.
- Stabilized e2e gameplay coverage in `tests/e2e/gameplay.spec.js` by adding deterministic phase helpers (`render_game_to_text` + `advanceTime`) and explicit `#settings-panel` open handling.
- Updated pause/live-region behavior in `scripts/game.js` so pause/resume announcements can bypass announcement gap throttling (forced phase announcement for accessibility-critical state changes).
- Validation: `npm run check` passed, `node --test tests/static-regression.test.js tests/pwa-regression.test.js` passed, and `npm run test:e2e` passed (44 total, 30 passed, 14 skipped optional visual/perf lanes).
- Remaining optional TODO: run `LIGHTHOUSE_RUN=1 npm run test:lighthouse` and store the first baseline artifact.
