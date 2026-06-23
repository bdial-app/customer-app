"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPendingDeepLinkTarget,
  endDeepLinkLoading,
  deepLinkTargetPathname,
} from "@/utils/deep-link";
import { TIJARAH_BADGE_DATA_URI } from "./tijarah-badge";
import { useTheme } from "@/app/context/ThemeContext";

// Match the Android-12 system-splash background per colour scheme so the
// (hard-cut) handoff system-splash → loader is seamless in both modes.
const SPLASH_BG_LIGHT = "#ededf6";
const SPLASH_BG_DARK = "#17191f";
// Spinner needs contrast against the background.
const SPINNER_LIGHT = "#2D2DA9"; // brand indigo on light
const SPINNER_DARK = "#a5b4fc"; // indigo-300 on dark

// Safety net: never keep the loader up longer than this, even if the target
// page never reports ready (an error route, a route without the ready hook,
// or a very slow network).
const MAX_VISIBLE_MS = 6000;
// Once we've landed on the target route but it hasn't signalled ready, give it
// a short grace period (it may have no ready hook) then reveal its own UI.
const ROUTE_LANDED_GRACE_MS = 2500;

/**
 * Full-screen branded loader shown during a COLD-START deep-link launch.
 *
 * It reuses the native splash image + brand background, so the handoff
 * (native splash → this loader → target page) is seamless and the user never
 * sees the brief Home flash or a blank screen while the deep-linked page boots
 * and fetches its data.
 *
 * Lifecycle: shown when `beginDeepLinkLoading()` fires (cold path of
 * useDeepLinks); hidden when the target page calls `endDeepLinkLoading()` once
 * its content is ready, or via the route-landed / max-timeout fallbacks.
 */
export default function DeepLinkLoadingScreen() {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const [target, setTarget] = useState<string | null>(() => getPendingDeepLinkTarget());

  // The "begin" event can fire after this mounts (cold start: getLaunchUrl
  // resolves asynchronously), so subscribe and re-check on mount.
  useEffect(() => {
    const onLoading = () => setTarget(getPendingDeepLinkTarget());
    const onLoaded = () => setTarget(null);
    window.addEventListener("tijarah-deeplink-loading", onLoading);
    window.addEventListener("tijarah-deeplink-loaded", onLoaded);
    const pending = getPendingDeepLinkTarget();
    if (pending) setTarget(pending);
    return () => {
      window.removeEventListener("tijarah-deeplink-loading", onLoading);
      window.removeEventListener("tijarah-deeplink-loaded", onLoaded);
    };
  }, []);

  // Hard safety timeout — always tear down after MAX_VISIBLE_MS.
  useEffect(() => {
    if (!target) return;
    const t = setTimeout(endDeepLinkLoading, MAX_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [target]);

  // Fallback: we've reached the target route but it never signalled ready
  // (e.g. a route without the ready hook) — reveal it after a short grace.
  useEffect(() => {
    if (!target) return;
    const targetPath = deepLinkTargetPathname(target);
    const here = (pathname || "/").replace(/\/+$/, "") || "/";
    if (targetPath !== "/" && here === targetPath) {
      const t = setTimeout(endDeepLinkLoading, ROUTE_LANDED_GRACE_MS);
      return () => clearTimeout(t);
    }
  }, [pathname, target]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden"
          // Matches the Android-12 system splash background per colour scheme so
          // the handoff system-splash → loader is seamless in light and dark.
          style={{ backgroundColor: isDark ? SPLASH_BG_DARK : SPLASH_BG_LIGHT }}
        >
          {/* Same badge the system splash shows, centred in the same place.
              Inlined as a data URI so it paints instantly during cold boot. The
              badge is a self-contained squircle, so it reads on either bg. */}
          <img
            src={TIJARAH_BADGE_DATA_URI}
            alt="Tijarah"
            className="h-28 w-28 rounded-[26px] shadow-lg shadow-black/10 dark:shadow-black/40"
          />
          <div
            className="absolute inset-x-0 flex justify-center"
            style={{ bottom: "max(env(safe-area-inset-bottom), 24px)", top: "auto" }}
          >
            <div
              className="h-7 w-7 animate-spin rounded-full border-[3px] border-t-transparent"
              style={{
                borderColor: isDark ? SPINNER_DARK : SPINNER_LIGHT,
                borderTopColor: "transparent",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
