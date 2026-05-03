"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isNativePlatform } from "@/utils/platform";
import { resolveDeepLink } from "@/utils/deep-link";

/**
 * Hook to handle deep links on native (Capacitor) via @capacitor/app.
 * - Listens for `appUrlOpen` events (universal links / app links)
 * - Checks launch URL on cold start for pending deep links
 * On web, this is a no-op.
 */
export function useDeepLinks() {
  const router = useRouter();
  const isNative = isNativePlatform();
  const processedLaunchUrl = useRef(false);

  useEffect(() => {
    if (!isNative) return;

    let cleanupUrlOpen: (() => void) | null = null;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");

        // ── Handle cold-start launch URL ──
        if (!processedLaunchUrl.current) {
          processedLaunchUrl.current = true;
          try {
            const launchUrl = await App.getLaunchUrl();
            if (launchUrl?.url) {
              const target = parseAppUrl(launchUrl.url);
              if (target && target !== "/") {
                router.push(target);
              }
            }
          } catch {}
        }

        // ── Listen for URL open events (when app is already running) ──
        const listener = await App.addListener("appUrlOpen", ({ url }) => {
          const target = parseAppUrl(url);
          if (target && target !== "/") {
            router.push(target);
          }
        });

        cleanupUrlOpen = () => listener.remove();
      } catch {
        // @capacitor/app not available
      }
    })();

    return () => {
      cleanupUrlOpen?.();
    };
  }, [isNative, router]);
}

/**
 * Parse an incoming app URL into an internal route.
 * Supports:
 * - https://tijarah.com/provider-details?id=xxx
 * - https://www.tijarah.com/...
 * - https://develop.tijarah.com/...
 * - https://uat.tijarah.com/...
 * - tijarah://provider-details?id=xxx
 * - Deep link data format used by notifications
 */
function parseAppUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/$/, "") || "/";
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Use the same deep link resolver used by notifications
    return resolveDeepLink({ route: pathname, params });
  } catch {
    // If URL parsing fails, try treating it as a path
    if (url.startsWith("/")) return url;
    return null;
  }
}
