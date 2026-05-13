// BUILD_ID is replaced at build time with a unique hash per deployment.
// This ensures every deploy produces a new SW file, triggering browser update detection.
const BUILD_ID = "__BUILD_ID__";
const CACHE_NAME = "tijarah-" + BUILD_ID;
const RUNTIME_CACHE = "tijarah-runtime-" + BUILD_ID;
const IMAGE_CACHE = "tijarah-images"; // images persist across deploys
const IMAGE_CACHE_MAX = 300;

// Install event - skip waiting immediately and pre-cache the offline fallback
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker, build:", BUILD_ID);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add("/offline.html")).catch(() => {})
  );
  self.skipWaiting();
});

// Activate event - purge ALL old caches (except images) so users get fresh assets
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker, build:", BUILD_ID);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep current caches and the shared image cache
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
    (url.pathname.includes("/storage/v1/object/public/") || url.pathname.includes("/storage/v1/render/image/public/"))
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

  // External requests - network only (don't cache third-party content)
  if (url.origin !== location.origin) {
    return;
  }

  // API calls - network only (real-time data should never be stale)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests (HTML pages) — always network-first
  // This ensures users always get the latest HTML on every page load
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match("/offline.html"));
        }),
    );
    return;
  }

  // Same-origin assets (JS, CSS, images) — network-first with cache fallback
  // Next.js hashed assets could be cache-first, but network-first is safer
  // and guarantees fresh content after every deploy
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => cached || Promise.reject("no-match"));
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
      case "/provider/subscription":
        targetUrl = "/provider/subscription";
        break;
      case "/provider/deals":
        targetUrl = "/provider/deals";
        break;
      case "/provider/sponsorships":
        targetUrl = "/provider/sponsorships";
        break;
      case "/provider/leads":
        targetUrl = "/provider/leads";
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
