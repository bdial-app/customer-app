"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  homeOutline,
  searchOutline,
  arrowBackOutline,
  compassOutline,
} from "ionicons/icons";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-64 h-64 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-32 -right-16 w-56 h-56 bg-teal-200/20 dark:bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-32 h-32 bg-violet-200/15 dark:bg-violet-500/5 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
          className="relative mb-6"
        >
          <span className="text-[120px] sm:text-[140px] font-extrabold leading-none tracking-tighter bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent select-none">
            404
          </span>
          {/* Floating compass icon */}
          <motion.div
            animate={{ y: [-4, 4, -4], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-4 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-amber-100 dark:shadow-slate-900 flex items-center justify-center border border-amber-100 dark:border-slate-700"
          >
            <IonIcon icon={compassOutline} className="text-amber-500 text-2xl" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-2xl font-bold text-slate-800 dark:text-white mb-3"
        >
          Page not found
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-10 max-w-[280px]"
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get you back on track.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex flex-col gap-3 w-full"
        >
          {/* Primary: Go Home */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2.5 w-full h-13 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-sm shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20 active:scale-[0.97] transition-transform"
          >
            <IonIcon icon={homeOutline} className="text-lg" />
            Go to Home
          </button>

          {/* Secondary: Explore */}
          <button
            onClick={() => router.push("/?tab=explore")}
            className="flex items-center justify-center gap-2.5 w-full h-13 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-150 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm active:scale-[0.97] transition-transform"
          >
            <IonIcon icon={searchOutline} className="text-lg" />
            Explore Services
          </button>

          {/* Tertiary: Go Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 w-full h-11 text-slate-500 dark:text-slate-400 font-medium text-sm active:opacity-70 transition-opacity"
          >
            <IonIcon icon={arrowBackOutline} className="text-base" />
            Go back
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom branding */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute bottom-8 text-[10px] font-semibold text-slate-300 dark:text-slate-700 uppercase tracking-widest"
      >
        Tijarah
      </motion.p>
    </div>
  );
}
