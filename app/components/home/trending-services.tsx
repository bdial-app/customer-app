"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { IonIcon } from "@ionic/react";
import {
  flameOutline,
  trendingUpOutline,
  trendingDownOutline,
  peopleOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import { inflateIfLow } from "@/utils/inflate-stats";
import type { TrendingCategory } from "@/services/home.service";

interface TrendingItem {
  id: string;
  label: string;
  weeklyBookings: number;
  displayBookings: number;
  providerCount: number;
  growthRate: number;
  trendDirection: "up" | "down" | "stable";
  gradient: string;
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

function formatGrowth(rate: number): string {
  const pct = Math.abs(Math.round(rate * 100));
  if (pct > 500) return "500%+";
  return `${pct}%`;
}

interface TrendingServicesProps {
  categories?: TrendingCategory[];
  isLoading?: boolean;
}

const TrendingServices = ({ categories, isLoading }: TrendingServicesProps) => {
  const router = useRouter();

  const trendingItems: TrendingItem[] = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return [];
    return categories.map((c, i) => ({
      id: c.id,
      label: c.name,
      weeklyBookings: c.weeklyBookings ?? c.recentBookings ?? 0,
      displayBookings: inflateIfLow(
        c.weeklyBookings ?? c.recentBookings ?? 0,
        `trending_${c.slug}`,
        5,
        25,
      ),
      providerCount: c.providerCount ?? 0,
      growthRate: c.growthRate ?? 0,
      trendDirection: c.trendDirection ?? "stable",
      gradient: GRADIENT_POOL[i % GRADIENT_POOL.length],
      slug: c.slug,
    }));
  }, [categories]);

  if (trendingItems.length === 0 && !isLoading) return null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <IonIcon icon={flameOutline} className="text-orange-500 text-base" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
            Trending This Week
          </h2>
        </div>
        <button
          onClick={() => router.push(ROUTE_PATH.CATEGORIES)}
          className="text-xs font-semibold text-amber-600 dark:text-amber-400"
        >
          See All
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[150px] rounded-2xl bg-slate-100 dark:bg-slate-800 p-3.5 animate-pulse h-[112px]"
            >
              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mb-3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/5 mb-2" />
              <div className="h-2.5 bg-slate-200/60 dark:bg-slate-700/60 rounded w-2/5 mb-2" />
              <div className="h-2.5 bg-slate-200/40 dark:bg-slate-700/40 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {trendingItems.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: idx * 0.06,
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                router.push(
                  `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(t.label)}&categoryIds=${t.id}`,
                )
              }
              className={`shrink-0 w-[150px] rounded-2xl bg-gradient-to-br ${t.gradient} p-3.5 cursor-pointer relative overflow-hidden`}
            >
              {/* Subtle decorative circle */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/[0.06]" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/[0.04]" />

              <div className="relative z-10 flex flex-col">
                {/* Category name */}
                <h4 className="text-[13px] font-bold text-white leading-snug mb-2">
                  {t.label}
                </h4>

                {/* Weekly booking count */}
                <p className="text-lg font-extrabold text-white leading-none">
                  {t.displayBookings}
                </p>
                <p className="text-[10px] font-medium text-white/70 mt-0.5 mb-2">
                  bookings this week
                </p>

                {/* Bottom row: trend + providers */}
                <div className="flex items-center justify-between">
                  {t.trendDirection === "up" && t.weeklyBookings > 0 ? (
                    <div className="flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-[3px]">
                      <IonIcon
                        icon={trendingUpOutline}
                        className="text-white text-[10px]"
                      />
                      <span className="text-[10px] font-semibold text-white leading-none">
                        {formatGrowth(t.growthRate)}
                      </span>
                    </div>
                  ) : t.trendDirection === "down" ? (
                    <div className="flex items-center gap-0.5 bg-white/10 rounded-full px-1.5 py-[3px]">
                      <IonIcon
                        icon={trendingDownOutline}
                        className="text-white/60 text-[10px]"
                      />
                      <span className="text-[10px] text-white/60 leading-none">
                        {formatGrowth(t.growthRate)}
                      </span>
                    </div>
                  ) : t.weeklyBookings > 0 ? (
                    <div className="bg-white/15 rounded-full px-1.5 py-[3px]">
                      <span className="text-[10px] font-medium text-white/70 leading-none">
                        Steady
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white/20 rounded-full px-1.5 py-[3px]">
                      <span className="text-[10px] font-semibold text-white leading-none">
                        New
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-0.5 text-white/50">
                    <IonIcon icon={peopleOutline} className="text-[10px]" />
                    <span className="text-[10px] leading-none">
                      {t.providerCount}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Browse all pill */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(ROUTE_PATH.CATEGORIES)}
            className="shrink-0 w-[80px] rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <IonIcon
                icon={chevronForwardOutline}
                className="text-slate-500 dark:text-slate-400 text-sm"
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              View all
            </span>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TrendingServices;
