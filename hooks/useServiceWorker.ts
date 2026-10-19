"use client";

import { useEffect, useRef } from "react";
import { isNativePlatform } from "@/utils/platform";

/**
 * Inside the Android app the web service worker only gets in the way: the
 * app's files are already on the phone, every request went through it, and
 * when it took control it reloaded the whole app ("Loading your feed"
 * twice on first launch and after every update). iOS never runs it. So in
 * the app it isn't registered, and one left by an earlier version is
 * removed along with its caches.
 */
async function removeServiceWorker(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("tijarah-")).map((k) => caches.delete(k)));
    }
  } catch {
    // Nothing to clean up, or not allowed: the app works either way.
  }
}

export function useServiceWorker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (isNativePlatform()) {
      void removeServiceWorker();
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          // Always check the server for a new SW on every page load
          updateViaCache: "none",
        });

        // Check for updates every 60 seconds
        intervalRef.current = setInterval(() => {
          registration?.update();
        }, 60000);

        // If there's already a waiting worker (e.g. installed while user was on the page), activate it
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Listen for new SW installations
        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New SW installed and old one exists — tell it to take over immediately
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[SW] Registration failed:", error);
        }
      }
    };

    register();

    // When the new SW activates and takes control, reload for fresh assets
    const handleControllerChange = () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);
}

