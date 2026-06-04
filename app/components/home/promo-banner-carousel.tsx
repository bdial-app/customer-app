"use client";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
  linkUrl: string | null;
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
  "from-teal-500 to-emerald-600":
    "linear-gradient(135deg, #14b8a6 0%, #059669 100%)",
  "from-purple-500 to-indigo-600":
    "linear-gradient(135deg, #a855f7 0%, #4f46e5 100%)",
  "from-sky-500 to-blue-600":
    "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
  "from-rose-500 to-pink-600":
    "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)",
};

const DEFAULT_GRADIENT = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

const resolveGradient = (g: string | null | undefined): string => {
  if (!g) return DEFAULT_GRADIENT;
  if (g.startsWith("linear-gradient") || g.startsWith("radial-gradient")) return g;
  return GRADIENT_MAP[g] ?? DEFAULT_GRADIENT;
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
    linkUrl: null,
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
    linkUrl: null,
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
    linkUrl: null,
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
    linkUrl: null,
  },
];

interface PromoBannerCarouselProps {
  banners?: PromoBannerType[];
  isLoading?: boolean;
  variant?: "default" | "hero";
}

const PromoBannerCarousel = ({
  banners,
  isLoading,
  variant = "default",
}: PromoBannerCarouselProps) => {
  const isHero = variant === "hero";
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const liveOffset = useRef(0);

  const displayBanners: Banner[] = useMemo(() => {
    if (!Array.isArray(banners) || banners.length === 0) return FALLBACK_BANNERS;
    return banners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || "",
      gradient: resolveGradient(b.gradient),
      image_url: b.imageUrl || "",
      emoji: b.emoji || "✨",
      cta: b.cta || "",
      tag: b.tag || "",
      linkUrl: b.linkUrl ?? null,
    }));
  }, [banners]);

  const slideTo = useCallback((idx: number) => {
    setCurrent(idx);
    if (trackRef.current) {
      trackRef.current.style.transition =
        "transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      trackRef.current.style.transform = `translateX(-${idx * 100}%)`;
    }
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev + 1) % displayBanners.length;
      if (trackRef.current) {
        trackRef.current.style.transition =
          "transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        trackRef.current.style.transform = `translateX(-${n * 100}%)`;
      }
      return n;
    });
  }, [displayBanners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev - 1 + displayBanners.length) % displayBanners.length;
      if (trackRef.current) {
        trackRef.current.style.transition =
          "transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        trackRef.current.style.transform = `translateX(-${n * 100}%)`;
      }
      return n;
    });
  }, [displayBanners.length]);

  const pauseAndResume = useCallback(() => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  /* ── Touch / swipe ────────────────────────────── */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    liveOffset.current = 0;
    setIsPaused(true);
    if (trackRef.current) {
      trackRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !trackRef.current) return;
    const offset = e.touches[0].clientX - touchStartX.current;
    liveOffset.current = offset;
    // Follow finger live — feels native
    trackRef.current.style.transform = `translateX(calc(-${current * 100}% + ${offset}px))`;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const offset = liveOffset.current;
    touchStartX.current = null;
    liveOffset.current = 0;

    if (offset < -60) {
      next();
    } else if (offset > 60) {
      prev();
    } else {
      // Snap back to current
      if (trackRef.current) {
        trackRef.current.style.transition =
          "transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        trackRef.current.style.transform = `translateX(-${current * 100}%)`;
      }
    }
    setTimeout(() => setIsPaused(false), 8000);
  };

  const handleDot = (i: number) => {
    slideTo(i);
    pauseAndResume();
  };

  if (isLoading) {
    if (isHero) {
      return (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      );
    }
    return (
      <div className="px-4 pt-1 pb-3">
        <div className="h-[140px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="flex justify-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[5px] w-6 rounded-full bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (isHero) {
    return (
      <>
        {/* Viewport — fills parent absolutely, no padding, no radius */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding track */}
          <div
            ref={trackRef}
            className="flex h-full w-full"
            style={{
              transform: `translateX(-${current * 100}%)`,
              willChange: "transform",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {displayBanners.map((banner, idx) => (
              <div
                key={banner.id}
                className="relative w-full h-full shrink-0 overflow-hidden flex flex-col justify-end"
                style={{ background: banner.gradient }}
              >
                {banner.image_url && !banner.image_url.includes("/path/to/") && (
                  <motion.img
                    src={banner.image_url}
                    alt=""
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ transformOrigin: "center center", willChange: "transform" }}
                    animate={{
                      scale: [1.02, 1.12, 1.02],
                      x: [0, 12, -8, 0],
                      y: [0, -6, 4, 0],
                    }}
                    transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
                  />
                )}
                {/* Dark gradient so bottom text stays readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
                {/* Content pinned to bottom */}
                <div className="relative z-10 flex flex-col gap-2 px-6 pb-10">
                  {banner.tag ? (
                    <span className="text-[10px] font-bold tracking-[0.15em] text-white/85 bg-white/20 backdrop-blur-md self-start px-3 py-1 rounded-full">
                      {banner.tag}
                    </span>
                  ) : null}
                  <h3 className="text-3xl text-white font-extrabold leading-tight drop-shadow-lg">
                    {banner.title}
                  </h3>
                  {banner.subtitle ? (
                    <p className="text-base text-white/90 drop-shadow-md">{banner.subtitle}</p>
                  ) : null}
                  {banner.cta ? (
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onTouchEnd={(e) => {
                        if (Math.abs(liveOffset.current) < 10 && banner.linkUrl) {
                          e.stopPropagation();
                          router.push(banner.linkUrl);
                        }
                      }}
                      className="mt-3 self-start flex items-center gap-2 pl-5 pr-3.5 py-2.5 rounded-full shadow-xl shadow-black/30"
                      style={{
                        background: "rgba(255,255,255,0.93)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "#0f172a",
                      }}
                    >
                      <span className="text-sm font-bold tracking-wide">{banner.cta}</span>
                      <span className="w-5 h-5 rounded-full bg-slate-900/[0.08] flex items-center justify-center text-[11px] font-bold">→</span>
                    </motion.button>
                  ) : null}
                </div>
                {/* Animated abstract orbs */}
                <motion.div
                  className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/[0.07] pointer-events-none"
                  animate={{
                    x: [0, 28, -12, 0],
                    y: [0, -22, 14, 0],
                    scale: [1, 1.18, 0.92, 1],
                    rotate: [0, 22, -8, 0],
                    opacity: [0.6, 1, 0.7, 0.6],
                  }}
                  transition={{ duration: 11, ease: "easeInOut", repeat: Infinity }}
                />
                <motion.div
                  className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white/[0.05] pointer-events-none"
                  animate={{
                    x: [0, -24, 16, 0],
                    y: [0, 24, -10, 0],
                    scale: [1, 1.28, 0.88, 1],
                    rotate: [0, -18, 12, 0],
                    opacity: [0.55, 0.95, 0.65, 0.55],
                  }}
                  transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
                />
                {/* Small floating accent — adds depth */}
                <motion.div
                  className="absolute left-8 top-1/3 w-16 h-16 rounded-full bg-white/[0.04] pointer-events-none blur-sm"
                  animate={{
                    x: [0, 18, -8, 0],
                    y: [0, -14, 22, 0],
                    scale: [0.9, 1.2, 0.85, 0.9],
                    opacity: [0.4, 0.75, 0.45, 0.4],
                  }}
                  transition={{ duration: 13, ease: "easeInOut", repeat: Infinity }}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Dots — pinned to the bottom of the hero area */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {displayBanners.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === current ? 20 : 6 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-[5px] rounded-full pointer-events-auto cursor-pointer ${
                i === current ? "bg-white" : "bg-white/35"
              }`}
              onClick={() => handleDot(i)}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="px-4 pt-1 pb-3">
      {/* Viewport — clips the sliding track */}
      <div
        className="relative overflow-hidden rounded-2xl h-[140px] shadow-lg shadow-black/[0.06]"
        style={{ touchAction: "pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding track — all banners side by side */}
        <div
          ref={trackRef}
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${current * 100}%)`,
            willChange: "transform",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {displayBanners.map((banner, idx) => (
            <div
              key={banner.id}
              className="relative w-full h-full flex items-center shrink-0 overflow-hidden"
              style={{ background: banner.gradient }}
            >
              {banner.image_url && !banner.image_url.includes("/path/to/") && (
                <motion.img
                  src={banner.image_url}
                  alt=""
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-contain object-right pointer-events-none"
                  style={{ transformOrigin: "right center", willChange: "transform" }}
                  animate={{
                    scale: [1, 1.06, 1],
                    x: [0, -4, 2, 0],
                    y: [0, -3, 4, 0],
                  }}
                  transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
                />
              )}
              <div className="relative z-10 flex flex-col gap-1 flex-1 px-5 py-4">
                {banner.tag ? (
                  <span className="text-[9px] font-bold tracking-[0.15em] text-white/70 bg-white/15 self-start px-2 py-0.5 rounded-full">
                    {banner.tag}
                  </span>
                ) : null}
                <h3 className="text-white text-xl font-extrabold leading-tight mt-1">
                  {banner.title}
                </h3>
                {banner.subtitle ? (
                  <p className="text-white/80 text-[13px]">{banner.subtitle}</p>
                ) : null}
                {banner.cta ? (
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onTouchEnd={(e) => {
                      if (Math.abs(liveOffset.current) < 10 && banner.linkUrl) {
                        e.stopPropagation();
                        router.push(banner.linkUrl);
                      }
                    }}
                    className="mt-2 self-start flex items-center gap-1.5 pl-4 pr-3 py-2 rounded-full shadow-lg shadow-black/25"
                    style={{
                      background: "rgba(255,255,255,0.93)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "#0f172a",
                    }}
                  >
                    <span className="text-xs font-bold tracking-wide">{banner.cta}</span>
                    <span className="w-4 h-4 rounded-full bg-slate-900/[0.08] flex items-center justify-center text-[10px] font-bold">→</span>
                  </motion.button>
                ) : null}
              </div>
              <motion.div
                className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.09] pointer-events-none"
                animate={{
                  x: [0, 16, -6, 0],
                  y: [0, -12, 8, 0],
                  scale: [1, 1.16, 0.92, 1],
                  rotate: [0, 18, -8, 0],
                  opacity: [0.6, 1, 0.7, 0.6],
                }}
                transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
              />
              <motion.div
                className="absolute right-12 -bottom-6 w-20 h-20 rounded-full bg-white/[0.07] pointer-events-none"
                animate={{
                  x: [0, -14, 10, 0],
                  y: [0, 14, -6, 0],
                  scale: [1, 1.22, 0.86, 1],
                  rotate: [0, -16, 10, 0],
                  opacity: [0.55, 0.95, 0.65, 0.55],
                }}
                transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {displayBanners.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === current ? 20 : 6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`h-[5px] rounded-full cursor-pointer ${
              i === current
                ? "bg-slate-800 dark:bg-white"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
            onClick={() => handleDot(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoBannerCarousel;
