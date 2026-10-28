const { test, expect } = require("./fixtures");

test.skip(({ isMobile }) => !isMobile, "Touch-only coverage on the mobile profile.");

test("mobile profile exposes touch controls and stick mode toggle", async ({ page }, testInfo) => {

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
