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
});
