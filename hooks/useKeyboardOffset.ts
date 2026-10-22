"use client";

import { useState, useEffect } from "react";
import { isNativePlatform } from "@/utils/platform";

/**
 * Returns the current software-keyboard height in CSS pixels.
 *
 * Native (Capacitor): the Keyboard plugin's height, minus however much the
 * WebView itself shrank for the keyboard (Android's SystemBars pads the
 * window by it) — i.e. only the part of the page the keyboard still covers.
 * visualViewport is the fallback if the plugin's events never fire (iOS).
 *
 * On web / PWA the hook relies on the visualViewport API exclusively.
 */
/**
 * The WebView's height with no keyboard, shared by every caller and tracked
 * from the first use (app start, keyboard closed): the tallest it has been at
 * the current width. On Android the keyboard's shrink reaches the page as a
 * window resize *before* the plugin's keyboardWillShow, so a resize must never
 * lower it — only a change of width (rotation) starts over.
 */
const view = { fullWidth: 0, fullHeight: 0, webViewResizes: false, tracking: false };
function trackFullHeight() {
  if (view.tracking || typeof window === "undefined") return;
  view.tracking = true;
  const measure = () => {
    if (window.innerWidth !== view.fullWidth) {
      view.fullWidth = window.innerWidth;
      view.fullHeight = window.innerHeight;
    } else {
      view.fullHeight = Math.max(view.fullHeight, window.innerHeight);
    }
  };
  measure();
  // Registered first, so it runs before any hook's own resize handler.
  window.addEventListener("resize", measure);
}

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
      // The plugin reports the whole keyboard. But Capacitor's SystemBars
      // (Android, edge-to-edge) pads the window by the keyboard, so the
      // WebView itself shrinks to end above it — then only what's left
      // uncovered counts, or sheets lift twice and float mid-screen.
      // So: plugin height minus how much the WebView shrank.
      let pluginHeight = 0;
      trackFullHeight();

      const covered = () => {
        // Shrunk for the keyboard: the page already ends above it. (On older
        // WebViews it shrinks by the keyboard minus the nav bar it was already
        // padded for, so don't subtract — any remainder would be a gap.)
        if (view.fullHeight - window.innerHeight > 50) {
          view.webViewResizes = true;
          return 0;
        }
        return Math.round(pluginHeight);
      };

      const onWindowResize = () => {
        if (pluginActive) setOffset(covered());
      };
      window.addEventListener("resize", onWindowResize);
      cleanups.push(() => window.removeEventListener("resize", onWindowResize));

      // ── Source 1: Capacitor Keyboard plugin ─────────────────────────
      import("@capacitor/keyboard")
        .then(({ Keyboard }) => {
          if (cancelled) return;

          Keyboard.addListener("keyboardWillShow", (info) => {
            // Cancel any pending hide — keyboard reopened quickly (e.g. step transition)
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            pluginActive = true;
            pluginHeight = info.keyboardHeight;
            // The WebView hasn't shrunk yet; if it will, don't lift at all.
            setOffset(view.webViewResizes ? 0 : covered());
          }).then((l) => cleanups.push(() => l.remove()));

          Keyboard.addListener("keyboardDidShow", (info) => {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            pluginActive = true;
            pluginHeight = info.keyboardHeight;
            requestAnimationFrame(() => {
              if (!cancelled) setOffset(covered());
            });
          }).then((l) => cleanups.push(() => l.remove()));

          Keyboard.addListener("keyboardWillHide", () => {
            // Delay the reset — if the keyboard reopens within 300ms
            // (e.g. input focus switches during a step transition),
            // keyboardWillShow will cancel this timer and keep the offset.
            hideTimer = setTimeout(() => {
              pluginActive = false;
              pluginHeight = 0;
              setOffset(0);
              hideTimer = null;
            }, 300);
          }).then((l) => cleanups.push(() => l.remove()));

          Keyboard.addListener("keyboardDidHide", () => {
            // If keyboardWillHide already scheduled a delayed reset,
            // let it handle it. Only force-reset if no timer is pending.
            if (!hideTimer) {
              pluginActive = false;
              pluginHeight = 0;
              setOffset(0);
            }
          }).then((l) => cleanups.push(() => l.remove()));
        })
        .catch(() => {});

      // ── Source 2: visualViewport — iOS fallback ─────────────────────
      // If the plugin's events never fire, the visual viewport still shows
      // the keyboard (it measures only what's covered, so it can't double).
      const vv = window.visualViewport;
      if (vv) {
        const vvUpdate = () => {
          if (pluginActive) return;
          const measured = measureFromViewport();
          setOffset(measured > 50 ? measured : 0);
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
      // (layoutWrapper switches the browser to interactive-widget=
      // resizes-visual, so the keyboard shrinks the visual viewport.)
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

