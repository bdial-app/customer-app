const CACHE_NAME = "bohri-connect-v2";
const RUNTIME_CACHE = "bohri-runtime-cache-v2";
const IMAGE_CACHE = "bohri-image-cache-v1";
const IMAGE_CACHE_MAX = 150;
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
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
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

  // Supabase storage images — cache-first (images rarely change)
  if (
    url.hostname.includes("supabase.co") &&
    url.pathname.includes("/storage/v1/object/public/")
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
              // Evict oldest if cache is too large
              cache.keys().then((keys) => {
                if (keys.length > IMAGE_CACHE_MAX) {
                  cache.delete(keys[0]);
                }
              });
            }
            return response;
          });
        });
      }),
    );
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

// ──────────────────────────────────────────────
// Push Notifications (Firebase Cloud Messaging)
// ──────────────────────────────────────────────

// Handle push events — display system notification
self.addEventListener("push", (event) => {
  console.log("[SW] Push event received");

  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    try {
      payload = {
        notification: { title: event.data?.text() || "New notification" },
      };
    } catch {
      payload = { notification: { title: "New notification" } };
    }
  }

  // FCM sends data in either notification or data field
  const notifData = payload.notification || {};
  const fcmData = payload.data || {};

  const title = notifData.title || fcmData.title || "Tijarah";
  const body = notifData.body || fcmData.body || "";
  const icon = "/cloth-icon.png";
  const badge = "/cloth-icon.png";
  const image =
    notifData.image || notifData.imageUrl || fcmData.imageUrl || undefined;

  // Use type as collapse tag so multiple chat notifications from same conversation collapse
  const tag = fcmData.type || "general";

  const options = {
    body,
    icon,
    badge,
    image,
    tag,
    renotify: true,
    data: fcmData, // Pass through for notificationclick handler
    actions: [],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — deep link navigation
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = "/";

  // Build deep link URL from notification data
  if (data.route) {
    const params = data.params ? JSON.parse(data.params) : {};

    switch (data.route) {
      case "/provider-details":
        if (params.id) {
          targetUrl = `/provider-details?id=${params.id}`;
          if (params.tab) targetUrl += `&tab=${params.tab}`;
        }
        break;
      case "/product-details":
        if (params.id) targetUrl = `/product-details?id=${params.id}`;
        break;
      case "/chat":
        if (params.conversationId) {
          targetUrl = `/?tab=chats&conversationId=${params.conversationId}`;
        } else {
          targetUrl = "/?tab=chats";
        }
        break;
      case "/provider-onboarding/verify":
        targetUrl = "/provider-onboarding/verify";
        break;
      default:
        targetUrl = data.route.startsWith("/") ? data.route : "/";
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If the app is already open, focus it and navigate
        for (const client of windowClients) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              url: targetUrl,
              data: data,
            });
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});

// Log when service worker is ready
console.log("[SW] Service worker script loaded");
