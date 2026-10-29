const CACHE_VERSION = "v13";
const CACHE_SCOPE = new URL(self.registration.scope).pathname;
const STATIC_CACHE_NAME = `pacman-static-${CACHE_SCOPE}-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `pacman-runtime-${CACHE_SCOPE}-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
  "./fonts/Bungee-Regular.ttf",
  "./scripts/gameplay-utils.js", "./scripts/game-storage.js", "./scripts/replay-tools.js",
  "./scripts/perf-guardrails.js", "./scripts/simulation-clock.js", "./scripts/game-config.js",
  "./scripts/actor-art.js", "./scripts/maze.js", "./scripts/maze-renderer.js", "./scripts/audio.js", "./scripts/hud.js", "./scripts/pacman.js", "./scripts/ghost.js", "./scripts/game.js",
  "./images/maze-icon.svg", "./images/ghost.png", "./images/animations.gif", "./images/pacman favicon.png",
  "./images/icon-192.png", "./images/icon-512.png", "./images/pacman-share.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => {
      const owned = name.startsWith(`pacman-static-${CACHE_SCOPE}-`) ||
        name.startsWith(`pacman-runtime-${CACHE_SCOPE}-`);
      const legacyRoot = CACHE_SCOPE === "/" && /^pacman-(static|runtime)-v\d+$/.test(name);
      return (owned || legacyRoot) && name !== STATIC_CACHE_NAME && name !== RUNTIME_CACHE_NAME;
    }).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

// A release serves one cached shell and its matching modules until the player accepts an update.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(CACHE_SCOPE) || url.pathname.endsWith("/service-worker.js")) return;
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cached = request.mode === "navigate"
      ? await cache.match("./index.html")
      : await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(request); }
    catch { return Response.error(); }
  })());
});
