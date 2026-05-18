"use client";
import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface OfflineFallbackProps {
  message?: string;
  compact?: boolean;
  onRetry?: () => void;
}

const OfflineFallback = memo(function OfflineFallback({
  message = "Connect to the internet to load this page.",
  compact = false,
  onRetry,
}: OfflineFallbackProps) {
  const { isOnline } = useNetworkStatus();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (onRetry) {
      setRetrying(true);
      try {
        await onRetry();
      } finally {
        setTimeout(() => setRetrying(false), 600);
      }
    } else {
      window.location.reload();
    }
  }, [onRetry]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 py-4 px-4 mx-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shrink-0">
          <WifiOffIcon className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
        </div>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">{message}</p>
        {isOnline && (
          <button
            onClick={handleRetry}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg active:bg-blue-50 dark:active:bg-blue-900/30"
          >
            Retry
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center w-full max-w-[300px]"
      >
        {/* Animated illustration */}
        <div className="relative mb-8">
          {/* Outer ring pulse */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700"
            style={{ margin: "-12px" }}
          />
          {/* Middle ring */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700"
            style={{ margin: "-6px" }}
          />
          {/* Icon container */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-700 dark:via-slate-800 dark:to-slate-800 flex items-center justify-center shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-600">
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <WifiOffIcon className="w-9 h-9 text-slate-400 dark:text-slate-500" />
            </motion.div>
          </div>
          {/* Small decorative dots */}
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 dark:bg-amber-500/50"
          />
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
            className="absolute -bottom-0.5 -left-2 w-2 h-2 rounded-full bg-blue-300 dark:bg-blue-500/40"
          />
        </div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-8"
        >
          <h3 className="text-[18px] font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
            No Connection
          </h3>
          <p className="text-[13px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-[240px] mx-auto">
            {message}
          </p>
        </motion.div>

        {/* Retry button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full"
        >
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-100 dark:to-white text-white dark:text-slate-900 text-[14px] font-bold active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-slate-300/40 dark:shadow-none"
          >
            {retrying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              >
                <RefreshIcon className="w-4.5 h-4.5" />
              </motion.div>
            ) : (
              <RefreshIcon className="w-4.5 h-4.5" />
            )}
            <span>{retrying ? "Reconnecting…" : "Try Again"}</span>
          </button>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 mt-5"
        >
          <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {isOnline ? "Connection restored — tap retry" : "Waiting for connection…"}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
});

// ─── Icons (inline SVG to avoid external deps) ─────────────────────

function WifiOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l22 22" />
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
      <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0122.56 9" />
      <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

export default OfflineFallback;
