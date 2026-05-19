"use client";
import { useEffect } from "react";

/**
 * Manages StatusBar appearance on native platforms.
 * Adapts to dark/light mode. On web, this is a no-op.
 */
export function useStatusBar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).Capacitor?.isNativePlatform?.()) return;

    const applyStatusBar = async () => {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      const isDark = document.documentElement.classList.contains("dark");

      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? "#0f172a" : "#F59E0B" }).catch(() => {});
      StatusBar.show().catch(() => {});
    };

    // Apply on mount
    applyStatusBar();

    // Re-apply when theme changes (watch for class toggle on <html>)
    const observer = new MutationObserver(() => applyStatusBar());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);
}
