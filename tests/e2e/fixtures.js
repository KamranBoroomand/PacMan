const { test: base, expect } = require("@playwright/test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const test = base.extend({
  launchOptions: [async ({ launchOptions, browserName }, use) => {
    if (process.platform !== "darwin" || browserName !== "firefox") {
      await use(launchOptions);
      return;
    }
    // Firefox's shared app-data lookup is protected on macOS 27 (Playwright #42768).
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "pacman-firefox-home-"));
    // Precreate private home folders to avoid macOS home-folder delete ACLs.
    for (const directory of ["Downloads", "Library/Application Support"]) {
      fs.mkdirSync(path.join(home, directory), { recursive: true, mode: 0o700 });
    }
    try {
      await use({ ...launchOptions, env: { ...process.env, ...launchOptions.env, CFFIXED_USER_HOME: home } });
    } finally {
      await fs.promises.rm(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  }, { scope: "worker" }],
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await use(page);
    expect(errors, "Uncaught browser errors").toEqual([]);
  },
});
module.exports = { test, expect };
