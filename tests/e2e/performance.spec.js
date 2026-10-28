const { test, expect } = require("./fixtures");

test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile, "Real frame-pacing budget uses the desktop Chromium profile.");

test("runtime frame pacing stays within budget on desktop chromium", async ({ page, browserName }, testInfo) => {
  const isCi = Boolean(process.env.CI);

  await page.goto("/");
  await page.locator("#start-game").click();

  await page.waitForFunction(() => Boolean(window.__PACMAN_DIAGNOSTICS__));
  await page.waitForTimeout(2500);
  await page.locator("#restart-game").click();

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
  console.log("Measured frame pacing:", JSON.stringify(snapshot));
  await testInfo.attach("frame-pacing", {body: JSON.stringify(snapshot, null, 2), contentType: "application/json"});
  expect(snapshot).toBeTruthy();
  expect(snapshot.sampleCount).toBeGreaterThanOrEqual(120);
  expect(snapshot.p95Ms).toBeLessThanOrEqual(isCi ? 60 : 45);
  expect(snapshot.slowRatio).toBeLessThanOrEqual(0.2);
});
