"use client";
import { useEffect, useState, useCallback } from "react";
import apiClient from "@/utils/axios";
import { useNativePlatform } from "./useNativePlatform";

interface AppVersionInfo {
  latestVersion: string;
  minSupportedVersion: string;
  currentVersion: string | null;
  updateAvailable: boolean;
  forceUpdate: boolean;
  updateUrl: string;
  releaseNotes: string | null;
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const DISMISS_KEY = "update-dismissed-version";

export function useAppUpdate() {
  const { platform } = useNativePlatform();
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const { data } = await apiClient.get<AppVersionInfo>("/health/app-version", {
        params: { platform, currentVersion: APP_VERSION },
      });
      setUpdateInfo(data);

      // Check if user already dismissed this version
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed === data.latestVersion && !data.forceUpdate) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      // Silently fail — update check is non-critical
    }
  }, [platform]);

  useEffect(() => {
    // Initial check after short delay (don't block app startup)
    const timeout = setTimeout(checkForUpdate, 5000);
    // Periodic check
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  const dismiss = useCallback(() => {
    if (updateInfo) {
      localStorage.setItem(DISMISS_KEY, updateInfo.latestVersion);
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
    currentVersion: APP_VERSION,
  };
}
