"use client";
import { useState, useEffect } from "react";
import { isNativePlatform } from "@/utils/platform";
import { PLAY_STORE_URL, APP_STORE_URL } from "@/utils/sharing";

const DISMISS_KEY = "smart_app_banner_dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getStoreInfo() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) {
    return { store: "App Store", url: APP_STORE_URL, platform: "ios" as const };
  }
  return { store: "Play Store", url: PLAY_STORE_URL, platform: "android" as const };
}

export default function SmartAppBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Only show on web browsers, not native apps or SSR
    if (typeof window === "undefined") return;
    if (isNativePlatform()) return;

    // Don't show on desktop — only mobile web benefits from this
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );
    if (!isMobile) return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION_MS) return;
    }

    // Show after a short delay to not interrupt initial load
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setClosing(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setTimeout(() => setVisible(false), 300);
  };

  const handleOpen = () => {
    const { url } = getStoreInfo();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!visible) return null;

  const { store } = getStoreInfo();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-300 ${
        closing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100 animate-[slideUp_0.3s_ease-out]"
      }`}
    >
      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-slate-700 p-3 flex items-center gap-3">
        {/* App Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-lg">T</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
            Tijarah
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
            Get the app for a better experience
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
            Free on {store}
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleOpen}
          className="shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-semibold text-sm rounded-full transition-colors shadow-sm"
        >
          GET
        </button>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
