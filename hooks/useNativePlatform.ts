import { useMemo } from "react";

type Platform = "ios" | "android" | "web";
type Runtime = "capacitor" | "pwa" | "browser";

interface NativePlatformInfo {
  platform: Platform;
  runtime: Runtime;
  isNative: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
}

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "web";
}

function detectRuntime(): Runtime {
  if (typeof window === "undefined") return "browser";
  // Capacitor injects this global
  if ((window as any).Capacitor?.isNativePlatform?.()) return "capacitor";
  // Standalone PWA mode
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  ) {
    return "pwa";
  }
  return "browser";
}

export function useNativePlatform(): NativePlatformInfo {
  return useMemo(() => {
    const platform = detectPlatform();
    const runtime = detectRuntime();
    return {
      platform,
      runtime,
      isNative: runtime === "capacitor",
      isPWA: runtime === "pwa",
      isIOS: platform === "ios" && runtime === "capacitor",
      isAndroid: platform === "android" && runtime === "capacitor",
      isMobile: platform === "ios" || platform === "android",
    };
  }, []);
}
