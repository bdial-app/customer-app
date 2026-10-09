"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { registerPlugin } from "@capacitor/core";
import { getNativePlatform } from "@/utils/platform";
import { handleBackPress, hasOpenOverlay, subscribeBackStack, topOverlay } from "@/hooks/useBackDismiss";
import SwipeBackGesture from "./swipe-back-gesture";

/**
 * Native "back" for the app shell.
 *
 * Android — the back button and back gesture close what's on top (a sheet,
 * a full-screen panel, a menu, a non-Home tab) before leaving the page; then
 * go back through history; with nothing to go back to, a deeper page goes
 * Home and Home minimises the app, like any Android app.
 *
 * iOS — the real edge swipe: WKWebView's own back gesture slides the page
 * away and shows the previous one underneath (switched on in the native
 * shell). It pauses while something is open on top, so it can't go back to
 * the page behind a sheet; a full-screen panel closes with an edge swipe
 * instead, and so does a page opened directly (from a notification or link),
 * which has nothing behind it — it goes Home.
 */

interface BackGesturePlugin {
  setEnabled(options: { enabled: boolean }): Promise<void>;
  canGoBack(): Promise<{ value: boolean }>;
}
const BackGesture = registerPlugin<BackGesturePlugin>("BackGesture");

export default function BackNavigation() {
  const platform = getNativePlatform();
  const router = useRouter();
  const pathname = usePathname();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  // ── Android: back button and back gesture ──
  useEffect(() => {
    if (platform !== "android") return;
    let remove: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", ({ canGoBack }) => {
          if (handleBackPress()) return;
          if (canGoBack) return window.history.back();
          if (window.location.pathname !== "/") return routerRef.current.replace("/");
          void App.minimizeApp();
        });
        if (cancelled) listener.remove();
        else remove = () => listener.remove();
      } catch {
        // @capacitor/app not available
      }
    })();
    return () => {
      cancelled = true;
      remove?.();
    };
  }, [platform]);

  // ── iOS: native swipe-back only while nothing is open on top ──
  useEffect(() => {
    if (platform !== "ios") return;
    let last: boolean | null = null;
    const sync = () => {
      const enabled = !hasOpenOverlay();
      if (enabled === last) return;
      last = enabled;
      BackGesture.setEnabled({ enabled }).catch(() => {
        // An older app build without the plugin — nothing to switch.
      });
    };
    sync();
    return subscribeBackStack(sync);
  }, [platform]);

  // Whether the web view has a page to go back to (so its own gesture works).
  const canGoBack = useRef(true);
  useEffect(() => {
    if (platform !== "ios") return;
    const refresh = () => {
      BackGesture.canGoBack()
        .then((r) => {
          canGoBack.current = r.value;
        })
        .catch(() => {
          canGoBack.current = true; // unknown: leave it to the native gesture
        });
    };
    const t = setTimeout(refresh, 250);
    window.addEventListener("popstate", refresh);
    return () => {
      clearTimeout(t);
      window.removeEventListener("popstate", refresh);
    };
  }, [platform, pathname]);

  if (platform !== "ios") return null;

  return (
    <SwipeBackGesture
      enabled={() => {
        const top = topOverlay();
        if (top) return top.kind === "screen";
        return !canGoBack.current && window.location.pathname !== "/";
      }}
      onBack={() => {
        if (topOverlay()) handleBackPress();
        else routerRef.current.replace("/");
      }}
    />
  );
}
