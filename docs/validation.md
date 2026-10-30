# Validation

Local validation on October 28, 2026 used macOS 27.0.1 on arm64, Node.js 26.10.0, and Playwright 1.64.1. CI targets Node.js 22. Browser/device profiles are emulated unless stated otherwise.

## Prior modernization baseline

Before implementation, `npm run check` passed its syntax/structure checks and 46 Node tests. The Chromium browser run had six passes, three skips, and two failures: the start/phase and performance probes did not find the expected runtime diagnostics. The initial page also depended on external font loading.

Source inspection confirmed mixed render/gameplay timestamps, pause-sensitive deadlines, an independent animation interval, overlapping canvas HUD coordinates, incomplete precaching, unconditional worker activation, inaccurate icon sizes, tracked dependencies/results, and a vulnerable test-tool dependency.

## Prior modernization checks

| Check | Result |
| --- | --- |
| `npm ci` | Lockfile install succeeded in the working checkout and a clean index export; three development packages installed |
| `npm run check` | Syntax/structure checks and 71 Node tests passed |
| `npm run build` | Built the static artifact and validated all 14 runtime scripts against precaching |
| `PLAYWRIGHT_VISUAL=1 npm run test:e2e -- --workers=2` | 92 passed, zero failures, 16 deliberate exclusions |
| `npm audit --json` | Zero reported vulnerabilities after updating Playwright from 1.51.0 |
| `npm outdated --json` | No outdated packages reported at the time checked |
| Workflow YAML parsing | All six workflow files parsed successfully; workflows were not dispatched |
| `git diff --check`, `git diff --cached --check` | Passed |
| Production-output smoke test | Fresh service-worker installation, offline reload, and session start from `dist/`; no uncaught browser errors |

The prior modernization checkpoint was also checked from a clean index export. Final asset and Firefox changes were checked in the working checkout. All browser projects run against the built artifact. The 16 exclusions are ten visual captures restricted to Chromium desktop/mobile, three touch-control cases excluded from desktop profiles, and three timing-budget cases excluded from profiles other than desktop Chromium. None represents a missing game feature. All twenty Firefox application cases now pass. Chromium, WebKit, and mobile Chromium also pass every applicable case, including ten visual captures. Captures support review and layout assertions, not pixel-diff regression guarantees.

Engine coverage includes pause and debug stepping, frightened expiration, scatter timing, ready/death deadlines, recording and replay, complete-run terminal state, preserved records during replay, maze connectivity, buffered turns, D-pad input, challenge rules, scoring helpers, storage failure, and rendering-cache invalidation. Browser coverage includes form-key handling, narrow HUDs, settings persistence, replay import/completion, level clear and cutscene skip, readable notices, visibility-event handling, offline startup, incomplete legacy-cache recovery, subpath installation, waiting updates, unrelated-cache retention, and uncaught-error detection.

A shared input sequence produces the same simulation hash in the Node reference engine, Chromium, Firefox, and WebKit. This is evidence for the exercised sequence and ruleset, not a proof across every possible run or browser release.

## Arcade gameplay correction — October 29, 2026

The current branch adds four maps, schema 4 replays, restored historical sprites, and arcade turn and target rules. The original 44 × 31 Remix layout remains available. Node checks cover map connectivity, 1,000 procedural seeds, targeting, tie breaks, mode clocks, ghost release, Elroy, and record separation. Browser checks exercise all map and mode combinations in Chromium, Firefox, WebKit, and mobile Chromium. Screenshot and video evidence is retained under `.artifacts/arcade-review/`, `.artifacts/final-gameplay-review/`, and `test-results/`, outside version control.

The ghost algorithms follow [The Pac-Man Dossier](https://www.gamedeveloper.com/design/the-pac-man-dossier) and [Understanding Pac-Man Ghost Behavior](https://gameinternals.com/post/2072558330) for one-tile-ahead turns, Euclidean comparisons, shared tie breaks, targeting quirks, wave timing, reversals, and house priorities. The custom maps retain their own tile layouts and tunnels. Their movement speeds, fruit timing, house geometry, and collision boxes are adaptations of this browser engine rather than a ROM-level copy. Pixel-perfect original arcade timing, physical mobile controls, and long-duration performance remain unqualified.

## Performance

A live desktop Chromium session at 1440 × 1000 was sampled for 6.5 seconds, with seed 777 and normal real-time scheduling. Timings bracketed the actual draw and gameplay functions with `performance.now()`. The wall-cache comparison used the same workload before and after the rendering change.

| Measurement | Before wall cache | After wall cache |
| --- | ---: | ---: |
| Drawing samples | 390 | 390 |
| Total drawing p95 | 0.70 ms | 0.30 ms |
| Wall drawing p95 | 0.50 ms | 0.10 ms |
| Gameplay update p95 | 0.60 ms | 0.80 ms |
| Animation-frame interval p95 | 16.70 ms | 16.80 ms |
| Slow-frame fraction | 0 | 0 |

The rendering improvement reduces measured drawing cost; the update timing fluctuated and no simulation speedup is claimed. Browser timer precision is coarse at these durations. These short, unthrottled desktop measurements do not establish low-end-phone performance, long-session stability, or a universal frame-rate guarantee. Manual stepping never supplies samples to the timing monitor.

## Qualification measurements

Before the geometric artwork replacement, the packaged artifact was measured for another 6.5-second desktop Chromium session at 1440 × 1000 on the same host. Drawing p95 was 0.40 ms, wall drawing p95 0.10 ms, and gameplay update p95 0.60 ms. Animation-frame p95 was 16.70 ms with no slow frames in the 300-frame rolling window. The timer precision and short-run limitations above still apply.

After garbage collection, restart samples at 10, 110, and 210 restarts retained one document, 680 DOM nodes, and 86 event listeners each. Used JavaScript heap was 2,147,804, 2,181,884, and 2,206,864 bytes respectively. No accumulating nodes or listeners were observed; the roughly 59 KB heap increase does not establish absence of all leaks.

Production screenshots and interaction review covered menu, mode selection, gameplay, pause/resume, settings, level transition, game over, leaderboard, and replay at 1440 × 1000, 390 × 844, 320 × 780, and 844 × 390. Every viewport had matching document/viewport widths and no uncaught errors. Gameplay collected pellets using actual keyboard input. Level-clear and terminal screens used controlled fixture state; complete manual level play is not claimed. Portrait and landscape layouts permit vertical scrolling.

## Firefox qualification

The default launch of bundled Firefox 157 failed before page load with “Could not find profile folder.” [Playwright issue #42768](https://github.com/microsoft/playwright/issues/42768) documents macOS 27 restrictions on Firefox's shared application-data lookup and the `CFFIXED_USER_HOME` workaround. This failure is separate from an application assertion failure.

A fresh temporary home supplied through the browser launch environment allowed Firefox to start. The worker fixture precreates private `Downloads` and `Library/Application Support` directories, isolates each worker's application data, and removes it after browser shutdown. Precreation avoids macOS home-folder delete ACLs during cleanup. Normal Firefox profiles, system privacy settings, and ACLs were not changed. Playwright remains pinned to stable 1.64.1.

Firefox then exposed a test-harness issue: navigating directly to the manifest starts a download in that browser. The legacy-cache test now seeds caches from a same-origin blank HTML route. No application change was needed. All twenty applicable Firefox tests pass, and temporary-home cleanup succeeds.

CI retains the Firefox project on `ubuntu-latest`. No workflow was dispatched during the local Firefox qualification described above. Linux fallback execution was unnecessary because local isolated execution succeeded; no new Linux result is claimed from that local check.

## Asset provenance

The [asset register](assets.md) inventories current artwork, screenshots, icons, font, and synthesized audio, with origin and license information. The historical character sheets, favicon, and unused footer movie are restored in the current tree. The project owner confirms holding direct authorization for the restored media and maintains the licensing documents privately; their terms were not independently audited here. The install icons and public screenshots include that artwork. Original Git history and the MIT and OFL notices remain intact.

The retained project name and historical character names are an identity/trademark consideration. This validation records technical behavior and the owner's media authorization; it does not assess trademark rights in the project name. The MIT code license does not establish those rights.

## Limits

- Synthetic visibility-event regression checks pass. Both headed and headless tab-switch attempts on this host left `document.hidden` false, so actual operating-system background/foreground behavior was not qualified by those attempts.
- The optional Lighthouse command without `LIGHTHOUSE_RUN=1` only reports that it is skipped. No Lighthouse score or accessibility certification is claimed.
- Physical phones, real controllers, screen readers, complete manual level runs, long sessions, and Windows/Linux execution were not qualified locally.
- WebKit automation is useful compatibility evidence but is not a physical iOS Safari test.
- TypeScript type checking is not configured. The lint command performs syntax and project-structure checks, not a full semantic linter.
- The maze remains primarily visual. Project-name/trademark clearance is outside this technical qualification.
