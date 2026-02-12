const { test, expect } = require("@playwright/test");

test("start, pause, and restart controls work", async ({ page }) => {
  await page.goto("/");

  const startButton = page.getByRole("button", { name: "Start" });
  const pauseButton = page.locator("#pause-toggle");
  const restartButton = page.locator("#restart-game");

  await expect(startButton).toBeVisible();
  await expect(pauseButton).toBeVisible();
  await expect(restartButton).toBeVisible();

  await startButton.click();
  await page.waitForTimeout(250);

  await pauseButton.click();
  await expect(pauseButton).toHaveText("Resume");

  await pauseButton.click();
  await expect(pauseButton).toHaveText("Pause");

  await restartButton.click();
  await expect(page.locator("#canvas")).toBeVisible();
});

test("settings persist through reload", async ({ page }) => {
  await page.goto("/");

  const settingsToggle = page.getByText("Settings", { exact: true });
  await settingsToggle.click();

  const volumeControl = page.locator("#volume-control");
  await volumeControl.fill("35");
  await expect(volumeControl).toHaveValue("35");

  await page.reload();
  await page.getByText("Settings", { exact: true }).click();
  await expect(page.locator("#volume-control")).toHaveValue("35");

  const mobileInputMode = page.locator("#mobile-input-mode");
  await mobileInputMode.selectOption("stick");
  await expect(mobileInputMode).toHaveValue("stick");

  const challengeMode = page.locator("#challenge-mode");
  await challengeMode.selectOption("time-attack");
  await expect(challengeMode).toHaveValue("time-attack");

  await page.reload();
  await page.getByText("Settings", { exact: true }).click();
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

  await page.getByText("Settings", { exact: true }).click();
  await expect(page.locator("#run-seed-input")).toBeVisible();
  await expect(page.locator("#sim-debug-enabled")).toBeVisible();
  await expect(page.locator("#replay-export")).toBeVisible();
});

test("seed apply works and restart keeps the active seed", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Settings", { exact: true }).click();

  const seedInput = page.locator("#run-seed-input");
  const seedStatus = page.locator("#seed-status");

  await seedInput.fill("777");
  await expect(seedStatus).toContainText("Pending seed: 777");

  await page.locator("#apply-seed").click();
  await expect(seedStatus).toContainText("Applied seed: 777");

  await page.locator("#restart-game").click();
  await expect(seedStatus).toContainText("Active seed: 777");
});
