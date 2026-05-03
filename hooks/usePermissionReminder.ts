"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { isNativePlatform, getNativePlatform } from "@/utils/platform";
import { shouldRePromptPermissions } from "./useAppPermissions";

interface PermissionReminderState {
  /** Whether a reminder banner should be shown */
  showReminder: boolean;
  /** Which permissions are denied */
  deniedPermissions: string[];
  /** Dismiss the reminder for this session */
  dismiss: () => void;
  /** Open device settings */
  openSettings: () => void;
}

/**
 * Hook that monitors denied permissions on native and shows a soft reminder
 * when the app resumes (after 3+ days since last prompt).
 * On web, this is a no-op.
 */
export function usePermissionReminder(): PermissionReminderState {
  const [showReminder, setShowReminder] = useState(false);
  const [deniedPermissions, setDeniedPermissions] = useState<string[]>([]);
  const checkedRef = useRef(false);
  const isNative = isNativePlatform();

  const checkPermissions = useCallback(async () => {
    if (!isNative || !shouldRePromptPermissions()) return;

    const denied: string[] = [];

    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const locStatus = await Geolocation.checkPermissions();
      if (locStatus.location !== "granted" && locStatus.coarseLocation !== "granted") {
        denied.push("Location");
      }
    } catch {}

    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const notifStatus = await PushNotifications.checkPermissions();
      if (notifStatus.receive !== "granted") {
        denied.push("Notifications");
      }
    } catch {}

    if (denied.length > 0) {
      setDeniedPermissions(denied);
      setShowReminder(true);
    }
  }, [isNative]);

  // Check on app resume via Capacitor App state change
  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      // Initial check (slightly delayed to not block render)
      if (!checkedRef.current) {
        checkedRef.current = true;
        setTimeout(() => checkPermissions(), 3000);
      }

      // Listen for app resume
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            checkPermissions();
          }
        });
        cleanup = () => listener.remove();
      } catch {}
    })();

    return () => {
      cleanup?.();
    };
  }, [isNative, checkPermissions]);

  const dismiss = useCallback(() => {
    setShowReminder(false);
  }, []);

  const openSettings = useCallback(async () => {
    try {
      const platform = getNativePlatform();
      if (platform === "ios") {
        // Opens the app's settings page on iOS
        const { App } = await import("@capacitor/app");
        // @ts-expect-error - openUrl exists on native
        await App.openUrl({ url: "app-settings:" });
      } else if (platform === "android") {
        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        // @ts-expect-error - openUrl exists on native
        await App.openUrl({ url: `package:${info.id}` });
      }
    } catch {
      // Fallback: just dismiss
    }
    setShowReminder(false);
  }, []);

  return { showReminder, deniedPermissions, dismiss, openSettings };
}
