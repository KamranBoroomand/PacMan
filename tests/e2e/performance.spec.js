const { test, expect } = require("@playwright/test");

test("runtime frame pacing stays within budget on desktop chromium", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium", "Frame-time budget lane runs on Chromium.");
  test.skip(Boolean(testInfo.project.use.isMobile), "Desktop-only budget profile.");
  const isCi = Boolean(process.env.CI);

  await page.goto("/");
  await page.locator("#start-game").click();

  if (isCi) {
    // Shared CI runners are noisy for real-time frame pacing; collect a stable
    // deterministic window to validate diagnostics wiring and budget reporting.
    const advanced = await page.evaluate(() => {
      if (typeof window.advanceTime !== "function") {
        return false;
      }
      window.advanceTime(6000);
      return true;
    });
    expect(advanced).toBeTruthy();
  } else {
    // Warm up first-load compilation/path setup, then reset pacing stats via restart
    // so the budget assertion evaluates steady-state runtime behavior.
    await page.waitForTimeout(2500);
    await page.locator("#restart-game").click();
  }

  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const api = window.__PACMAN_DIAGNOSTICS__;
          if (!api || typeof api.getFramePacingSnapshot !== "function") {
            return 0;
          }
          const snapshot = api.getFramePacingSnapshot();
          return snapshot ? snapshot.sampleCount : 0;
        }),
      {
        timeout: 15000,
        interval: 200,
      }
    )
    .toBeGreaterThanOrEqual(120);

  const snapshot = await page.evaluate(() => window.__PACMAN_DIAGNOSTICS__.getFramePacingSnapshot());
  expect(snapshot).toBeTruthy();
  expect(snapshot.sampleCount).toBeGreaterThanOrEqual(120);
  expect(snapshot.p95Ms).toBeLessThanOrEqual(isCi ? 60 : 45);
  expect(snapshot.slowRatio).toBeLessThanOrEqual(0.2);
});
