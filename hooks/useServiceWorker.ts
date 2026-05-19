"use client";

import { useEffect, useRef } from "react";

export function useServiceWorker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

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

