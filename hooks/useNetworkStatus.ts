"use client";
import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  /** Time (ms) since last disconnect, or null if never disconnected */
  offlineDuration: number | null;
}

/**
 * Detects online/offline state and provides reactive status.
 * Also tracks whether the app was recently offline (for showing reconnection toasts).
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null);

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
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, offlineDuration };
}
