"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          console.log("[PWA] Attempting to register service worker...");

          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            },
          );

          console.log(
            "✓ Service Worker registered successfully:",
            registration,
          );

          if (registration.waiting) {
            console.log("✓ Service Worker already active");
          }

          if (registration.installing) {
            console.log("⏳ Service Worker is installing...");
          }

          if (registration.active) {
            console.log("✓ Service Worker is active");
          }

          // Check for updates periodically
          const updateInterval = setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            console.log("Update found for Service Worker");
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log(
                    "New Service Worker available, prompt user to refresh",
                  );
                }
              });
            }
          });

          return () => clearInterval(updateInterval);
        } catch (error) {
          console.error("✗ Service Worker registration failed:", error);
          if (error instanceof Error) {
            console.error("Error details:", error.message);
          }
        }
      });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("✓ Service Worker controller changed (updated)");
      });
    } else {
      console.warn("⚠️ Service Worker not supported in this browser");
    }
  }, []);
}
