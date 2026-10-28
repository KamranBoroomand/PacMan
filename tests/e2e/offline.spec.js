const { test, expect } = require("./fixtures");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

test("fresh offline startup has every required module and local font", async ({ page, context }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, {once: true}));
  });
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => typeof window.advanceTime === "function");
  await page.locator("#start-game").click();
  const state = await page.evaluate(async () => {
    await document.fonts.ready;
    window.advanceTime(2000);
    return { phase: JSON.parse(window.render_game_to_text()).phase, font: document.fonts.check("20px Bungee") };
  });
  expect(state).toEqual({phase: "playing", font: true});
  expect(errors).toEqual([]);
});

test("subpath install keeps updates waiting and preserves unrelated caches", async ({ page }) => {
  let revision = "fixture1";
  const root = path.resolve(__dirname, "../../", process.env.PACMAN_TEST_ROOT === "source" ? "." : "dist");
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname.replace(/^\/nested\//, "") || "index.html";
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
    const types = {".js":"text/javascript", ".html":"text/html", ".css":"text/css", ".png":"image/png", ".gif":"image/gif", ".ttf":"font/ttf", ".webmanifest":"application/manifest+json"};
    response.writeHead(200, {"Content-Type": types[path.extname(file)] || "text/plain", "Cache-Control":"no-store"});
    const body = fs.readFileSync(file);
    response.end(relative === "service-worker.js" ? body.toString().replace(/const CACHE_VERSION = "[^"]+"/, `const CACHE_VERSION = "${revision}"`) : body);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/nested/`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, {once:true}));
      await caches.open("unrelated-app-data");
    });
    revision = "fixture2";
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await expect(page.locator("#update-app")).toBeVisible();
    const before = await page.evaluate(async () => ({ waiting: Boolean((await navigator.serviceWorker.getRegistration()).waiting), keys: await caches.keys() }));
    expect(before.waiting).toBeTruthy();
    expect(before.keys.some(key => key.endsWith("fixture1"))).toBeTruthy();
    await Promise.all([page.waitForEvent("load"), page.locator("#update-app").click()]);
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).filter(key => key.endsWith("fixture1")).length)).toBe(0);
    expect(await page.evaluate(async () => (await caches.keys()).includes("unrelated-app-data"))).toBeTruthy();
    await page.waitForFunction(() => Boolean(window.__PACMAN_DIAGNOSTICS__));
    const manifest = await page.evaluate(async () => (await fetch("manifest.webmanifest")).json());
    expect(manifest.start_url).toBe("./");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("incomplete legacy caches do not poison a fresh release", async ({ page }) => {
  await page.route("**/cache-seed.html", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Cache seed</title>" }));
  await page.goto("/cache-seed.html");
  await page.unroute("**/cache-seed.html");
  await page.evaluate(async () => {
    const old = await caches.open("pacman-static-v9");
    await old.put(new URL("index.html", location.href), new Response("<h1>Outdated shell</h1>", {headers:{"Content-Type":"text/html"}}));
    await old.put(new URL("scripts/game.js", location.href), new Response("throw new Error('outdated module')"));
    await caches.open("pacman-runtime-v9");
    await caches.open("pacman-static-/other/-v4");
  });
  await page.goto("/");
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(window.__PACMAN_DIAGNOSTICS__));
  const keys = await page.evaluate(() => caches.keys());
  expect(keys).not.toContain("pacman-static-v9");
  expect(keys).not.toContain("pacman-runtime-v9");
  expect(keys).toContain("pacman-static-/other/-v4");
  await page.reload();
  await expect(page.locator("#start-game")).toBeEnabled();
});
