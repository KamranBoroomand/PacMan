const { test, expect } = require("@playwright/test");

const visualEnabled = process.env.PLAYWRIGHT_VISUAL === "1";

test.describe("visual snapshots", () => {
  test.skip(!visualEnabled, "Set PLAYWRIGHT_VISUAL=1 to run visual snapshot assertions.");
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "Visual snapshots run only on desktop Chromium."
    );
  });

  test("start screen snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("start-screen.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("gameplay snapshot", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start" }).click();
    await page.waitForTimeout(900);
    await expect(page.locator("#canvas")).toHaveScreenshot("gameplay-canvas.png", {
      maxDiffPixelRatio: 0.03,
    });
  });
});
