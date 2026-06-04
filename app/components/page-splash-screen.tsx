"use client";

import { motion } from "framer-motion";
import { SPLASH_ICON } from "./splash-icon";

interface PageSplashScreenProps {
  message?: string;
  variant?: "brand" | "analytics" | "business";
}

const GRADIENTS = {
  brand: "from-[#0f3460] via-[#1a1a2e] to-[#16213e]",
  analytics: "from-slate-900 via-slate-900 to-slate-800",
  business: "from-teal-700 via-teal-600 to-emerald-600",
};

export default function PageSplashScreen({
  message = "Getting things ready…",
  variant = "brand",
}: PageSplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b ${GRADIENTS[variant]}`}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
      </div>

      {/* App icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 mb-8"
      >
        <img
          src={SPLASH_ICON}
          alt="Tijarah"
          className="w-16 h-16 rounded-2xl shadow-lg shadow-black/30"
        />
      </motion.div>

      {/* Dots + message */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <p className="text-[11px] font-medium text-white/40 tracking-wider uppercase">
          {message}
        </p>
      </motion.div>
    </div>
  );
}
