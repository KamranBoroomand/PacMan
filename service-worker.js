const CACHE_VERSION = "v9";
const STATIC_CACHE_NAME = `pacman-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `pacman-runtime-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./scripts/gameplay-utils.js",
  "./scripts/pacman.js",
  "./scripts/ghost.js",
  "./scripts/game.js",
  "./images/animations.gif",
  "./images/ghost.png",
  "./images/pacman favicon.png",
  "./images/pacman-share.png",
];

function isVersionedAsset(pathname) {
  return pathname.endsWith(".html") || pathname.endsWith(".css") || pathname.endsWith(".js");
}

function writeToCache(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return Promise.resolve();
  }

  return caches.open(cacheName).then((cache) => {
    cache.put(request, response.clone());
    if (request.mode === "navigate") {
      cache.put("./index.html", response.clone());
    }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const activeNames = new Set([STATIC_CACHE_NAME, RUNTIME_CACHE_NAME]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !activeNames.has(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (!event || !event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.endsWith("/service-worker.js")) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => caches.match(request))
    );
    return;
  }

  const networkFirst = request.mode === "navigate" || isVersionedAsset(requestUrl.pathname);
  const cacheName = networkFirst ? STATIC_CACHE_NAME : RUNTIME_CACHE_NAME;

  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          writeToCache(cacheName, request, response);
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === "navigate") {
              return caches.match("./index.html");
            }
            return undefined;
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          writeToCache(cacheName, request, response);
          return response;
        })
        .catch(() => cached);
    })
  );
});
