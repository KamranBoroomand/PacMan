const CACHE_NAME = "pacman-static-v8";
const ASSETS = [
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
  "./images/pacman-share.png"
];

function isVersionedAsset(pathname) {
  return (
    pathname.endsWith(".html") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  );
}

function writeToCache(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return Promise.resolve();
  }

  return caches.open(CACHE_NAME).then((cache) => {
    cache.put(request, response.clone());

    if (request.mode === "navigate") {
      cache.put("./index.html", response.clone());
    }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
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

  // Never cache-bypass service worker update checks.
  if (requestUrl.pathname.endsWith("/service-worker.js")) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => caches.match(request))
    );
    return;
  }

  const networkFirst =
    request.mode === "navigate" || isVersionedAsset(requestUrl.pathname);

  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          writeToCache(request, response);
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
          writeToCache(request, response);
          return response;
        })
        .catch(() => cached);
    })
  );
});
