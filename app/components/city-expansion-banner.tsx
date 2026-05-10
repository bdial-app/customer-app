"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  locationSharp,
  closeOutline,
  notificationsOutline,
  checkmarkCircle,
  logoWhatsapp,
} from "ionicons/icons";
import { useRequestCity } from "@/hooks/useServiceableCities";

interface CityExpansionBannerProps {
  city: string;
}

export default function CityExpansionBanner({ city }: CityExpansionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const requestCityMutation = useRequestCity();

  const handleNotifyMe = async () => {
    try {
      await requestCityMutation.mutateAsync({ city });
      setHasRequested(true);
    } catch {
      setHasRequested(true);
    }
  };

  const handleShare = () => {
    const text = encodeURIComponent(
      `Hey! I just discovered Tijarah — a platform to find trusted local services. ` +
      `They're launching in ${city} soon! Check it out 👇\nhttps://tijarahconnect.com`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 mt-2 mb-1"
      >
        <div className="relative rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 overflow-hidden">
          {/* Main banner row */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <IonIcon icon={locationSharp} className="text-base text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300 leading-tight">
                We&apos;re not in {city} yet
              </p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
                Tap to get notified when we launch
              </p>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              className="text-amber-400/60"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </motion.div>
          </button>

          {/* Dismiss */}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-amber-400/50 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
          >
            <IonIcon icon={closeOutline} className="text-sm" />
          </button>

          {/* Expanded content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 flex gap-2">
                  {/* Notify Me */}
                  <button
                    onClick={handleNotifyMe}
                    disabled={hasRequested || requestCityMutation.isPending}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-medium transition-all active:scale-[0.97] ${
                      hasRequested
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500 text-white shadow-sm"
                    }`}
                  >
                    {requestCityMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : hasRequested ? (
                      <>
                        <IonIcon icon={checkmarkCircle} className="text-base" />
                        <span>We&apos;ll notify you!</span>
                      </>
                    ) : (
                      <>
                        <IonIcon icon={notificationsOutline} className="text-base" />
                        <span>Notify Me</span>
                      </>
                    )}
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-green-500 text-white text-[13px] font-medium shadow-sm active:scale-[0.97]"
                  >
                    <IonIcon icon={logoWhatsapp} className="text-base" />
                    <span>Share</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
