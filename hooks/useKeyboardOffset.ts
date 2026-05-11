"use client";

import { useState, useEffect } from "react";
import { isNativePlatform } from "@/utils/platform";

/**
 * Returns the current software-keyboard height in CSS pixels.
 *
 * Strategy (native Capacitor with KeyboardResize.None):
 *  1. `keyboardWillShow` — immediate response from the plugin.
 *  2. `keyboardDidShow`  — refine the value with a visualViewport
 *     measurement that is in CSS coordinates (fixes Android gap where
 *     the plugin height includes the system navigation bar).
 *  3. visualViewport `resize`/`scroll` — fallback for iOS if the
 *     Capacitor keyboard events never fire.
 *
 * On web / PWA the hook relies on the visualViewport API exclusively.
 */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    let cancelled = false;
    let pluginActive = false; // true while the plugin says keyboard is open

    /** CSS-coordinate keyboard height derived from the visual viewport. */
    const measureFromViewport = (): number => {
      const vv = window.visualViewport;
      if (!vv) return 0;
      return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    };

    if (isNativePlatform()) {
      // ── Source 1: Capacitor Keyboard plugin ─────────────────────────
      import("@capacitor/keyboard")
        .then(({ Keyboard }) => {
          if (cancelled) return;

          // Fast initial response (may over-shoot on Android)
          Keyboard.addListener("keyboardWillShow", (info) => {
            pluginActive = true;
            setOffset(info.keyboardHeight);
          }).then((l) => cleanups.push(() => l.remove()));

          // Once the keyboard is fully visible the visual-viewport has
          // settled — prefer its measurement (CSS-accurate).
          Keyboard.addListener("keyboardDidShow", (info) => {
            pluginActive = true;
            const vvH = measureFromViewport();
            setOffset(vvH > 50 ? vvH : info.keyboardHeight);
          }).then((l) => cleanups.push(() => l.remove()));

          Keyboard.addListener("keyboardWillHide", () => {
            pluginActive = false;
            setOffset(0);
          }).then((l) => cleanups.push(() => l.remove()));

          Keyboard.addListener("keyboardDidHide", () => {
            pluginActive = false;
            setOffset(0);
          }).then((l) => cleanups.push(() => l.remove()));
        })
        .catch(() => {});

      // ── Source 2: visualViewport fallback ────────────────────────────
      // Covers iOS edge-cases where Capacitor events may not fire.
      const vv = window.visualViewport;
      if (vv) {
        const vvFallback = () => {
          if (pluginActive) return; // plugin is already handling it
          setOffset(measureFromViewport());
        };
        vv.addEventListener("resize", vvFallback);
        vv.addEventListener("scroll", vvFallback);
        cleanups.push(() => {
          vv.removeEventListener("resize", vvFallback);
          vv.removeEventListener("scroll", vvFallback);
        });
      }
    } else {
      // ── Web / PWA: visualViewport only ──────────────────────────────
      const vv = window.visualViewport;
      if (!vv) return;

      const update = () => setOffset(measureFromViewport());
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
      cleanups.push(() => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      });
    }

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return offset;
}
