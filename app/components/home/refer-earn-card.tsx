"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { shareInvite } from "@/utils/sharing";
import { trackInvite } from "@/services/invite.service";

const ReferEarnCard = () => {
  const router = useRouter();
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await shareInvite();
    if (result === "shared" || result === "copied") {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      try {
        await trackInvite("home_card");
      } catch {
        // tracking is best-effort
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mx-4 my-1"
    >
      <div
        onClick={() => router.push("/invite")}
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] dark:from-indigo-950 dark:via-slate-800 dark:to-slate-700 dark:border dark:border-slate-600/40"
      >
        {/* Decorative elements */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-amber-400/10" />
        <div className="absolute right-10 -bottom-4 w-16 h-16 rounded-full bg-blue-400/10" />
        <div className="absolute left-1/2 top-0 w-32 h-32 rounded-full bg-purple-400/5 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-amber-400/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-amber-400" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                Community
              </span>
            </div>
            <h3 className="text-[15px] font-extrabold text-white leading-snug">
              Help others discover local businesses
            </h3>
            <p className="text-[11px] text-white/40 dark:text-white/50 mt-1">
              Share Tijarah with friends & family
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="shrink-0 bg-amber-400 text-[#1a1a2e] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-1.5"
          >
            <AnimatePresence mode="wait">
              {shared ? (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center gap-1"
                >
                  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Shared!
                </motion.span>
              ) : (
                <motion.span
                  key="share"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  Share
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReferEarnCard;
