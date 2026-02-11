const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const projectRoot = path.resolve(__dirname, "..");
const swPath = path.join(projectRoot, "service-worker.js");
const swCode = fs.readFileSync(swPath, "utf8");

test("service worker keeps explicit cache versioning", () => {
  assert.match(swCode, /const CACHE_VERSION = "v[0-9]+"/);
  assert.match(swCode, /STATIC_CACHE_NAME/);
  assert.match(swCode, /RUNTIME_CACHE_NAME/);
});

test("service worker supports skip waiting message for update UX", () => {
  assert.match(swCode, /addEventListener\("message"/);
  assert.match(swCode, /SKIP_WAITING/);
});

