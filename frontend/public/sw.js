const CACHE_NAME = "tei-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/tei-logo.png",
  "/tei-logo.svg"
];

// Installation: Cache the essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network First strategy with Cache fallback
// Exclude api requests and assets served from other hosts to prevent caching conflicts
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip API requests and external scripts/styles (always go network-only)
  if (requestUrl.pathname.startsWith("/api") || requestUrl.host.includes("api")) {
    return;
  }

  // Skip non-GET requests (POST, PUT, DELETE should never be cached)
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone and cache it for static web assets
        if (
          response &&
          response.status === 200 &&
          response.type === "basic" &&
          !requestUrl.pathname.startsWith("/api")
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline or Network error: fallback to Cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a page route is requested and fails, return the index.html fallback
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});
