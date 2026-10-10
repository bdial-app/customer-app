"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import apiClient from "@/utils/axios";
import { getNativePlatform, isNativePlatform } from "@/utils/platform";
import { getItemSync, setItemSync } from "@/utils/storage";

interface AppVersionInfo {
  latestVersion: string;
  minSupportedVersion: string;
  currentVersion: string | null;
  updateAvailable: boolean;
  forceUpdate: boolean;
  updateUrl: string;
  releaseNotes: string | null;
}

const FALLBACK_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
// Switching back to the app is the moment a forced update most needs to land —
// people leave it in the background for days — but not on every app switch.
const RESUME_MIN_GAP = 10 * 60 * 1000;
const DISMISS_KEY = "update-dismissed-version";

/**
 * The version of the installed binary: what the store actually shipped.
 *
 * NEXT_PUBLIC_APP_VERSION was used before, but it is set by hand and was 1.0.0
 * in every build while the stores shipped 1.0.03 and 1.0.2, so every install
 * reported 1.0.0. A minimum version above that would have blocked people who
 * had already updated, and kept blocking them after they updated again.
 */
export async function getInstalledVersion(): Promise<string> {
  if (!isNativePlatform()) return FALLBACK_VERSION;
  try {
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    return info.version || FALLBACK_VERSION;
  } catch {
    return FALLBACK_VERSION;
  }
}

/**
 * The version version-management lists as current for this platform — the
 * display fallback when the native binary can't report its own (web/PWA, or a
 * failed bridge call). Not used for update checks: that would hide updates.
 */
async function getManagedVersion(): Promise<string | null> {
  try {
    const native = getNativePlatform();
    const isIos = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const platform = native !== "web" ? native : isIos ? "ios" : "android";
    const { data } = await apiClient.get<AppVersionInfo>("/health/app-version", {
      params: { platform },
    });
    return data.latestVersion || null;
  } catch {
    return null;
  }
}

/**
 * The installed version for display, with the store build number when native
 * ("1.0.7 (11)"). Falls back to version-management's version when the binary
 * can't report one, then to the build-time value.
 */
export function useInstalledVersion(): string {
  const [version, setVersion] = useState(FALLBACK_VERSION);
  useEffect(() => {
    let live = true;
    (async () => {
      let label: string | null = null;
      if (isNativePlatform()) {
        try {
          const { App } = await import("@capacitor/app");
          const { version: v, build } = await App.getInfo();
          if (v) label = build ? `${v} (${build})` : v;
        } catch {
          // fall through to version-management
        }
      }
      if (!label) label = (await getManagedVersion()) || FALLBACK_VERSION;
      if (live) setVersion(label);
    })();
    return () => {
      live = false;
    };
  }, []);
  return version;
}

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastCheck = useRef(0);

  const checkForUpdate = useCallback(async () => {
    // Only an installed app updates from a store. A browser already runs the
    // newest web build, and its user agent would otherwise pass for a phone.
    if (!isNativePlatform()) return;
    const platform = getNativePlatform();
    if (platform === "web") return;
    lastCheck.current = Date.now();
    try {
      const currentVersion = await getInstalledVersion();
      const { data } = await apiClient.get<AppVersionInfo>("/health/app-version", {
        params: { platform, currentVersion },
      });
      setUpdateInfo(data);

      // A dismissed prompt stays dismissed for that version, unless it has
      // since become required.
      const dismissed = getItemSync(DISMISS_KEY);
      setIsDismissed(dismissed === data.latestVersion && !data.forceUpdate);
    } catch {
      // Silently fail — update check is non-critical
    }
  }, []);

  useEffect(() => {
    // Initial check after short delay (don't block app startup)
    const timeout = setTimeout(checkForUpdate, 5000);
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL);

    let removeResume: (() => void) | null = null;
    let cancelled = false;
    if (isNativePlatform()) {
      import("@capacitor/app")
        .then(({ App }) =>
          App.addListener("appStateChange", ({ isActive }) => {
            if (isActive && Date.now() - lastCheck.current > RESUME_MIN_GAP) checkForUpdate();
          }),
        )
        .then((handle) => {
          if (cancelled) handle.remove();
          else removeResume = () => handle.remove();
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      clearInterval(interval);
      removeResume?.();
    };
  }, [checkForUpdate]);

  const dismiss = useCallback(() => {
    if (updateInfo) {
      setItemSync(DISMISS_KEY, updateInfo.latestVersion);
    }
    setIsDismissed(true);
  }, [updateInfo]);

  const showUpdatePrompt =
    updateInfo?.updateAvailable === true && !isDismissed;
  const isForceUpdate = updateInfo?.forceUpdate === true;

  return {
    updateInfo,
    showUpdatePrompt,
    isForceUpdate,
    dismiss,
  };
}
