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

/**
 * Hook to manage push notification lifecycle:
 * - Checks support & permission status on mount
 * - Provides requestPermission() to trigger the permission flow
 * - Handles foreground message display via in-app toast
 * - Registers/unregisters device tokens with the backend
 */
export function usePushNotifications() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const { permissionStatus, fcmToken } = useAppSelector((s) => s.notification);
  const isAuthenticated = useAppSelector((s) => s.auth.token !== null);
  const unsubRef = useRef<(() => void) | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Derived: iOS but not installed as PWA
  const isIOSNotStandalone = isIOS() && !isStandalone();

  // Check support & current permission on mount
  useEffect(() => {
    (async () => {
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
  }, [dispatch, isIOSNotStandalone]);

  // Auto-register token if permission already granted & authenticated
  useEffect(() => {
    if (permissionStatus === "granted" && isAuthenticated && !fcmToken) {
      (async () => {
        const result = await requestFCMToken();
        if (result.token) {
          dispatch(setFcmToken(result.token));
          try {
            await registerDevice(result.token, detectPlatform(), getDeviceInfo());
          } catch (err) {
            console.warn("[Push] Failed to register device token:", err);
          }
        }
      })();
    }
  }, [permissionStatus, isAuthenticated, fcmToken, dispatch]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isAuthenticated || permissionStatus !== "granted") return;

    (async () => {
      const unsub = await onForegroundMessage((payload) => {
        // Refresh unread count
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

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [isAuthenticated, permissionStatus, qc]);

  /**
   * Request push notification permission.
   * Call this after user interaction (e.g., from settings or soft prompt).
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setPushError(null);
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

    // Show the error to the user
    setPushError(result.error);
    dispatch(setPermissionStatus(getPermissionStatus() as any));
    return false;
  }, [dispatch]);

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
  };
}
