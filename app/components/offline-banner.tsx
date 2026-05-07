"use client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { memo } from "react";

const OfflineBanner = memo(function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        !isOnline
          ? "translate-y-0 opacity-100"
          : wasOffline
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
      }`}
      style={{ paddingTop: "max(var(--sat,0px), 0px)" }}
    >
      <div
        className={`px-4 py-2.5 text-center text-xs font-semibold ${
          !isOnline
            ? "bg-red-500 text-white"
            : "bg-emerald-500 text-white"
        }`}
      >
        {!isOnline ? (
          <span className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            No internet connection
          </span>
        ) : (
          <span>Back online ✓</span>
        )}
      </div>
    </div>
  );
});

export default OfflineBanner;
