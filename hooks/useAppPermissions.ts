"use client";

import { useCallback, useEffect, useState } from "react";
import { isNativePlatform } from "@/utils/platform";

export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

interface AppPermissions {
  location: PermissionState;
  notifications: PermissionState;
}

interface UseAppPermissionsReturn {
  permissions: AppPermissions;
  /** True when native and at least one permission still needs prompting */
  needsPrompt: boolean;
  /** Request all pending permissions sequentially (location → notifications) */
  requestAll: () => Promise<void>;
  /** Request only location permission */
  requestLocation: () => Promise<PermissionState>;
  /** Request only notification permission */
  requestNotifications: () => Promise<PermissionState>;
  /** Whether all required permissions have been resolved (granted or denied) */
  resolved: boolean;
  /** Whether we're currently requesting permissions */
  requesting: boolean;
}

const STORAGE_KEY = "app_permissions_state";

interface PersistedState {
  /** Timestamp of last full prompt shown */
  lastPromptAt: number | null;
  /** Number of times prompt has been dismissed */
  dismissCount: number;
  /** Whether the initial permission flow has been completed */
  initialFlowDone: boolean;
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastPromptAt: null, dismissCount: 0, initialFlowDone: false };
}

function savePersistedState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Central hook for managing native app permissions (geolocation + notifications).
 * On web, all permissions return "granted" / are handled inline by existing flows.
 * On native, checks current status on mount and provides methods to request them.
 */
export function useAppPermissions(): UseAppPermissionsReturn {
  const [permissions, setPermissions] = useState<AppPermissions>({
    location: "unknown",
    notifications: "unknown",
  });
  const [requesting, setRequesting] = useState(false);
  const isNative = isNativePlatform();

  // Check current permission status on mount (native only)
  useEffect(() => {
    if (!isNative) {
      setPermissions({ location: "granted", notifications: "granted" });
      return;
    }

    (async () => {
      const [loc, notif] = await Promise.all([
        checkLocationPermission(),
        checkNotificationPermission(),
      ]);
      setPermissions({ location: loc, notifications: notif });
    })();
  }, [isNative]);

  const requestLocation = useCallback(async (): Promise<PermissionState> => {
    if (!isNative) return "granted";
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const result = await Geolocation.requestPermissions();
      const state: PermissionState =
        result.location === "granted" || result.coarseLocation === "granted"
          ? "granted"
          : "denied";
      setPermissions((p) => ({ ...p, location: state }));
      return state;
    } catch {
      setPermissions((p) => ({ ...p, location: "denied" }));
      return "denied";
    }
  }, [isNative]);

  const requestNotifications = useCallback(async (): Promise<PermissionState> => {
    if (!isNative) return "granted";
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const result = await PushNotifications.requestPermissions();
      const state: PermissionState = result.receive === "granted" ? "granted" : "denied";
      setPermissions((p) => ({ ...p, notifications: state }));
      return state;
    } catch {
      setPermissions((p) => ({ ...p, notifications: "denied" }));
      return "denied";
    }
  }, [isNative]);

  const requestAll = useCallback(async () => {
    setRequesting(true);
    try {
      // Request sequentially: location first, then notifications
      if (permissions.location === "prompt" || permissions.location === "unknown") {
        await requestLocation();
      }
      if (permissions.notifications === "prompt" || permissions.notifications === "unknown") {
        await requestNotifications();
      }
      // Mark initial flow as done
      const persisted = loadPersistedState();
      savePersistedState({
        ...persisted,
        initialFlowDone: true,
        lastPromptAt: Date.now(),
      });
    } finally {
      setRequesting(false);
    }
  }, [permissions.location, permissions.notifications, requestLocation, requestNotifications]);

  const needsPrompt =
    isNative &&
    !loadPersistedState().initialFlowDone &&
    (permissions.location === "prompt" ||
      permissions.location === "unknown" ||
      permissions.notifications === "prompt" ||
      permissions.notifications === "unknown");

  const resolved =
    !isNative ||
    ((permissions.location === "granted" || permissions.location === "denied") &&
      (permissions.notifications === "granted" || permissions.notifications === "denied"));

  return {
    permissions,
    needsPrompt,
    requestAll,
    requestLocation,
    requestNotifications,
    resolved,
    requesting,
  };
}

// ─── Internal helpers ───

async function checkLocationPermission(): Promise<PermissionState> {
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const result = await Geolocation.checkPermissions();
    if (result.location === "granted" || result.coarseLocation === "granted") return "granted";
    if (result.location === "denied") return "denied";
    return "prompt";
  } catch {
    return "unknown";
  }
}

async function checkNotificationPermission(): Promise<PermissionState> {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const result = await PushNotifications.checkPermissions();
    if (result.receive === "granted") return "granted";
    if (result.receive === "denied") return "denied";
    return "prompt";
  } catch {
    return "unknown";
  }
}

/**
 * Dismiss the permission prompt — records timestamp and count for re-prompt logic.
 */
export function dismissPermissionPrompt() {
  const persisted = loadPersistedState();
  savePersistedState({
    ...persisted,
    initialFlowDone: true,
    lastPromptAt: Date.now(),
    dismissCount: persisted.dismissCount + 1,
  });
}

/**
 * Check if we should re-prompt for denied permissions.
 * Returns true if 3+ days have elapsed since last prompt.
 */
export function shouldRePromptPermissions(): boolean {
  const persisted = loadPersistedState();
  if (!persisted.lastPromptAt) return false;
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - persisted.lastPromptAt > THREE_DAYS;
}
