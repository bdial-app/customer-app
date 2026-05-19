"use client";
import { IonIcon } from "@ionic/react";
import { search, micOutline } from "ionicons/icons";
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

const HeroSearchBar = ({ onTap, prompts }: { onTap?: () => void; prompts?: string[] }) => {
  const router = useRouter();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholderTexts = prompts && prompts.length > 0
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
      <div className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-md rounded-2xl px-4 py-3 border border-white/[0.1] active:bg-white/[0.12] transition-colors">
        <IonIcon icon={search} className="text-lg text-white/40" />
        <div className="flex-1 relative h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={placeholderIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-white/40 absolute whitespace-nowrap"
            >
              {placeholderTexts[placeholderIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <IonIcon icon={micOutline} className="text-lg text-white/30" />
      </div>
    </motion.div>
  );
};

export default HeroSearchBar;
