"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Review {
  id: number;
  name: string;
  avatar: string;
  service: string;
  text: string;
  rating: number;
  timeAgo: string;
}

const REVIEWS: Review[] = [
  {
    id: 1,
    name: "Fatima B.",
    avatar: "FB",
    service: "Tailoring",
    text: "Ahmed's Tailoring did an amazing job on my suit. Perfect stitching and delivered on time!",
    rating: 5,
    timeAgo: "2h ago",
  },
  {
    id: 2,
    name: "Hussain M.",
    avatar: "HM",
    service: "AC Repair",
    text: "Quick response, fixed my AC in 30 minutes. Very professional service.",
    rating: 5,
    timeAgo: "4h ago",
  },
  {
    id: 3,
    name: "Sakina T.",
    avatar: "ST",
    service: "Beauty Salon",
    text: "Best bridal makeup! Glow Studio understands exactly what you want.",
    rating: 5,
    timeAgo: "6h ago",
  },
  {
    id: 4,
    name: "Murtaza K.",
    avatar: "MK",
    service: "Plumbing",
    text: "Fixed a major leak in 15 minutes. Honest pricing, no hidden charges.",
    rating: 4,
    timeAgo: "1d ago",
  },
  {
    id: 5,
    name: "Zahra A.",
    avatar: "ZA",
    service: "Tiffin",
    text: "Homemade taste, delivered on time every single day. My family loves it!",
    rating: 5,
    timeAgo: "1d ago",
  },
];

const AVATAR_COLORS = [
  "from-amber-400 to-orange-500",
  "from-blue-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-emerald-400 to-teal-500",
  "from-purple-400 to-violet-500",
];

const CommunityReviews = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animFrame: number;
    let pos = 0;

    const scroll = () => {
      if (!isPaused && el) {
        pos += 0.5;
        if (pos >= el.scrollWidth / 2) pos = 0;
        el.scrollLeft = pos;
      }
      animFrame = requestAnimationFrame(scroll);
    };

    animFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animFrame);
  }, [isPaused]);

  // Duplicate for infinite scroll
  const allReviews = [...REVIEWS, ...REVIEWS];

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-tight">
            What people say
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real reviews from our community
          </p>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
          <span className="text-xs font-bold text-amber-700">4.8</span>
          <span className="text-[10px] text-amber-600">★★★★★</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
      >
        {allReviews.map((review, i) => (
          <motion.div
            key={`${review.id}-${i}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="shrink-0 w-[260px] bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                  AVATAR_COLORS[review.id % AVATAR_COLORS.length]
                } flex items-center justify-center`}
              >
                <span className="text-[11px] font-bold text-white">
                  {review.avatar}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                  {review.name}
                </p>
                <p className="text-[10px] text-slate-400">{review.service} • {review.timeAgo}</p>
              </div>
              <div className="flex gap-px">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <span key={j} className="text-[10px] text-amber-400">★</span>
                ))}
              </div>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-3">
              &ldquo;{review.text}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommunityReviews;
