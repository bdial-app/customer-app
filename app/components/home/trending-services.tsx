"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { IonIcon } from "@ionic/react";
import { flameOutline } from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import type { TrendingCategory } from "@/services/home.service";

interface TrendingItem {
  id: string;
  label: string;
  bookings: string;
  gradient: string;
  abstractPath: string;
  slug: string;
}

const GRADIENT_POOL = [
  "from-sky-400 to-blue-600",
  "from-amber-400 to-orange-600",
  "from-pink-400 to-rose-600",
  "from-emerald-400 to-green-600",
  "from-violet-400 to-purple-600",
  "from-cyan-400 to-teal-600",
  "from-red-400 to-rose-600",
  "from-indigo-400 to-blue-600",
  "from-lime-400 to-green-600",
  "from-fuchsia-400 to-pink-600",
];

const ABSTRACT_PATHS = [
  "M4 24 C12 10 20 38 28 24 S44 10 44 24",
  "M8 8 L40 8 L24 40 Z",
  "M24 8 A16 16 0 1 0 24 40 A16 16 0 1 0 24 8 M24 16 A8 8 0 1 1 24 32",
  "M4 40 L12 16 L20 32 L28 8 L36 28 L44 12",
  "M24 4 L42 15 V33 L24 44 L6 33 V15 Z",
  "M8 24 Q24 4 40 24 Q24 44 8 24",
];

function formatBookings(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k this week`;
  if (count > 0) return `${count} this week`;
  return "Explore";
}

interface TrendingServicesProps {
  categories?: TrendingCategory[];
  isLoading?: boolean;
}

const TrendingServices = ({ categories, isLoading }: TrendingServicesProps) => {
  const router = useRouter();

  const trendingItems: TrendingItem[] = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories.map((c, i) => ({
      id: c.id,
      label: c.name,
      bookings: formatBookings(c.recentBookings),
      gradient: GRADIENT_POOL[i % GRADIENT_POOL.length],
      abstractPath: ABSTRACT_PATHS[i % ABSTRACT_PATHS.length],
      slug: c.slug,
    }));
  }, [categories]);

  if (trendingItems.length === 0 && !isLoading) return null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
            Trending Now
          </h2>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-base"
          >
            <IonIcon icon={flameOutline} className="text-orange-500" />
          </motion.span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[130px] rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 animate-pulse h-[100px]"
            >
              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5 mb-2" />
              <div className="h-2.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full w-3/5 mb-3" />
              <div className="flex -space-x-1.5">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {trendingItems.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: idx * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                router.push(
                  `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(t.label)}`,
                )
              }
              className={`shrink-0 w-[130px] rounded-2xl bg-gradient-to-br ${t.gradient} p-3 cursor-pointer relative overflow-hidden`}
            >
              {/* Abstract background shape */}
              <svg
                viewBox="0 0 48 48"
                className="absolute inset-0 w-full h-full text-white/[0.08]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d={t.abstractPath} />
              </svg>

              <div className="relative z-10">
                <h4 className="text-sm font-bold text-white">{t.label}</h4>
                <p className="text-[10px] text-white/60 mt-0.5">{t.bookings}</p>
                <div className="flex items-center gap-1 mt-2.5">
                  <div className="flex -space-x-1.5">
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="w-4 h-4 rounded-full bg-white/20 border border-white/30"
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-white/50">+more</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingServices;
