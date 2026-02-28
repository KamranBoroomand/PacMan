# PacMan
A fully static, retro-style Pac-Man browser game with responsive canvas rendering and mobile-friendly controls.

## Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Contributor Testing Guide](#contributor-testing-guide)
- [Deployment](#deployment)
- [Website Health Check](#website-health-check)
- [Security/Quality Notes](#securityquality-notes)
- [Roadmap](#roadmap)

## Overview
This repository contains a classic Pac-Man style game implemented with plain HTML, CSS, and JavaScript.

- No build system or backend is required.
- The game runs entirely in the browser via a `<canvas>`.
- Gameplay includes arcade-style ghost personalities, Cruise Elroy phases, per-level scatter/chase parity tables, challenge modes, replay playback, and cutscene transitions.
- Desktop and mobile input are both supported (keyboard rebinding, touch buttons, virtual stick, and gamepad support).

![PacMan gameplay](images/pacman-share.png)

## Core Features
- Classic maze layout (`44 x 31` tiles) with walls, pellets, power pellets, and side-wrap tunnels.
- Responsive canvas scaling with device-pixel-ratio support for crisp rendering.
- Pac-Man movement with wall collision checks and tunnel wrap logic.
- Arcade-accurate ghost behavior with per-ghost targeting logic:
  - Blinky (direct chase), Pinky (ambush ahead), Inky (vector-based), Clyde (distance-based scatter/chase).
- Scatter/chase cycle schedule with frightened overrides and ghost-house release rules.
- Level progression with per-level speed/difficulty tuning, fruit table scoring, and bonus-life milestones.
- Full round-state flow: start screen, ready phase, death phase, intermission, and game-over state.
- Attract mode: automatic demo playback starts after start-screen idle timeout.
- Classic-style level cutscenes with Start-key skip support.
- HUD upgrades: level indicator, ghost mode indicator, fruit label, ghost-eat point popups, and overlay improvements.
- Configurable settings panel with:
  - Volume control, mute, key rebinding, challenge mode select, and mobile input mode selection.
  - Accessibility controls: color-blind/high-contrast palette, reduced motion, and large HUD text.
  - Assistive updates via a lightweight live region for phase/score/life announcements.
  - Settings import/export JSON for moving control/accessibility presets across devices.
  - Optional ghost debug overlay showing target tile and path intent.
  - Persistent settings via `localStorage`.
- Replay system:
  - Deterministic run seed + per-frame action capture.
  - Replay button to rerun the last completed attempt.
  - Versioned replay schema with migration support for older payloads.
  - Export/import replay JSON plus shareable URL hash links.
- Deterministic simulation debugger:
  - Seed inspector with apply/copy controls.
  - Pause/step frame controls for deterministic debugging.
- Challenge modes:
  - Classic, Time Attack, No Power Pellets, and One Life.
- Daily challenge mode with date-based seed, local history, and streak tracking.
- Local leaderboard by mode+seed with best score and best run time.
- Expanded input support:
  - Keyboard, touch buttons, swipe, virtual stick, and gamepad.
  - Remappable gamepad action buttons and one-handed accessibility mode.
- Mobile UX upgrades:
  - Adaptive control sizing, orientation-aware layout tuning, and optional haptic feedback.
- Runtime/performance updates:
  - `requestAnimationFrame` game loop targeting smooth 60 FPS.
  - Cached wall tiles and reduced per-frame overhead in hot paths.
  - Frame-pacing guardrails with stutter detection and analytics hooks.
  - Frame-time budget regression coverage in Playwright (`tests/e2e/performance.spec.js`).
  - Optional Lighthouse baseline budget checks for the landing shell.
- Audio polish:
  - Per-channel mixer controls (master/SFX/music), looped synth bed, and SFX-driven ducking.
- PWA support:
  - Installable app via `manifest.webmanifest`.
  - Offline caching with versioned static/runtime caches.
  - In-app update-ready prompt wired to `skipWaiting`.
- CI/release upgrades:
  - Unit + e2e test workflows.
  - Optional visual snapshot Playwright specs.
  - Visual regression lane + flaky-test quarantine workflow.
  - Deployable site artifact workflow.
  - Stable-tag (`v*`) static deployment workflow for GitHub Pages.
  - Manual release tagging with semantic-version validation, alpha/stable channels, categorized changelog, and rollback guide.

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- Static asset deployment (GitHub Pages-compatible)

## Architecture
### Key Files
- `index.html`: Page shell, canvas, sprite assets, and script loading.
- `css/style.css`: Retro UI styling, responsive layout, and touch-control presentation.
- `scripts/game.js`: Global game state, level progression, ghost AI orchestration, round phases, controls, settings, audio, PWA hooks, and rendering loop.
- `scripts/gameplay-utils.js`: Shared gameplay helpers (AI targeting math, collision helpers, level tuning, scoring, and state utilities).
- `scripts/game-storage.js`: Local persistence helpers for settings, high score, daily state, and leaderboard state.
- `scripts/replay-tools.js`: Replay serialization/parsing codec utilities.
- `scripts/perf-guardrails.js`: Frame-time analysis and runtime pacing monitor helpers.
- `scripts/pacman.js`: `Pacman` class (movement, collision, direction change, pellet consumption, draw logic).
- `scripts/ghost.js`: `Ghost` class (personality-driven target selection, house-release lifecycle, chase/scatter/frightened/eaten states, movement, draw logic).
- `scripts/lint.js`: Built-in lint checks (syntax + structural gameplay checks).
- `tests/*.test.js`: Node-based unit/regression tests for gameplay utilities and structure.
- `tests/e2e/*.spec.js`: Playwright browser regression tests.
- `playwright.config.js`: Playwright config with local static web server.
- `.github/workflows/ci.yml`: Lint + unit tests on push/PR.
- `.github/workflows/quality-checks.yml`: Lint/unit/e2e checks + upload site artifact.
- `.github/workflows/release.yml`: Manual tag + changelog + GitHub release workflow.
- `.github/workflows/deploy-stable-site.yml`: Automatic static deployment for stable release tags.
- `lighthouse-budget.json`: Optional landing-shell Lighthouse budget baseline.
- `scripts/lighthouse-baseline.js`: Optional local Lighthouse runner (`LIGHTHOUSE_RUN=1`) with optional external-server mode (`LIGHTHOUSE_SKIP_SERVER=1`).

### Runtime Flow
1. `game.js` initializes map state, actors, level tuning, replay seed, and UI handlers.
2. Each animation frame advances a fixed-step simulation (`update`) then renders (`draw`).
3. `update` runs input (keyboard/touch/gamepad/replay), phase transitions, challenge timers, AI mode updates, collisions, and scoring.
4. `draw` renders map layers, entities, HUD, popups, cutscenes, and overlays.

```mermaid
flowchart LR
  A["Input Sources (Keyboard/Touch/Gamepad/Replay)"] --> B["update() Fixed Step"]
  B --> C["Phase State Machine"]
  C --> D["Gameplay Systems (AI, Collisions, Fruit, Scoring)"]
  D --> E["Replay Recorder + Challenge Rules"]
  E --> F["draw()"]
  F --> G["Canvas + HUD + Overlays"]
```

## Quick Start
### Option A: Open Directly
1. Clone this repository.
2. Open `index.html` in a modern browser.

### Option B: Serve Locally (recommended)
```bash
git clone https://github.com/KamranBoroomand/PacMan.git
cd PacMan
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

### Option C: Contributor Setup (tests/tooling)
```bash
npm ci
npx playwright install chromium firefox webkit
```

Use lockfile-driven installs (`npm ci`) for deterministic environments. If dependencies change, regenerate and commit `package-lock.json`.

## Configuration
Primary gameplay/config constants live in `scripts/game.js`.

| Constant | Default | Purpose |
| --- | --- | --- |
| `fps` | `60` | Main game loop update/render frequency (fixed-step updates via `requestAnimationFrame`). |
| `oneBlockSize` | `20` | Tile size used by movement, collision, and rendering. |
| `lives` | `3` | Starting lives per run. |
| `ROUND_READY_MS` | `1800` | “Ready!” phase duration before active movement. |
| `INTERMISSION_MS` | `1500` | Stage-clear intermission duration. |
| `BONUS_LIFE_STEP` | `10000` | Score interval for bonus lives (`1UP`). |
| `GHOST_MODE_SCHEDULE` | Classic schedule | Scatter/chase timing cycle for ghost AI. |
| `FRUIT_TABLE` | 8 classic fruits | Per-level fruit score table. |
| `MIN_FRUIT_SPAWN_DISTANCE` | `8` | Minimum tile distance between Pac-Man and spawned fruit. |
| `MIN_GHOST_INITIAL_SPAWN_DISTANCE` | `7` | Minimum initial ghost spawn distance from Pac-Man. |
| `SWIPE_THRESHOLD_PX` | `24` | Minimum swipe distance to trigger mobile direction change. |
| `SETTINGS_STORAGE_KEY` | `pacman.settings.v1` | Local persistence key for settings. |
| `HIGH_SCORE_STORAGE_KEY` | `pacman.highScore` | Local persistence key for high score. |

## Scripts
Quality scripts are available through `npm`:

```bash
npm run lint
npm test
npm run test:e2e
npm run test:e2e:chromium
npm run test:e2e:mobile
npm run test:e2e:perf
npm run test:e2e:visual
npm run test:lighthouse
npm run check
npm run check:all
PLAYWRIGHT_VISUAL=1 npm run test:e2e
LIGHTHOUSE_RUN=1 npm run test:lighthouse
LIGHTHOUSE_RUN=1 LIGHTHOUSE_SKIP_SERVER=1 npm run test:lighthouse
```

- `npm run lint`: Syntax + structural lint checks (`scripts/lint.js`).
- `npm test` / `npm run test:unit`: Unit/regression tests (`tests/*.test.js`) using Node's built-in test runner.
- `npm run test:e2e`: Browser end-to-end tests with Playwright (`tests/e2e/*.spec.js`).
- `npm run test:e2e:chromium`: Desktop Chromium-only e2e lane.
- `npm run test:e2e:mobile`: Mobile Chromium viewport/profile e2e lane.
- `npm run test:e2e:perf`: Frame-time budget regression lane (Chromium desktop profile).
- `npm run test:e2e:visual`: Runs Playwright with `PLAYWRIGHT_VISUAL=1` for snapshot checks.
- `npm run test:lighthouse`: Optional Lighthouse baseline runner (set `LIGHTHOUSE_RUN=1`; starts a local static server unless `LIGHTHOUSE_SKIP_SERVER=1` is set).
- `PLAYWRIGHT_VISUAL=1 npm run test:e2e`: Enables visual snapshot assertions in `tests/e2e/visual.spec.js`.
- `npm run check`: Runs lint + unit tests.
- `npm run check:all`: Runs lint + unit + e2e tests.

## Contributor Testing Guide
1. Run fast checks before every commit:
   ```bash
   npm run check
   ```
2. Run browser regression checks before opening a PR:
   ```bash
   npm run test:e2e
   ```
3. Run visual snapshot checks when UI/animation/HUD changes:
   ```bash
   PLAYWRIGHT_VISUAL=1 npm run test:e2e
   ```
4. If visual tests fail after intentional UI change, update snapshots with:
   ```bash
   PLAYWRIGHT_VISUAL=1 npx playwright test --update-snapshots
   ```
5. Validate release readiness locally:
   ```bash
   npm run check
   ```
6. Optional landing-shell baseline (if Lighthouse tooling/network is available):
   ```bash
   LIGHTHOUSE_RUN=1 npm run test:lighthouse
   ```
   If you already have a server running on `LIGHTHOUSE_PORT` (default `4173`), reuse it with:
   ```bash
   LIGHTHOUSE_RUN=1 LIGHTHOUSE_SKIP_SERVER=1 npm run test:lighthouse
   ```

## Deployment
This project is static and can be deployed to any static host.

Current production domain is configured via `CNAME`:
- `pacman.kamranboroomand.ir`

Typical GitHub Pages flow:
1. Push repository changes to the branch configured for Pages.
2. Ensure root files (`index.html`, `css/`, `scripts/`, `images/`) are published.
3. Keep `CNAME` in the deployed root to retain custom-domain routing.

Stable release tags (`v*`) now trigger `.github/workflows/deploy-stable-site.yml`, which runs checks, bundles static assets, and deploys to GitHub Pages automatically.

## Website Health Check
Last checked: **February 28, 2026**.

- `package-lock.json` remains the source of truth for deterministic `npm ci` installs in CI.
- `npm run check` passed (lint + 46 unit/regression/static checks).
- `npm run test:e2e` passed across desktop Chromium/Firefox/WebKit and mobile Chromium profiles (visual snapshot specs remain opt-in via `PLAYWRIGHT_VISUAL=1`).
- `LIGHTHOUSE_RUN=1 npm run test:lighthouse` now fails fast with actionable startup errors when the local static server cannot bind/start.

## Security/Quality Notes
- No backend is used; gameplay runs fully on the client.
- No authentication or user data processing is present in this codebase.
- Client-side score/state can be modified by end users (expected for arcade-style browser games).
- High scores are stored locally in the browser via `localStorage` (`pacman.highScore`).
- User settings are stored locally in the browser via `localStorage` (`pacman.settings.v1`).
- App can be installed and played offline using service-worker caching.
- Tooling uses Node.js plus Playwright for browser regression testing.
- License: MIT (`LICENSE`).

## Roadmap
The active roadmap is maintained in [`ROADMAP.md`](ROADMAP.md).

Snapshot:
- Core gameplay, replay, challenge modes, PWA support, and CI/release automation are in place.
- Next priorities focus on maintainability, broader e2e/browser coverage, and deployment hardening.

---

<p align="center">
  <video src="images/animation-footer.mov" controls loop muted playsinline></video>
</p>

<p align="center">
  <a href="images/animation-footer.mov">animation-footer.mov</a>
</p>
