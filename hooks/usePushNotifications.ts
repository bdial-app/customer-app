"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  setPermissionStatus,
  setFcmToken,
} from "@/store/slices/notificationSlice";
import {
  requestFCMToken,
  onForegroundMessage,
  getPermissionStatus,
  isMessagingSupported,
  isIOS,
  isStandalone,
} from "@/utils/firebase-messaging";
import {
  registerDevice,
  unregisterDevice,
} from "@/services/notification.service";
import { useQueryClient } from "@tanstack/react-query";
import { isNativePlatform, getNativePlatform } from "@/utils/platform";
import {
  requestNativePushToken,
  addNativePushListeners,
  getNativePermissionStatus,
} from "@/utils/capacitor-push";

/**
 * Hook to manage push notification lifecycle:
 * - Detects native (Capacitor) vs web/PWA environment
 * - On native: uses @capacitor/push-notifications for FCM/APNs
 * - On web/PWA: uses Firebase Web Messaging
 * - Registers/unregisters device tokens with the backend
 */
export function usePushNotifications() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const { permissionStatus, fcmToken } = useAppSelector((s) => s.notification);
  const isAuthenticated = useAppSelector((s) => s.auth.token !== null);
  const unsubRef = useRef<(() => void) | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const isNative = isNativePlatform();

  // Derived: iOS but not installed as PWA (only relevant for web mode)
  const isIOSNotStandalone = !isNative && isIOS() && !isStandalone();

  // ─── Check support & current permission on mount ───
  useEffect(() => {
    (async () => {
      if (isNative) {
        // Native always supports push
        const status = await getNativePermissionStatus();
        const mapped = status === "granted" ? "granted"
          : status === "denied" ? "denied"
          : "default";
        dispatch(setPermissionStatus(mapped as any));
        return;
      }

      // Web/PWA path
      if (isIOSNotStandalone) {
        dispatch(setPermissionStatus("unsupported"));
        return;
      }
      const supported = await isMessagingSupported();
      if (!supported) {
        dispatch(setPermissionStatus("unsupported"));
        return;
      }
      dispatch(setPermissionStatus(getPermissionStatus() as any));
    })();
  }, [dispatch, isIOSNotStandalone, isNative]);

  // ─── Auto-register token if permission already granted & authenticated ───
  useEffect(() => {
    if (permissionStatus === "granted" && isAuthenticated && !fcmToken) {
      (async () => {
        if (isNative) {
          const result = await requestNativePushToken();
          if (result.token) {
            dispatch(setFcmToken(result.token));
            try {
              await registerDevice(result.token, getNativePlatform(), getDeviceInfo());
            } catch (err) {
              console.warn("[Push] Failed to register device token:", err);
            }
          }
        } else {
          const result = await requestFCMToken();
          if (result.token) {
            dispatch(setFcmToken(result.token));
            try {
              await registerDevice(result.token, detectPlatform(), getDeviceInfo());
            } catch (err) {
              console.warn("[Push] Failed to register device token:", err);
            }
          }
        }
      })();
    }
  }, [permissionStatus, isAuthenticated, fcmToken, dispatch, isNative]);

  // ─── Listen for foreground messages ───
  useEffect(() => {
    if (!isAuthenticated || permissionStatus !== "granted") return;

    if (isNative) {
      // Native foreground push listener
      const cleanup = addNativePushListeners({
        onForegroundPush: (notification) => {
          qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
          qc.invalidateQueries({ queryKey: ["notifications"] });

          if (notification.title) {
            window.dispatchEvent(
              new CustomEvent("push-notification", {
                detail: {
                  title: notification.title,
                  body: notification.body,
                  data: notification.data,
                },
              })
            );
          }
        },
        onNotificationTap: (action) => {
          const data = action.notification.data || {};
          window.dispatchEvent(
            new CustomEvent("native-notification-tap", { detail: data })
          );
        },
      });
      unsubRef.current = cleanup;
    } else {
      // Web/PWA foreground push listener
      (async () => {
        const unsub = await onForegroundMessage((payload) => {
          qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
          qc.invalidateQueries({ queryKey: ["notifications"] });

          if (payload.notification?.title) {
            window.dispatchEvent(
              new CustomEvent("push-notification", {
                detail: {
                  title: payload.notification.title,
                  body: payload.notification.body,
                  data: payload.data,
                },
              })
            );
          }
        });
        unsubRef.current = unsub;
      })();
    }

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [isAuthenticated, permissionStatus, qc, isNative]);

  /**
   * Request push notification permission.
   * Call this after user interaction (e.g., from settings or soft prompt).
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setPushError(null);

    if (isNative) {
      const result = await requestNativePushToken();
      if (result.token) {
        dispatch(setPermissionStatus("granted"));
        dispatch(setFcmToken(result.token));
        try {
          await registerDevice(result.token, getNativePlatform(), getDeviceInfo());
        } catch (err) {
          console.warn("[Push] Failed to register device token:", err);
        }
        return true;
      }
      setPushError(result.error);
      const status = await getNativePermissionStatus();
      dispatch(setPermissionStatus(status === "denied" ? "denied" : "default"));
      return false;
    }

    // Web/PWA path
    const result = await requestFCMToken();
    if (result.token) {
      dispatch(setPermissionStatus("granted"));
      dispatch(setFcmToken(result.token));
      try {
        await registerDevice(result.token, detectPlatform(), getDeviceInfo());
      } catch (err) {
        console.warn("[Push] Failed to register device token:", err);
      }
      return true;
    }

    setPushError(result.error);
    dispatch(setPermissionStatus(getPermissionStatus() as any));
    return false;
  }, [dispatch, isNative]);

  /**
   * Unregister push (on logout).
   */
  const unregisterPush = useCallback(async () => {
    if (fcmToken) {
      try {
        await unregisterDevice(fcmToken);
      } catch {
        // Ignore — token may already be invalid
      }
      dispatch(setFcmToken(null));
    }
  }, [fcmToken, dispatch]);

  return {
    permissionStatus,
    fcmToken,
    pushError,
    requestPermission,
    unregisterPush,
    isSupported: permissionStatus !== "unsupported",
    isIOSNotStandalone,
  };
}

// ─── Helpers ─────────────────────────────────

function detectPlatform(): "web" | "android" | "ios" {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "web";
}

function getDeviceInfo(): Record<string, any> {
  if (typeof navigator === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    isNative: isNativePlatform(),
    nativePlatform: getNativePlatform(),
  };
}
