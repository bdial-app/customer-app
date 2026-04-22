"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "✓ Service Worker registered successfully:",
              registration,
            );

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
          })
          .catch((error) => {
            console.log("✗ Service Worker registration failed:", error);
          });

        // Listen for updates
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("Service Worker updated");
          // Show update notification to user if needed
        });
      });
    }
  }, []);
}
