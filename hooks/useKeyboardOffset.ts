"use client";

import { useState, useEffect } from "react";
import { isNativePlatform } from "@/utils/platform";

/**
 * Returns the current software keyboard height in pixels.
 * - On Capacitor native: uses @capacitor/keyboard events (reliable on Android + iOS)
 * - On web/PWA: uses visualViewport API as fallback
 */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // ── Native Capacitor: use Keyboard plugin (most reliable) ──
    if (isNativePlatform()) {
      let showCleanup: { remove: () => void } | null = null;
      let hideCleanup: { remove: () => void } | null = null;
      let cancelled = false;

      import("@capacitor/keyboard").then(({ Keyboard }) => {
        if (cancelled) return;

        Keyboard.addListener("keyboardWillShow", (info) => {
          setOffset(info.keyboardHeight);
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
