"use client";
import { useEffect } from "react";

/**
 * Manages StatusBar appearance on native platforms.
 * On web, this is a no-op (safe to call anywhere).
 */
export function useStatusBar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).Capacitor?.isNativePlatform?.()) return;

    // Dynamic import to avoid bundling native-only code for web
    import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      // Set status bar to dark content (dark text on light background)
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      // Set background color to match app theme
      StatusBar.setBackgroundColor({ color: "#F59E0B" }).catch(() => {});
      // Ensure status bar is visible
      StatusBar.show().catch(() => {});
    });
  }, []);
}
