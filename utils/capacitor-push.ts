/**
 * Native push notification utilities using @capacitor/push-notifications.
 * Used only when running inside a Capacitor native shell (Android/iOS).
 */
import { PushNotifications, type Token, type ActionPerformed, type PushNotificationSchema } from '@capacitor/push-notifications';

export type NativePushTokenResult =
  | { token: string; error: null }
  | { token: null; error: string };

/**
 * Request native push notification permission and register for push.
 * Returns the FCM/APNs token on success.
 */
export async function requestNativePushToken(): Promise<NativePushTokenResult> {
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
      const timeout = setTimeout(() => {
        reject(new Error('Push registration timed out'));
      }, 15000);

      PushNotifications.addListener('registration', (t: Token) => {
        clearTimeout(timeout);
        resolve(t.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        clearTimeout(timeout);
        reject(new Error(err.error || 'Push registration failed'));
      });
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
 */
export function addNativePushListeners(handlers: NativePushListeners): () => void {
  const listeners: Array<{ remove: () => void }> = [];

  if (handlers.onForegroundPush) {
    const handler = handlers.onForegroundPush;
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      handler(notification);
    }).then((l) => listeners.push(l));
  }

  if (handlers.onNotificationTap) {
    const handler = handlers.onNotificationTap;
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      handler(action);
    }).then((l) => listeners.push(l));
  }

  return () => {
    listeners.forEach((l) => l.remove());
  };
}

/**
 * Remove all native push notification listeners.
 */
export async function removeAllNativeListeners(): Promise<void> {
  await PushNotifications.removeAllListeners();
}
