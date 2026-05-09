"use client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { memo } from "react";

const OfflineBanner = memo(function OfflineBanner() {
  const { isOnline, showBackOnline, dismissBackOnline } = useNetworkStatus();

  if (isOnline && !showBackOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 translate-y-0 opacity-100"
      style={{ paddingTop: "max(var(--sat,0px), 0px)" }}
    >
      {!isOnline ? (
        <div className="px-4 py-2.5 text-center text-xs font-semibold bg-red-500 text-white">
          <span className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            No internet connection
          </span>
        </div>
      ) : (
        <div
          className="px-4 py-2.5 text-center text-xs font-semibold bg-green-500 text-white cursor-pointer"
          onClick={dismissBackOnline}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/80" />
            Back online
          </span>
        </div>
      )}
    </div>
  );
});

export default OfflineBanner;
