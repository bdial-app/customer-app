"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import type { CommunityReview } from "@/services/home.service";

interface DisplayReview {
  id: string;
  name: string;
  avatar: string;
  service: string;
  text: string;
  rating: number;
  timeAgo: string;
}

const AVATAR_COLORS = [
  "from-amber-400 to-orange-500",
  "from-blue-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-emerald-400 to-teal-500",
  "from-purple-400 to-violet-500",
];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CommunityReviewsProps {
  reviews?: CommunityReview[];
  isLoading?: boolean;
}

const CommunityReviews = ({ reviews, isLoading }: CommunityReviewsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const displayReviews: DisplayReview[] = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    return reviews.map((r) => ({
      id: r.id,
      name: r.name,
      avatar: getInitials(r.name),
      service: r.providerName,
      text: r.text,
      rating: r.rating,
      timeAgo: formatTimeAgo(r.timeAgo),
    }));
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (displayReviews.length === 0) return 0;
    const sum = displayReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / displayReviews.length).toFixed(1);
  }, [displayReviews]);

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
  const allReviews = [...displayReviews, ...displayReviews];

  if (displayReviews.length === 0 && !isLoading) return null;

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
        {Number(avgRating) > 0 && (
          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
            <span className="text-xs font-bold text-amber-700">{avgRating}</span>
            <span className="text-[10px] text-amber-600">★★★★★</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[260px] bg-white rounded-2xl p-3.5 border border-slate-100 animate-pulse">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded-full w-24" />
                  <div className="h-2 bg-slate-50 rounded-full w-32" />
                </div>
                <div className="flex gap-px">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="w-2.5 h-2.5 bg-slate-100 rounded-sm" />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                <div className="h-2.5 bg-slate-100 rounded-full w-5/6" />
                <div className="h-2.5 bg-slate-50 rounded-full w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                  AVATAR_COLORS[i % AVATAR_COLORS.length]
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
      )}
    </div>
  );
};

export default CommunityReviews;
