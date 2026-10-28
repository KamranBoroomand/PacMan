const { test, expect } = require("./fixtures");

const visualEnabled = process.env.PLAYWRIGHT_VISUAL === "1";

test.describe("visual review captures", () => {
  test.skip(!visualEnabled, "Set PLAYWRIGHT_VISUAL=1 to capture review images.");
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium desktop/mobile capture profiles.");
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.__PACMAN_DIAGNOSTICS__));
    await page.evaluate(async () => { await document.fonts.ready; window.advanceTime(0); });
  });

  for (const state of ["start", "playing", "paused", "settings", "gameover"]) {
    test(`${state} screen`, async ({ page }, testInfo) => {
      if (state !== "start") {
        await page.evaluate(() => { startNewGame({ seed: 777 }); handleAction("down"); window.advanceTime(3400); });
      }
      if (["paused", "settings"].includes(state)) {
        await page.evaluate(() => { handleAction("pause"); window.advanceTime(1000 / 60); });
      }
      if (state === "gameover") {
        await page.evaluate(() => { lives = 1; onGhostCollision(); window.advanceTime(1200); });
      }
      if (state === "settings") await page.locator("#settings-panel > summary").click();
      const metrics = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth}));
      expect(metrics.scroll).toBeLessThanOrEqual(metrics.width);
      await expect(page.locator("#canvas")).toBeVisible();
      // Viewport captures preserve touch media on mobile browser profiles.
      await testInfo.attach(`${state}.png`, {body: await page.screenshot(), contentType: "image/png"});
    });
  }
});
