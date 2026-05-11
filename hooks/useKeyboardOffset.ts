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

          // Fast initial response — may overshoot on Android because
          // keyboardHeight includes the system navigation bar height.
          Keyboard.addListener("keyboardWillShow", (info) => {
            pluginActive = true;
            setOffset(info.keyboardHeight);
          }).then((l) => cleanups.push(() => l.remove()));

          // On Android, visualViewport hasn't settled yet when this event
          // fires. Defer one animation frame so the viewport is accurate
          // before we measure. The vv "resize" listener below will also
          // fire and converge to the same value.
          Keyboard.addListener("keyboardDidShow", () => {
            pluginActive = true;
            requestAnimationFrame(() => {
              if (cancelled) return;
              const vvH = measureFromViewport();
              if (vvH > 50) setOffset(vvH);
            });
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

      // ── Source 2: visualViewport — always authoritative ──────────────
      // Always let the visual viewport override the plugin's rough
      // estimate. On Android the plugin overshoots (includes the nav bar);
      // the vv resize event fires with the correct CSS value once the
      // keyboard animation finishes. On iOS the two sources agree, so
      // removing the `pluginActive` guard has no effect there.
      const vv = window.visualViewport;
      if (vv) {
        const vvUpdate = () => {
          const measured = measureFromViewport();
          if (measured > 50) {
            setOffset(measured);
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
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return offset;
}
