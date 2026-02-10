const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: {
    command: "python3 -m http.server 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 20000,
  },
});
