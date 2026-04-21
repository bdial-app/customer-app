"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  gradient: string;
  emoji: string;
  cta: string;
  tag: string;
}

const BANNERS: Banner[] = [
  {
    id: 1,
    title: "Get 20% off",
    subtitle: "First tailoring order",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    emoji: "🧵",
    cta: "Order Now",
    tag: "NEW USER",
  },
  {
    id: 2,
    title: "AC Service",
    subtitle: "Starting at ₹499",
    gradient: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
    emoji: "❄️",
    cta: "Book Now",
    tag: "SUMMER DEAL",
  },
  {
    id: 3,
    title: "Beauty at Home",
    subtitle: "Salon-quality services",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    emoji: "💅",
    cta: "Explore",
    tag: "TRENDING",
  },
  {
    id: 4,
    title: "Food & Tiffin",
    subtitle: "Homemade meals daily",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    emoji: "🍛",
    cta: "View Menu",
    tag: "POPULAR",
  },
];

const PromoBannerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % BANNERS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  const handleDot = (i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  };

  return (
    <div className="px-4 pt-1 pb-3">
      <div className="relative overflow-hidden rounded-2xl h-[140px] shadow-lg shadow-black/[0.06]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={BANNERS[current].id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -80, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 flex items-center px-5 py-4"
            style={{ background: BANNERS[current].gradient }}
          >
            <div className="flex flex-col gap-1 z-10 flex-1">
              <span className="text-[9px] font-bold tracking-[0.15em] text-white/70 bg-white/15 self-start px-2 py-0.5 rounded-full">
                {BANNERS[current].tag}
              </span>
              <h3 className="text-white text-xl font-extrabold leading-tight mt-1">
                {BANNERS[current].title}
              </h3>
              <p className="text-white/80 text-[13px]">
                {BANNERS[current].subtitle}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="mt-2 self-start px-5 py-2 bg-white rounded-xl text-xs font-bold shadow-sm"
                style={{ color: "#1a1a2e" }}
              >
                {BANNERS[current].cta}
              </motion.button>
            </div>
            {/* Large emoji decoration */}
            <span className="text-7xl absolute right-3 bottom-1 opacity-20 select-none">
              {BANNERS[current].emoji}
            </span>
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.08]" />
            <div className="absolute right-12 -bottom-6 w-20 h-20 rounded-full bg-white/[0.06]" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {BANNERS.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === current ? 20 : 6,
              backgroundColor: i === current ? "#1a1a2e" : "#d1d5db",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-[5px] rounded-full cursor-pointer"
            onClick={() => handleDot(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoBannerCarousel;
