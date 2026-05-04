"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  /** Time (ms) since last disconnect, or null if never disconnected */
  offlineDuration: number | null;
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
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (offlineSince) {
      setOfflineDuration(Date.now() - offlineSince);
      setOfflineSince(null);
    }
    setWasOffline(true);
    // Clear "was offline" flag after 5s
    setTimeout(() => setWasOffline(false), 5000);
  }, [offlineSince]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setOfflineSince(Date.now());
  }, []);

  useEffect(() => {
    // Use Capacitor Network plugin on native for reliable detection
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      import("@capacitor/network").then(({ Network }) => {
        // Get initial status
        Network.getStatus().then((status) => {
          setIsOnline(status.connected);
          if (!status.connected) setOfflineSince(Date.now());
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

  return { isOnline, wasOffline, offlineDuration };
}
