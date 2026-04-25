import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";
import { getFirebaseApp } from "./firebase";

let messagingInstance: Messaging | null = null;

// ─── iOS / PWA helpers ────────────────────────

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * Check if the browser natively supports push notifications.
 * Falls back to a manual API check when Firebase's isSupported() fails
 * (common on iOS PWA due to IndexedDB quirks).
 */
export async function isMessagingSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // iOS requires standalone PWA mode for push
  if (isIOS() && !isStandalone()) {
    console.log("[Push] iOS detected but not in standalone PWA mode");
    return false;
  }

  try {
    const firebaseSupported = await isSupported();
    if (firebaseSupported) return true;
  } catch (err) {
    console.warn("[Push] Firebase isSupported() threw:", err);
  }

  // Manual fallback — check the essential APIs directly
  const hasNotification = "Notification" in window;
  const hasSW = "serviceWorker" in navigator;
  const hasPush = "PushManager" in window;
  const manualSupported = hasNotification && hasSW && hasPush;
  console.log("[Push] Manual support check:", { hasNotification, hasSW, hasPush });
  return manualSupported;
}

/**
 * Get the Firebase Messaging instance (singleton).
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error("[Push] Failed to get messaging instance:", error);
    return null;
  }
}

/**
 * Ensure the service worker is registered and ready.
 * Adds a timeout to avoid hanging forever on iOS.
 */
async function waitForServiceWorker(timeoutMs = 10_000): Promise<ServiceWorkerRegistration> {
  // If no SW registered yet, register it now
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Service worker ready timeout")), timeoutMs)
    ),
  ]);
}

export type FCMTokenResult =
  | { token: string; error: null }
  | { token: null; error: string };

/**
 * Request notification permission and get the FCM registration token.
 * On iOS, Notification.requestPermission() is called FIRST to preserve
 * the user-gesture context (async Firebase init can break it).
 */
export async function requestFCMToken(): Promise<FCMTokenResult> {
  try {
    // ── 1. Quick environment checks ──
    if (typeof window === "undefined" || !("Notification" in window)) {
      return { token: null, error: "Notifications are not supported in this browser." };
    }

    if (isIOS() && !isStandalone()) {
      return {
        token: null,
        error: "On iOS, push notifications only work when the app is added to your Home Screen. Open this app from the Home Screen icon and try again.",
      };
    }

    // ── 2. Request permission FIRST (must stay in user-gesture call stack) ──
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        token: null,
        error: permission === "denied"
          ? "Notification permission was blocked. Please enable it in your browser or device settings."
          : "Notification permission was dismissed. Please try again.",
      };
    }

    // ── 3. VAPID key ──
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      return { token: null, error: "Push notification configuration is missing (VAPID key)." };
    }

    // ── 4. Service worker ──
    let swRegistration: ServiceWorkerRegistration;
    try {
      swRegistration = await waitForServiceWorker();
    } catch (err) {
      console.error("[Push] Service worker not ready:", err);
      return { token: null, error: "Service worker failed to activate. Try refreshing the page." };
    }

    // ── 5. Firebase Messaging + token ──
    const messaging = await getMessagingInstance();
    if (!messaging) {
      return { token: null, error: "Failed to initialise push notification service. Try refreshing the page." };
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      return { token: null, error: "Failed to obtain a push token. Please try again." };
    }

    return { token, error: null };
  } catch (error: any) {
    console.error("[Push] requestFCMToken error:", error);
    const msg = error?.message || String(error);

    if (msg.includes("messaging/permission-blocked")) {
      return { token: null, error: "Notification permission is blocked. Please enable it in your browser settings." };
    }
    if (msg.includes("messaging/failed-service-worker-registration")) {
      return { token: null, error: "Service worker registration failed. Try refreshing the page." };
    }

    return { token: null, error: `Push setup failed: ${msg}` };
  }
}

/**
 * Listen for foreground messages.
 * Returns an unsubscribe function.
 */
export async function onForegroundMessage(
  callback: (payload: any) => void
): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

/**
 * Get current notification permission status.
 */
export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
