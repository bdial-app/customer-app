"use client";

import { useState, useEffect } from "react";
import { isNativePlatform, getNativePlatform } from "@/utils/platform";

/**
 * Returns the current software keyboard height in pixels.
 * - On Capacitor native: uses @capacitor/keyboard events (reliable on Android + iOS)
 * - On web/PWA: uses visualViewport API as fallback
 *
 * On Android with Keyboard.resize = 'none', the reported keyboardHeight
 * may include the system navigation bar. We subtract the bottom safe area
 * to avoid a gap between the keyboard and the sheet.
 */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // ── Native Capacitor: use Keyboard plugin (most reliable) ──
    if (isNativePlatform()) {
      let showCleanup: { remove: () => void } | null = null;
      let hideCleanup: { remove: () => void } | null = null;
      let cancelled = false;
      const platform = getNativePlatform();

      import("@capacitor/keyboard").then(({ Keyboard }) => {
        if (cancelled) return;

        Keyboard.addListener("keyboardWillShow", (info) => {
          let height = info.keyboardHeight;
          // On Android, subtract the bottom safe area (navigation bar) to avoid
          // a gap between keyboard and sheet — the safe area is already handled
          // by the CSS env(safe-area-inset-bottom) on the sheets.
          if (platform === "android") {
            const safeBottom = parseInt(
              getComputedStyle(document.documentElement)
                .getPropertyValue("--sab") || "0",
              10,
            );
            // Also try the CSS env value via a measurement element
            if (!safeBottom) {
              const el = document.createElement("div");
              el.style.cssText = "position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden";
              document.body.appendChild(el);
              const measured = el.offsetHeight;
              document.body.removeChild(el);
              if (measured > 0) height = Math.max(0, height - measured);
            } else {
              height = Math.max(0, height - safeBottom);
            }
          }
          setOffset(height);
        }).then((l) => { showCleanup = l; });

        Keyboard.addListener("keyboardWillHide", () => {
          setOffset(0);
        }).then((l) => { hideCleanup = l; });
      }).catch(() => {});

      return () => {
        cancelled = true;
        showCleanup?.remove();
        hideCleanup?.remove();
      };
    }

    // ── Web / PWA fallback: visualViewport API ──
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kb = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(Math.max(0, kb));
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return offset;
}
