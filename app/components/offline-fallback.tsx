"use client";
import { memo } from "react";

interface OfflineFallbackProps {
  message?: string;
  compact?: boolean;
}

const OfflineFallback = memo(function OfflineFallback({
  message = "Connect to the internet to load this page.",
  compact = false,
}: OfflineFallbackProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 px-4">
        <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M15.536 8.464a5 5 0 010 7.072M12 12h.01" />
        </svg>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M15.536 8.464a5 5 0 010 7.072M12 12h.01" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">You&apos;re offline</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-[260px]">
        {message}
      </p>
    </div>
  );
});

export default OfflineFallback;
