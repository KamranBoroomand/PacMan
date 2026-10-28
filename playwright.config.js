const { defineConfig, devices } = require("@playwright/test");

const siteRoot = process.env.PACMAN_TEST_ROOT === "source" ? "." : "dist";

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: "http://127.0.0.1:4182",
    headless: true,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "desktop-firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      name: "desktop-webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: `node scripts/serve.js ${siteRoot} 4182`,
    url: "http://127.0.0.1:4182",
    reuseExistingServer: false,
    timeout: 20000,
  },
});
