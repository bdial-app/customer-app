"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  locationOutline,
  handRightOutline,
  checkmarkCircle,
  logoWhatsapp,
  sparklesOutline,
} from "ionicons/icons";
import { useRequestCity } from "@/hooks/useServiceableCities";
import { APP_BASE_URL, openWhatsApp, getAppDownloadLink } from "@/utils/sharing";
import { isNativePlatform } from "@/utils/platform";

interface CityExpansionBannerProps {
  city: string;
}

export default function CityExpansionBanner({ city }: CityExpansionBannerProps) {
  const [hasRequested, setHasRequested] = useState(false);
  const requestCityMutation = useRequestCity();

  const handleRequest = async () => {
    try {
      await requestCityMutation.mutateAsync({ city });
      setHasRequested(true);
    } catch {
      setHasRequested(true);
    }
  };

  const handleShare = () => {
    const link = isNativePlatform() ? getAppDownloadLink() : APP_BASE_URL;
    openWhatsApp(
      `I want Tijarah in ${city}! It's a platform to discover and book trusted local services. ` +
      `Help bring it to our city 👇\n${link}`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-4 mt-3 mb-2"
    >
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-slate-900 dark:via-slate-950 dark:to-black" />

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/[0.08] blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-blue-500/[0.06] blur-2xl" />
          <div className="absolute top-3 right-4 opacity-[0.04]">
            <IonIcon icon={locationOutline} className="text-[80px] text-white" />
          </div>
        </div>

        <div className="relative z-10 px-5 pt-5 pb-4">
          {/* Status pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Expanding Soon</span>
          </div>

          {/* Main content */}
          <h3 className="text-[18px] font-bold text-white leading-snug mb-1.5">
            We&apos;re not available in {city} — yet.
          </h3>
          <p className="text-[13px] text-white/50 leading-relaxed mb-5 max-w-[320px]">
            Tijarah helps you discover, compare, and book trusted local services.
            The more people request it, the sooner we launch in your area.
          </p>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <AnimatePresence mode="wait">
              {hasRequested ? (
                <motion.div
                  key="requested"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex-1 flex items-center justify-center gap-2.5 h-[50px] rounded-xl bg-emerald-500/15 border border-emerald-500/20"
                >
                  <IonIcon icon={checkmarkCircle} className="text-xl text-emerald-400" />
                  <div>
                    <p className="text-[13px] font-semibold text-emerald-400 leading-tight">You&apos;re on the list!</p>
                    <p className="text-[10px] text-emerald-400/60">We&apos;ll let you know when we launch</p>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="request"
                  onClick={handleRequest}
                  disabled={requestCityMutation.isPending}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 h-[50px] rounded-xl bg-amber-500 text-white font-bold text-[14px] shadow-md shadow-amber-500/25 transition-colors"
                >
                  {requestCityMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <IonIcon icon={handRightOutline} className="text-lg" />
                      <span>Bring Tijarah to {city}</span>
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 h-[50px] px-4 rounded-xl bg-white/[0.08] border border-white/[0.08] text-white text-[13px] font-semibold active:scale-[0.97] transition-transform"
            >
              <IonIcon icon={logoWhatsapp} className="text-lg text-green-400" />
              <span>Share</span>
            </button>
          </div>

          {/* Social proof hint */}
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            <IonIcon icon={sparklesOutline} className="text-xs text-white/25" />
            <p className="text-[10px] text-white/25">Join others requesting Tijarah in your city</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
