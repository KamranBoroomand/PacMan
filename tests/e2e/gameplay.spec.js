const { test, expect } = require("@playwright/test");

async function getCurrentPhase(page) {
  return page.evaluate(() => {
    if (typeof window.render_game_to_text !== "function") {
      return "";
    }
    try {
      const snapshot = JSON.parse(window.render_game_to_text());
      return typeof snapshot.phase === "string" ? snapshot.phase : "";
    } catch (error) {
      return "";
    }
  });
}

async function waitForPhase(page, expectedPhase, timeout = 7000) {
  await expect
    .poll(() => getCurrentPhase(page), {
      timeout,
      interval: 120,
    })
    .toBe(expectedPhase);
}

async function startAndWaitForPlaying(page) {
  await page.locator("#start-game").click();
  await page.evaluate(() => {
    if (typeof window.advanceTime === "function") {
      window.advanceTime(2200);
    }
  });
  await waitForPhase(page, "playing");
}

async function openSettings(page) {
  const settingsPanel = page.locator("#settings-panel");
  await expect(settingsPanel).toBeVisible();
  const isOpen = await settingsPanel.evaluate((node) => node.hasAttribute("open"));
  if (!isOpen) {
    await page.locator("#settings-panel > summary").click();
  }
  await expect(settingsPanel).toHaveAttribute("open", "");
}

test("start, pause, and restart controls work", async ({ page }) => {
  await page.goto("/");

  const startButton = page.locator("#start-game");
  const pauseButton = page.locator("#pause-toggle");
  const restartButton = page.locator("#restart-game");

  await expect(startButton).toBeVisible();
  await expect(pauseButton).toBeVisible();
  await expect(restartButton).toBeVisible();

  await startAndWaitForPlaying(page);

  await pauseButton.click();
  await waitForPhase(page, "paused");
  await expect(pauseButton).toHaveText("Resume");

  await pauseButton.click();
  await waitForPhase(page, "playing");
  await expect(pauseButton).toHaveText("Pause");

  await restartButton.click();
  await expect(page.locator("#canvas")).toBeVisible();
});

test("settings persist through reload", async ({ page }) => {
  await page.goto("/");

  await openSettings(page);

  const volumeControl = page.locator("#volume-control");
  await volumeControl.fill("35");
  await expect(volumeControl).toHaveValue("35");

  await page.reload();
  await openSettings(page);
  await expect(page.locator("#volume-control")).toHaveValue("35");

  const mobileInputMode = page.locator("#mobile-input-mode");
  await mobileInputMode.selectOption("stick");
  await expect(mobileInputMode).toHaveValue("stick");

  const challengeMode = page.locator("#challenge-mode");
  await challengeMode.selectOption("time-attack");
  await expect(challengeMode).toHaveValue("time-attack");

  await page.reload();
  await openSettings(page);
  await expect(page.locator("#challenge-mode")).toHaveValue("time-attack");
});

test("replay button exists and starts disabled", async ({ page }) => {
  await page.goto("/");
  const replayButton = page.locator("#replay-last");
  await expect(replayButton).toBeVisible();
  await expect(replayButton).toBeDisabled();
});

test("daily and deterministic debug controls are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#daily-challenge")).toBeVisible();

  await openSettings(page);
  await expect(page.locator("#run-seed-input")).toBeVisible();
  await expect(page.locator("#sim-debug-enabled")).toBeVisible();
  await expect(page.locator("#ghost-debug-overlay")).toBeVisible();
  await expect(page.locator("#replay-export")).toBeVisible();
  await expect(page.locator("#settings-export")).toBeVisible();
  await expect(page.locator("#settings-import")).toBeVisible();
});

test("seed apply works and restart keeps the active seed", async ({ page }) => {
  await page.goto("/");
  await openSettings(page);

  const seedInput = page.locator("#run-seed-input");
  const seedStatus = page.locator("#seed-status");

  await seedInput.fill("777");
  await expect(seedStatus).toContainText("Pending seed: 777");

  await page.locator("#apply-seed").click();
  await expect(seedStatus).toContainText("Applied seed: 777");

  await page.locator("#restart-game").click();
  await expect(seedStatus).toContainText("Active seed: 777");
});

test("settings export and import round-trip control presets", async ({ page }) => {
  await page.goto("/");
  await openSettings(page);

  const reducedMotion = page.locator("#reduced-motion");
  const debugOverlay = page.locator("#ghost-debug-overlay");
  await reducedMotion.check();
  await debugOverlay.check();

  const exported = await page.evaluate(() =>
    window.__PACMAN_DIAGNOSTICS__.exportSettingsSnapshot()
  );

  await reducedMotion.uncheck();
  await debugOverlay.uncheck();
  await expect(reducedMotion).not.toBeChecked();
  await expect(debugOverlay).not.toBeChecked();

  const imported = await page.evaluate((payload) =>
    window.__PACMAN_DIAGNOSTICS__.importSettingsSnapshot(payload),
    exported
  );
  expect(imported).toBeTruthy();

  await expect(reducedMotion).toBeChecked();
  await expect(debugOverlay).toBeChecked();
  await expect(page.locator("#settings-transfer-status")).toContainText("Success");
});

test("a11y live region announces phase changes", async ({ page }) => {
  await page.goto("/");

  const liveRegion = page.locator("#a11y-live-region");
  await startAndWaitForPlaying(page);
  await page.waitForTimeout(460);

  await page.locator("#pause-toggle").click();
  await waitForPhase(page, "paused");
  await expect(liveRegion).toContainText(/Paused/i);

  await page.locator("#pause-toggle").click();
  await waitForPhase(page, "playing");
  await expect(liveRegion).toContainText(/Gameplay started|Ready/i);
});
