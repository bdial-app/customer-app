"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { PromoBanner as PromoBannerType } from "@/services/home.service";

interface Banner {
  image_url: any;
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  emoji: string;
  cta: string;
  tag: string;
}

const GRADIENT_MAP: Record<string, string> = {
  "from-violet-600 to-purple-700":
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "from-cyan-500 to-blue-600":
    "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
  "from-pink-500 to-rose-600":
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "from-amber-500 to-orange-600":
    "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  "from-emerald-500 to-teal-600":
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "from-fuchsia-500 to-pink-600":
    "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
};

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "fb1",
    title: "Get 20% off",
    subtitle: "First tailoring order",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    image_url: "/path/to/image1.jpg",
    emoji: "🧵",
    cta: "Order Now",
    tag: "NEW USER",
  },
  {
    id: "fb2",
    title: "AC Service",
    subtitle: "Starting at ₹499",
    gradient: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
    image_url: "/path/to/image2.jpg",
    emoji: "❄️",
    cta: "Book Now",
    tag: "SUMMER DEAL",
  },
  {
    id: "fb3",
    title: "Beauty at Home",
    subtitle: "Salon-quality services",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    image_url: "/path/to/image3.jpg",
    emoji: "💅",
    cta: "Explore",
    tag: "TRENDING",
  },
  {
    id: "fb4",
    title: "Food & Tiffin",
    subtitle: "Homemade meals daily",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    image_url: "/path/to/image4.jpg",
    emoji: "🍛",
    cta: "View Menu",
    tag: "POPULAR",
  },
];

interface PromoBannerCarouselProps {
  banners?: PromoBannerType[];
  isLoading?: boolean;
}

const PromoBannerCarousel = ({
  banners,
  isLoading,
}: PromoBannerCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const displayBanners: Banner[] = useMemo(() => {
    if (!banners || banners.length === 0) return FALLBACK_BANNERS;
    console.log("Received banners:", banners);
    return banners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || "",
      gradient:
        GRADIENT_MAP[b.gradient || ""] ||
        `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
      image_url: b.imageUrl || "/path/to/default/image.jpg",
      emoji: b.emoji || "✨",
      cta: b.cta || "View",
      tag: b.tag || "",
    }));
  }, [banners]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % displayBanners.length);
  }, [displayBanners.length]);

  useEffect(() => {
    // const timer = setInterval(next, 4000);
    // return () => clearInterval(timer);
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
            key={displayBanners[current].id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -80, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 flex items-center"
            style={{ background: displayBanners[current].gradient }}
          >
            <div
              className="flex flex-col gap-1 z-10 flex-1 px-5 py-4"
              style={{
                backgroundImage: `url('${displayBanners[current].image_url}')`,
                backgroundSize: "contain",
                backgroundPosition: "center right",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span className="text-[9px] font-bold tracking-[0.15em] text-white/70 bg-white/15 self-start px-2 py-0.5 rounded-full">
                {displayBanners[current].tag}
              </span>
              <h3 className="text-white text-xl font-extrabold leading-tight mt-1">
                {displayBanners[current].title}
              </h3>
              <p className="text-white/80 text-[13px]">
                {displayBanners[current].subtitle}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="mt-2 self-start px-5 py-2 bg-white rounded-xl text-xs font-bold shadow-sm"
                style={{ color: "#1a1a2e" }}
              >
                {displayBanners[current].cta}
              </motion.button>
            </div>

            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.08]" />
            <div className="absolute right-12 -bottom-6 w-20 h-20 rounded-full bg-white/[0.06]" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {displayBanners.map((_, i) => (
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
