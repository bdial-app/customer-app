"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  timeOutline,
  closeOutline,
  trendingUpOutline,
  searchOutline,
  arrowForward,
  gridOutline,
} from "ionicons/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import {
  removeRecentSearch,
  clearRecentSearchesLocal,
} from "@/store/slices/searchSlice";
import { useTrendingSearches } from "@/hooks/useSearch";
import { useTopLevelCategories } from "@/hooks/useCategories";
import { useClearRecentSearches } from "@/hooks/useSearch";

interface Props {
  onRecentTap: (query: string) => void;
  onTrendingTap: (query: string) => void;
  onCategoryTap: (name: string, id: string) => void;
}

const CATEGORY_COLORS = [
  { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600" },
  { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600" },
  { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
  { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-600" },
  { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-600" },
  { bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-600" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" },
  { bg: "bg-pink-50", border: "border-pink-100", text: "text-pink-600" },
];

const SearchZeroState = ({ onRecentTap, onTrendingTap, onCategoryTap }: Props) => {
  const dispatch = useAppDispatch();
  const recentLocal = useAppSelector((s) => s.search.recentSearchesLocal);
  const user = useAppSelector((s) => s.auth.user as any);

  const { data: trending = [] } = useTrendingSearches(user?.city);
  const { data: categoriesData } = useTopLevelCategories();
  const clearMutation = useClearRecentSearches();

  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const handleClearAll = () => {
    dispatch(clearRecentSearchesLocal());
    clearMutation.mutate();
  };

  return (
    <div className="pb-10">
      {/* ── Recent Searches ─────────────────────── */}
      {recentLocal.length > 0 && (
        <section className="pt-4 pb-2">
          <div className="flex items-center justify-between px-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                <IonIcon icon={timeOutline} className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <h3 className="text-[13px] font-bold text-gray-800">
                Recent Searches
              </h3>
            </div>
            <button
              onClick={handleClearAll}
              className="text-[12px] font-semibold text-amber-500 active:text-amber-700 px-2 py-1 rounded-lg active:bg-amber-50 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="px-2">
            {recentLocal.slice(0, 6).map((q, i) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onRecentTap(q)}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl active:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <IonIcon
                    icon={timeOutline}
                    className="w-4 h-4 text-gray-400"
                  />
                </div>
                <span className="flex-1 text-left text-[14px] text-gray-700 font-medium capitalize truncate">
                  {q}
                </span>
                <IonIcon
                  icon={arrowForward}
                  className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 -rotate-45"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(removeRecentSearch(q));
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 active:bg-gray-200 transition-all flex-shrink-0"
                  aria-label={`Remove ${q}`}
                >
                  <IonIcon icon={closeOutline} className="w-4 h-4 text-gray-400" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Trending Searches ──────────────────── */}
      {trending.length > 0 && (
        <section className="pt-4 pb-2">
          <div className="flex items-center gap-2 px-4 mb-3">
            <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
              <IonIcon icon={trendingUpOutline} className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">
              Trending Now
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 px-4">
            {trending.map((t, i) => (
              <motion.button
                key={t.query}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onTrendingTap(t.query)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium bg-white text-gray-700 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:bg-amber-50 active:border-amber-300 active:text-amber-700 active:shadow-none transition-all capitalize"
              >
                <IonIcon icon={searchOutline} className="w-3 h-3 text-gray-400" />
                {t.query}
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* ── Popular Categories ─────────────────── */}
      {Array.isArray(categories) && categories.length > 0 && (
        <section className="pt-5">
          <div className="flex items-center gap-2 px-4 mb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
              <IonIcon icon={gridOutline} className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">
              Browse Categories
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-2 px-4">
            {(categories as any[]).slice(0, 8).map((cat: any, i: number) => {
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onCategoryTap(cat.name, cat.id)}
                  className="flex flex-col items-center gap-2 p-2.5 rounded-2xl active:scale-95 transition-transform"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${color.bg} border ${color.border} flex items-center justify-center shadow-sm overflow-hidden`}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : cat.icon ? (
                      <img
                        src={cat.icon}
                        alt=""
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <span className="text-xl">📂</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2">
                    {cat.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Empty encouragement ────────────────── */}
      {recentLocal.length === 0 && trending.length === 0 && (
        <div className="flex flex-col items-center pt-20 text-center px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-5 shadow-sm"
          >
            <IonIcon icon={searchOutline} className="w-8 h-8 text-amber-500" />
          </motion.div>
          <p className="text-[16px] font-bold text-gray-800 mb-1.5">
            Find what you need
          </p>
          <p className="text-[13px] text-gray-400 max-w-[260px] leading-relaxed">
            Search for businesses, services, products, or categories near you
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchZeroState;
