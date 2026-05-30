"use client";
import { IonIcon } from "@ionic/react";
import { search } from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

const FALLBACK_TEXTS = [
  'Search "Tailoring"',
  'Search "AC Repair"',
  'Search "Beauty Salon"',
  'Search "Catering"',
  'Search "Plumber"',
  'Search "Mehandi Artist"',
];

const HeroSearchBar = ({ onTap, prompts, scrolled }: { onTap?: () => void; prompts?: string[]; scrolled?: boolean }) => {
  const router = useRouter();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholderTexts = Array.isArray(prompts) && prompts.length > 0
    ? prompts.map((p) => `Search "${p}"`)
    : FALLBACK_TEXTS;

  // Prefetch the search route so it loads instantly on tap
  useEffect(() => {
    router.prefetch(ROUTE_PATH.SEARCH);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  const handleTap = () => {
    if (onTap) {
      onTap();
    } else {
      router.push(ROUTE_PATH.SEARCH);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      onClick={handleTap}
      className="mx-4 mt-3 mb-4"
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-white/25 active:bg-white/30 transition-colors"
        style={{
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.30), 0 1px 6px rgba(0,0,0,0.18)",
        }}
      >
        <IonIcon icon={search} className={`text-lg ${scrolled ? "text-slate-500 dark:text-white/80" : "text-white/80"}`} />
        <div className="flex-1 relative h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={placeholderIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className={`text-sm absolute whitespace-nowrap font-medium ${scrolled ? "text-slate-600 dark:text-white/75" : "text-white/75"}`}
            >
              {placeholderTexts[placeholderIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroSearchBar;
