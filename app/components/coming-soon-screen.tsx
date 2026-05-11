"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  locationSharp,
  notificationsOutline,
  shareSocialOutline,
  logoWhatsapp,
  checkmarkCircle,
  arrowBackOutline,
} from "ionicons/icons";
import { useRequestCity } from "@/hooks/useServiceableCities";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { setSelectedCity } from "@/store/slices/locationSlice";
import { APP_BASE_URL, openWhatsApp, getAppDownloadLink } from "@/utils/sharing";
import { isNativePlatform } from "@/utils/platform";

interface ComingSoonScreenProps {
  city: string;
  onChangeLocation: () => void;
}

export default function ComingSoonScreen({ city, onChangeLocation }: ComingSoonScreenProps) {
  const dispatch = useAppDispatch();
  const requestCityMutation = useRequestCity();
  const [hasRequested, setHasRequested] = useState(false);

  const handleNotifyMe = async () => {
    try {
      await requestCityMutation.mutateAsync({ city });
      setHasRequested(true);
    } catch {
      // 409 = already requested
      setHasRequested(true);
    }
  };

  const handleShareWhatsApp = () => {
    const link = isNativePlatform() ? getAppDownloadLink() : APP_BASE_URL;
    openWhatsApp(
      `Hey! I just discovered Tijarah — a platform to find trusted local services. ` +
      `They're launching in ${city} soon! Check it out 👇\n${link}`
    );
  };

  const handleChangeLocation = () => {
    dispatch(setSelectedCity(null));
    onChangeLocation();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-[#0f3460] via-[#1a1a2e] to-[#16213e]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        onClick={handleChangeLocation}
        className="absolute top-0 left-0 z-20 p-4 text-white/50 active:text-white/80 transition-colors"
        style={{ marginTop: "calc(var(--sat, 0px) + 8px)" }}
      >
        <IonIcon icon={arrowBackOutline} className="text-2xl" />
      </motion.button>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6" style={{ paddingTop: "calc(var(--sat,0px) + 40px)" }}>
        {/* Animated map pin */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="mb-8"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <IonIcon icon={locationSharp} className="text-4xl text-amber-400" />
              </div>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        </motion.div>

        {/* City name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Coming Soon to</h1>
          <p className="text-3xl font-bold text-amber-400">{city}</p>
          <p className="text-white/40 text-sm mt-3 max-w-[280px] leading-relaxed">
            We&apos;re working hard to bring Tijarah to your city. Be the first to know when we launch!
          </p>
        </motion.div>

        {/* Notify Me Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          onClick={handleNotifyMe}
          disabled={hasRequested || requestCityMutation.isPending}
          className={`w-full max-w-sm flex items-center justify-center gap-3 h-14 rounded-2xl font-semibold text-[15px] shadow-lg transition-all active:scale-[0.97] ${
            hasRequested
              ? "bg-emerald-500/20 text-emerald-400 shadow-none"
              : "bg-amber-500 text-white shadow-amber-500/25"
          }`}
        >
          {requestCityMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : hasRequested ? (
            <>
              <IonIcon icon={checkmarkCircle} className="text-xl" />
              You&apos;ll be notified!
            </>
          ) : (
            <>
              <IonIcon icon={notificationsOutline} className="text-xl" />
              Notify Me When Live
            </>
          )}
        </motion.button>

        {/* Share CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-sm mt-4"
        >
          <button
            onClick={handleShareWhatsApp}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-semibold text-[15px] active:scale-[0.97] transition-all"
          >
            <IonIcon icon={logoWhatsapp} className="text-xl" />
            Tell friends about Tijarah
          </button>
          <p className="text-center text-white/20 text-xs mt-3">
            More requests = faster launch in your city
          </p>
        </motion.div>

        {/* Change Location */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          onClick={handleChangeLocation}
          className="mt-8 flex items-center gap-2 text-white/30 text-sm active:text-white/50 transition-colors"
        >
          <IonIcon icon={shareSocialOutline} className="text-base rotate-180" />
          Change Location
        </motion.button>
      </div>
    </div>
  );
}
