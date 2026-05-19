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
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

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

          // Fast initial response — may overshoot on Android because
          // keyboardHeight includes the system navigation bar height.
          Keyboard.addListener("keyboardWillShow", (info) => {
            // Cancel any pending hide — keyboard reopened quickly (e.g. step transition)
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            pluginActive = true;
            setOffset(info.keyboardHeight);
          }).then((l) => cleanups.push(() => l.remove()));

          // After keyboardDidShow, refine with the visual viewport
          // measurement which is in CSS pixels. Only refine UPWARD —
          // on Android the plugin value is now authoritative because the
          // WebView extends behind the nav bar; the viewport measurement
          // may undercount if interactive-widget resizes the layout viewport.
          Keyboard.addListener("keyboardDidShow", () => {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            pluginActive = true;
            requestAnimationFrame(() => {
              if (cancelled) return;
              const vvH = measureFromViewport();
              if (vvH > 50) {
                setOffset((prev) => Math.max(prev, vvH));
              }
            });
          }).then((l) => cleanups.push(() => l.remove()));

          Keyboard.addListener("keyboardWillHide", () => {
            // Delay the reset — if the keyboard reopens within 300ms
            // (e.g. input focus switches during a step transition),
            // keyboardWillShow will cancel this timer and keep the offset.
            hideTimer = setTimeout(() => {
              pluginActive = false;
              setOffset(0);
              hideTimer = null;
            }, 300);
          }).then((l) => cleanups.push(() => l.remove()));

          Keyboard.addListener("keyboardDidHide", () => {
            // If keyboardWillHide already scheduled a delayed reset,
            // let it handle it. Only force-reset if no timer is pending.
            if (!hideTimer) {
              pluginActive = false;
              setOffset(0);
            }
          }).then((l) => cleanups.push(() => l.remove()));
        })
        .catch(() => {});

      // ── Source 2: visualViewport — secondary refinement ──────────────
      // On native, the plugin value is authoritative. The viewport
      // measurement is used only to refine upward (never reduce the
      // offset below the plugin's value, which now correctly includes
      // the nav bar since the WebView extends behind it).
      const vv = window.visualViewport;
      if (vv) {
        const vvUpdate = () => {
          const measured = measureFromViewport();
          if (measured > 50) {
            // Only increase — never shrink below the plugin's value
            setOffset((prev) => Math.max(prev, measured));
          } else if (!pluginActive) {
            // Only reset to 0 when the plugin confirms keyboard is hidden.
            setOffset(0);
          }
        };
        vv.addEventListener("resize", vvUpdate);
        vv.addEventListener("scroll", vvUpdate);
        cleanups.push(() => {
          vv.removeEventListener("resize", vvUpdate);
          vv.removeEventListener("scroll", vvUpdate);
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
      if (hideTimer) clearTimeout(hideTimer);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return offset;
}
