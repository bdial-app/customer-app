"use client";

import { motion } from "framer-motion";

export default function HomeSplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#0f3460] via-[#1a1a2e] to-[#16213e]">
      {/* Abstract background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-blue-500/[0.03] blur-[80px]" />
      </div>

      {/* Logo / Brand mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mb-8"
      >
        <img
          src="/icons/512.png"
          alt="Tijarah"
          className="w-20 h-20 rounded-2xl shadow-lg shadow-black/30"
        />
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <p className="text-[11px] font-medium text-white/30 tracking-wider uppercase">
          Loading your feed
        </p>
      </motion.div>
    </div>
  );
}
