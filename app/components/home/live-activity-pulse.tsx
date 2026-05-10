"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLiveActivity } from "@/hooks/useHomeFeed";
import { inflateIfLow } from "@/utils/inflate-stats";

const FALLBACK_ACTIVITIES = [
  { count: 0, text: "providers available in your area" },
  { count: 0, text: "services completed this week" },
  { count: 0, text: "businesses with active deals" },
  { count: 0, text: "new reviews this week" },
  { count: 4.5, text: "average rating", format: "rating" as const },
  { count: 0, text: "service categories available" },
];

interface LiveActivityPulseProps {
  lat?: number;
  lng?: number;
  city?: string;
}

const LiveActivityPulse = ({ lat, lng, city }: LiveActivityPulseProps) => {
  const { data: activities } = useLiveActivity({ lat, lng, city });
  const [index, setIndex] = useState(0);

  const displayActivities = useMemo(() => {
    if (!Array.isArray(activities) || activities.length === 0) return FALLBACK_ACTIVITIES;
    return activities.map((a, i) => ({
      ...a,
      count: a.format === 'rating'
        ? (a.count > 0 ? a.count : 4.5)
        : inflateIfLow(a.count, `live_activity_${i}`, 5, 15),
    }));
  }, [activities]);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % displayActivities.length);
  }, [displayActivities.length]);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  const current = displayActivities[index];
  const isRating = current?.format === 'rating';
  const displayCount = isRating
    ? Number(current.count).toFixed(1)
    : current?.count;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mx-4 mb-3"
    >
      <div className="flex items-center gap-2.5 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-xl px-3.5 py-2.5 border border-emerald-100/60 dark:border-emerald-800/40">
        {/* Pulsing dot */}
        <div className="relative shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <motion.div
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-hidden h-4 relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="text-[12px] text-emerald-800 dark:text-emerald-200 font-medium absolute whitespace-nowrap"
            >
              <span className="font-bold">{displayCount}</span>
              {isRating && <span className="text-yellow-500"> &#9733; </span>}
              {!isRating && " "}
              {current?.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex gap-0.5 shrink-0">
          {displayActivities.map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                i === index
                  ? "bg-emerald-500"
                  : "bg-emerald-300/50 dark:bg-emerald-700/50"
              }`}
            />
          ))}
        </div>

        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
          LIVE
        </span>
      </div>
    </motion.div>
  );
};

export default LiveActivityPulse;
