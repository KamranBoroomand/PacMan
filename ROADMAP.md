# Roadmap

## Implemented

- Logical-tick gameplay timing, pause-safe effects and transitions, and simulation-driven player animation.
- Seeded replay schema 3 with ruleset compatibility checks and full-state regression comparisons.
- Separate configuration, maze, scheduler, wall renderer, audio, HUD, storage, and replay modules.
- Responsive scoreboard, local display font, keyboard focus states, form-key handling, and corrected horizontal D-pad input.
- Complete offline precaching, scoped caches, relative manifest paths, and player-controlled updates.
- Static build/preview commands, current test tooling, and browser journeys for offline startup and update acceptance.

## Next

- Qualify Firefox on a working browser installation and run the complete matrix in CI.
- Play full levels on physical phones and gamepads; test screen readers, zoom, rotation, and long sessions.
- Confirm sprite and branding rights, or replace them with original artwork and identity.
- Continue moving session state out of the coordinator behind explicit simulation interfaces.
- Add a concise first-run touch tutorial and distinguish daily results from custom-seed leaderboards.

## Later

- Consider an independently specified Classic ruleset with verified behavior and its own replay ruleset identifier.
- Consider additional maze layouts after connectivity, difficulty, and complete-run tests are in place.
