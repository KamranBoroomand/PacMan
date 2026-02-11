const { test, expect } = require("@playwright/test");

test("mobile profile exposes touch controls and stick mode toggle", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, "Mobile-only coverage.");

  await page.goto("/");

  const touchControls = page.locator("#touch-controls");
  const virtualStick = page.locator("#virtual-stick");
  const settingsToggle = page.getByText("Settings", { exact: true });

  await expect(settingsToggle).toBeVisible();
  await settingsToggle.click();

  const mobileInputMode = page.locator("#mobile-input-mode");
  await expect(mobileInputMode).toHaveValue("buttons");

  await expect(touchControls).toBeVisible();
  await expect(virtualStick).toHaveClass(/hidden/);

  await mobileInputMode.selectOption("stick");
  await expect(mobileInputMode).toHaveValue("stick");

  await expect(virtualStick).toBeVisible();
  await expect(touchControls).toHaveClass(/hidden/);
});
