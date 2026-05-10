"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  locationSharp,
  rocketOutline,
  checkmarkCircle,
  logoWhatsapp,
} from "ionicons/icons";
import { useRequestCity } from "@/hooks/useServiceableCities";

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
    const text = encodeURIComponent(
      `Hey! I just discovered Tijarah — a platform to find trusted local services. ` +
      `They're launching in ${city} soon! Help us bring it here 👇\nhttps://tijarahconnect.com`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 mb-2"
    >
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 dark:from-amber-600 dark:via-amber-600 dark:to-orange-600 shadow-lg shadow-amber-500/20">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border-[20px] border-white" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full border-[14px] border-white" />
        </div>

        <div className="relative z-10 px-5 py-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <IonIcon icon={locationSharp} className="text-2xl text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[17px] font-bold text-white leading-tight">
                Tijarah isn&apos;t in {city} yet
              </h3>
              <p className="text-[13px] text-white/70 mt-1 leading-snug">
                We&apos;re expanding fast! Request Tijarah in your city and we&apos;ll prioritize launching there.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <AnimatePresence mode="wait">
              {hasRequested ? (
                <motion.div
                  key="requested"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-white/20 backdrop-blur-sm"
                >
                  <IonIcon icon={checkmarkCircle} className="text-xl text-white" />
                  <span className="text-[14px] font-semibold text-white">Request Sent!</span>
                </motion.div>
              ) : (
                <motion.button
                  key="request"
                  onClick={handleRequest}
                  disabled={requestCityMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-amber-600 font-bold text-[14px] shadow-sm active:scale-[0.97] transition-transform"
                >
                  {requestCityMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <IonIcon icon={rocketOutline} className="text-lg" />
                      <span>Request Tijarah in {city}</span>
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl bg-white/20 backdrop-blur-sm text-white text-[13px] font-semibold active:scale-[0.97] transition-transform"
            >
              <IonIcon icon={logoWhatsapp} className="text-lg" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
