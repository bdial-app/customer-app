import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";
import { getFirebaseApp } from "./firebase";

let messagingInstance: Messaging | null = null;

/**
 * Check if Firebase Messaging is supported in this browser.
 */
export async function isMessagingSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Get the Firebase Messaging instance (singleton).
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;

  const supported = await isMessagingSupported();
  if (!supported) return null;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error("Failed to get messaging instance:", error);
    return null;
  }
}

/**
 * Request notification permission and get the FCM registration token.
 * Returns the token string, or null if permission denied / unsupported.
 */
export async function requestFCMToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VAPID key not configured — cannot get FCM token");
      return null;
    }

    // Use existing service worker registration
    const swRegistration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    return token;
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
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
