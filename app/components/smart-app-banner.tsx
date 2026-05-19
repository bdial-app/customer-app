"use client";
import { useState, useEffect } from "react";
import { isNativePlatform } from "@/utils/platform";
import { PLAY_STORE_URL } from "@/utils/sharing";

const DISMISS_KEY = "smart_app_banner_dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getStoreInfo() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) {
    return { platform: "ios" as const, available: false };
  }
  return { platform: "android" as const, available: true };
}

const PlayStoreBadge = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z" />
  </svg>
);

const AppStoreBadge = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

export default function SmartAppBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNativePlatform()) return;

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );
    if (!isMobile) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION_MS) return;
    }

    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setClosing(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setTimeout(() => setVisible(false), 300);
  };

  const handleOpen = () => {
    const { available } = getStoreInfo();
    if (available) {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }
  };

  if (!visible) return null;

  const { platform, available } = getStoreInfo();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-300 ${
        closing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100 animate-[slideUp_0.3s_ease-out]"
      }`}
    >
      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-slate-700 p-3 flex items-center gap-3">
        {/* Store Logo */}
        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
          platform === "ios"
            ? "bg-black text-white"
            : "bg-white border border-slate-200 dark:border-slate-600 dark:bg-slate-700 text-slate-700 dark:text-white"
        }`}>
          {platform === "ios" ? <AppStoreBadge /> : <PlayStoreBadge />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
            Tijarah
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
            {available
              ? "Get the app for a better experience"
              : "Coming soon to the App Store"}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
            {available ? "Free on Google Play" : "Available on Play Store"}
          </p>
        </div>

        {/* CTA Button */}
        {available ? (
          <button
            onClick={handleOpen}
            className="shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-semibold text-sm rounded-full transition-colors shadow-sm"
          >
            GET
          </button>
        ) : (
          <span className="shrink-0 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full">
            Soon
          </span>
        )}

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
