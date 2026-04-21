"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const ACTIVITIES = [
  { count: 42, text: "bookings completed near you today" },
  { count: 18, text: "providers online in your area" },
  { count: 7, text: "people booked tailoring this hour" },
  { count: 23, text: "salon appointments booked today" },
  { count: 12, text: "home services ongoing nearby" },
];

const LiveActivityPulse = () => {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % ACTIVITIES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mx-4 mb-3"
    >
      <div className="flex items-center gap-2.5 bg-emerald-50/80 rounded-xl px-3.5 py-2.5 border border-emerald-100/60">
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
              className="text-[12px] text-emerald-800 font-medium absolute whitespace-nowrap"
            >
              <span className="font-bold">{ACTIVITIES[index].count}</span>{" "}
              {ACTIVITIES[index].text}
            </motion.p>
          </AnimatePresence>
        </div>

        <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
          LIVE
        </span>
      </div>
    </motion.div>
  );
};

export default LiveActivityPulse;
