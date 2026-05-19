"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Navigation depth is stored in sessionStorage so it survives component
 * remounts (tab switches, page transitions) but resets when the tab closes.
 * This is critical on Capacitor/PWA where the shell is long-lived.
 */
const NAV_DEPTH_KEY = "__nav_depth";

function getDepth(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(sessionStorage.getItem(NAV_DEPTH_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function setDepth(n: number) {
  try {
    sessionStorage.setItem(NAV_DEPTH_KEY, String(Math.max(0, n)));
  } catch {
    // SSR or storage full — silently ignore
  }
}

/**
 * Call this on every client-side route change (pathname change).
 * Should be invoked from a single central place (e.g. LayoutWrapper).
 */
export function trackNavigation() {
  setDepth(getDepth() + 1);
}

/**
 * Safe back-navigation hook.
 *
 * - If the user has navigated at least once within the app → `router.back()`
 * - Otherwise → `router.replace(fallback)` to avoid exiting the PWA/native shell
 *
 * Works reliably across component remounts (sessionStorage-backed).
 * Compatible with Capacitor native back button (which uses window.history.back() directly).
 *
 * Usage:
 *   const { goBack } = useBackNavigation();
 *   <button onClick={() => goBack("/")} />
 */
export function useBackNavigation() {
  const router = useRouter();

  const goBack = useCallback(
    (fallbackRoute: string = "/") => {
      const depth = getDepth();
      if (depth > 0) {
        setDepth(depth - 1);
        router.back();
      } else {
        // Use replace so the fallback doesn't create a new history entry
        router.replace(fallbackRoute);
      }
    },
    [router],
  );

  return { goBack };
}
