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
- [Deployment](#deployment)
- [Security/Quality Notes](#securityquality-notes)
- [Roadmap](#roadmap)

## Overview
This repository contains a classic Pac-Man style game implemented with plain HTML, CSS, and JavaScript.

- No build system or backend is required.
- The game runs entirely in the browser via a `<canvas>`.
- Gameplay includes arcade-style ghost personalities, scatter/chase/frightened cycles, level progression, and score/lives/high-score HUD.
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
- HUD upgrades: level indicator, ghost mode indicator, fruit label, ghost-eat point popups, and overlay improvements.
- Configurable settings panel with:
  - Volume control, mute, key rebinding, and mobile input mode selection.
  - Persistent settings via `localStorage`.
- Expanded input support:
  - Keyboard, touch buttons, swipe, virtual stick, and gamepad.
- Runtime/performance updates:
  - `requestAnimationFrame` game loop targeting smooth 60 FPS.
  - Cached wall tiles and reduced per-frame overhead in hot paths.
- PWA support:
  - Installable app via `manifest.webmanifest`.
  - Offline caching with `service-worker.js`.
- CI/release upgrades:
  - Unit + e2e test workflows.
  - Deployable site artifact workflow.
  - Manual release tagging/changelog workflow.

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
- `scripts/pacman.js`: `Pacman` class (movement, collision, direction change, pellet consumption, draw logic).
- `scripts/ghost.js`: `Ghost` class (personality-driven target selection, house-release lifecycle, chase/scatter/frightened/eaten states, movement, draw logic).
- `scripts/lint.js`: Built-in lint checks (syntax + structural gameplay checks).
- `tests/*.test.js`: Node-based unit/regression tests for gameplay utilities and structure.
- `tests/e2e/*.spec.js`: Playwright browser regression tests.
- `playwright.config.js`: Playwright config with local static web server.
- `.github/workflows/ci.yml`: Lint + unit tests on push/PR.
- `.github/workflows/quality-checks.yml`: Lint/unit/e2e checks + upload site artifact.
- `.github/workflows/release.yml`: Manual tag + changelog + GitHub release workflow.

### Runtime Flow
1. `game.js` initializes map state, Pac-Man, ghosts, fruit timers, and starts the interval loop.
2. Each frame runs `update()` then `draw()`.
3. `update()` applies movement, collision resolution, food/fruit consumption, ghost interaction, and win/lose checks.
4. `draw()` renders walls, pellets, fruit, ghosts, Pac-Man, popups, score/lives/high-score, level/mode HUD, and phase overlays.

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
npm run check
npm run check:all
```

- `npm run lint`: Syntax + structural lint checks (`scripts/lint.js`).
- `npm test` / `npm run test:unit`: Unit/regression tests (`tests/*.test.js`) using Node's built-in test runner.
- `npm run test:e2e`: Browser end-to-end tests with Playwright (`tests/e2e/*.spec.js`).
- `npm run check`: Runs lint + unit tests.
- `npm run check:all`: Runs lint + unit + e2e tests.

## Deployment
This project is static and can be deployed to any static host.

Current production domain is configured via `CNAME`:
- `pacman.kamranboroomand.ir`

Typical GitHub Pages flow:
1. Push repository changes to the branch configured for Pages.
2. Ensure root files (`index.html`, `css/`, `scripts/`, `images/`) are published.
3. Keep `CNAME` in the deployed root to retain custom-domain routing.

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
- [x] Arcade-accurate ghost AI (Blinky/Pinky/Inky/Clyde), scatter/chase cycles, and ghost-house release rules.
- [x] Level progression with speed/difficulty scaling, fruit tables, and bonus-life milestones.
- [x] Start/round flow polish with start screen, ready phase, life-loss animation, and intermission transitions.
- [x] HUD/feedback upgrades with ghost-eat point popups, level indicator, and improved overlays.
- [x] Settings panel with volume, key rebinding, and local persistence.
- [x] Input expansion with gamepad support and virtual-stick mobile mode.
- [x] Stronger regression protection with gameplay unit tests and Playwright e2e tests.
- [x] Performance/compatibility pass with 60 FPS loop and hot-path optimizations.
- [x] PWA/offline packaging with manifest + service worker.
- [x] Release workflow polish with quality checks and automated tag/changelog release flow.
