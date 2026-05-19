/**
 * Native push notification utilities using @capacitor/push-notifications.
 * Used only when running inside a Capacitor native shell (Android/iOS).
 */
import { PushNotifications, type Token, type ActionPerformed, type PushNotificationSchema } from '@capacitor/push-notifications';

export type NativePushTokenResult =
  | { token: string; error: null }
  | { token: null; error: string };

// Singleton in-flight promise to prevent duplicate concurrent token requests
let _tokenRequestInFlight: Promise<NativePushTokenResult> | null = null;

/**
 * Request native push notification permission and register for push.
 * Returns the FCM/APNs token on success.
 * Deduplicates concurrent calls — only one registration runs at a time.
 */
export async function requestNativePushToken(): Promise<NativePushTokenResult> {
  if (_tokenRequestInFlight) return _tokenRequestInFlight;

  _tokenRequestInFlight = _doRequestNativePushToken();
  try {
    return await _tokenRequestInFlight;
  } finally {
    _tokenRequestInFlight = null;
  }
}

async function _doRequestNativePushToken(): Promise<NativePushTokenResult> {
  try {
    // Check current permission status
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'denied') {
      return {
        token: null,
        error: 'Notification permission was denied. Please enable it in your device settings.',
      };
    }

    // Request permission if not yet granted
    if (permStatus.receive !== 'granted') {
      const requestResult = await PushNotifications.requestPermissions();
      if (requestResult.receive !== 'granted') {
        return {
          token: null,
          error: 'Notification permission was not granted.',
        };
      }
    }

    // Register with FCM/APNs — this triggers the 'registration' event
    await PushNotifications.register();

    // Wait for the registration event to fire with the token
    const token = await new Promise<string>((resolve, reject) => {
      let regListener: { remove: () => void } | null = null;
      let errListener: { remove: () => void } | null = null;

      const cleanup = () => {
        regListener?.remove();
        errListener?.remove();
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Push registration timed out'));
      }, 15000);

      PushNotifications.addListener('registration', (t: Token) => {
        clearTimeout(timeout);
        cleanup();
        resolve(t.value);
      }).then((l) => { regListener = l; });

      PushNotifications.addListener('registrationError', (err) => {
        clearTimeout(timeout);
        cleanup();
        reject(new Error(err.error || 'Push registration failed'));
      }).then((l) => { errListener = l; });
    });

    return { token, error: null };
  } catch (error: any) {
    console.error('[NativePush] requestNativePushToken error:', error);
    return { token: null, error: error?.message || 'Native push setup failed' };
  }
}

/**
 * Get current native push permission status.
 */
export async function getNativePermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> {
  try {
    const result = await PushNotifications.checkPermissions();
    return result.receive;
  } catch {
    return 'prompt';
  }
}

export type NativePushListeners = {
  onForegroundPush?: (notification: PushNotificationSchema) => void;
  onNotificationTap?: (notification: ActionPerformed) => void;
};

/**
 * Register listeners for native push events.
 * Returns a cleanup function to remove all listeners.
 * Handles the async nature of addListener — if cleanup is called before
 * listeners are registered, they are removed as soon as they resolve.
 */
export function addNativePushListeners(handlers: NativePushListeners): () => void {
  let cleaned = false;
  const listeners: Array<{ remove: () => void }> = [];

  const trackListener = (promise: Promise<{ remove: () => void }>) => {
    promise.then((l) => {
      if (cleaned) {
        l.remove();
      } else {
        listeners.push(l);
      }
    });
  };

  if (handlers.onForegroundPush) {
    const handler = handlers.onForegroundPush;
    trackListener(
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        handler(notification);
      })
    );
  }

  if (handlers.onNotificationTap) {
    const handler = handlers.onNotificationTap;
    trackListener(
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        handler(action);
      })
    );
  }

  return () => {
    cleaned = true;
    listeners.forEach((l) => l.remove());
  };
}

/**
 * Remove all native push notification listeners.
 */
export async function removeAllNativeListeners(): Promise<void> {
  await PushNotifications.removeAllListeners();
}
