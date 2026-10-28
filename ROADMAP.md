# Roadmap

## Implemented

- Logical-tick gameplay timing, pause-safe effects and transitions, and simulation-driven player animation.
- Seeded replay schema 3 with ruleset compatibility checks and full-state regression comparisons.
- Separate configuration, maze, scheduler, wall renderer, audio, HUD, storage, and replay modules.
- Responsive scoreboard, local display font, keyboard focus states, form-key handling, and corrected horizontal D-pad input.
- Complete offline precaching, scoped caches, relative manifest paths, and player-controlled updates.
- Static build/preview commands, current test tooling, and browser journeys for offline startup and update acceptance.
- Local Firefox qualification with isolated macOS application data; Chromium, Firefox, WebKit, and mobile Chromium pass their applicable tests.
- Project-local geometric actor artwork and maze-mark icons, refreshed screenshots, and an asset provenance register.

## Next

- Play full levels on physical phones and gamepads; test screen readers, zoom, rotation, and long sessions.
- Review project-name/trademark use before broader distribution; no trademark clearance is claimed.
- Continue moving session state out of the coordinator behind explicit simulation interfaces.
- Add a concise first-run touch tutorial and distinguish daily results from custom-seed leaderboards.

## Later

- Consider an independently specified Classic ruleset with verified behavior and its own replay ruleset identifier.
- Consider additional maze layouts after connectivity, difficulty, and complete-run tests are in place.
