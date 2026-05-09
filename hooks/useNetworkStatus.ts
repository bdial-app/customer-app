"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
}

/**
 * Detects online/offline state and provides reactive status.
 * Uses @capacitor/network on native for reliable detection,
 * falls back to browser online/offline events on web.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    // Use Capacitor Network plugin on native for reliable detection
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      import("@capacitor/network").then(({ Network }) => {
        // Get initial status
        Network.getStatus().then((status) => {
          setIsOnline(status.connected);
        });

        // Listen for changes
        const listener = Network.addListener("networkStatusChange", (status) => {
          if (status.connected) {
            handleOnline();
          } else {
            handleOffline();
          }
        });

        cleanupRef.current = () => {
          listener.then((l) => l.remove());
        };
      });
    } else {
      // Web fallback
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      cleanupRef.current = () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [handleOnline, handleOffline]);

  return { isOnline };
}
