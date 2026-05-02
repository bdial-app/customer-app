"use client";

import { useEffect, useRef } from "react";

export function useServiceWorker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Check for updates periodically
        intervalRef.current = setInterval(() => {
          registration?.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available — could dispatch a custom event for UI
                window.dispatchEvent(new CustomEvent("sw-update-available"));
              }
            });
          }
        });
      } catch (error) {
        // Silently fail in production — SW is enhancement, not critical
        if (process.env.NODE_ENV === "development") {
          console.error("[SW] Registration failed:", error);
        }
      }
    };

    register();

    const handleControllerChange = () => {
      // Controller changed — page will use new SW on next navigation
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

