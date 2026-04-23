const CACHE_NAME = "bohri-connect-v1";
const RUNTIME_CACHE = "bohri-runtime-cache-v1";
const ASSETS_TO_CACHE = ["/", "/manifest.json"];

// Install event - cache essential files
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.log("[SW] Cache install error (non-fatal):", error);
        return Promise.resolve();
      });
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
  console.log("[SW] Service worker activated");
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // External requests - network first with cache fallback
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200 && response.type !== "error") {
            const cachePromise = caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, response.clone());
            });
            // Don't wait for cache to complete
            cachePromise.catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page if available
            return caches.match("/");
          });
        }),
    );
    return;
  }

  // API calls - network first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, response.clone());
              })
              .catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches
            .match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return a network error response
              return new Response("Network error", {
                status: 503,
                statusText: "Service Unavailable",
              });
            })
            .catch(() => {
              return new Response("Cache error", {
                status: 500,
                statusText: "Internal Server Error",
              });
            });
        }),
    );
    return;
  }

  // Assets - cache first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (
            response.status === 200 &&
            response.type !== "error" &&
            response.type !== "opaque"
          ) {
            const responseToCache = response.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch(() => {});
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/");
          });
        });
    }),
  );
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Log when service worker is ready
console.log("[SW] Service worker script loaded");

