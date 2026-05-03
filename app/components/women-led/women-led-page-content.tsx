"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  chevronBackOutline,
  ribbonOutline,
  star,
  locationOutline,
  navigateOutline,
  shieldCheckmarkOutline,
  funnelOutline,
  closeCircle,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ROUTE_PATH } from "@/utils/contants";
import { useAppSelector } from "@/hooks/useAppStore";
import { getWomenLedHub, WomenLedHubParams } from "@/services/provider.service";
import { getTopLevelCategories } from "@/services/category.service";

type SortOption = "rating" | "newest" | "reviews";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
  { value: "reviews", label: "Most Reviews" },
];

export default function WomenLedPageContent() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const params: WomenLedHubParams = useMemo(
    () => ({
      page,
      limit: 12,
      sortBy,
      categoryIds: selectedCategory || undefined,
      lat: user?.latitude ?? undefined,
      lng: user?.longitude ?? undefined,
      city: user?.city ?? undefined,
    }),
    [page, sortBy, selectedCategory, user],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["women-led-hub", params],
    queryFn: () => getWomenLedHub(params),
  });

  const { data: categories } = useQuery({
    queryKey: ["top-level-categories"],
    queryFn: getTopLevelCategories,
    staleTime: 1000 * 60 * 30,
  });

  const providers = data?.providers || [];
  const stats = data?.stats;
  const meta = data?.meta;

  const handleProviderClick = useCallback(
    (id: string) => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${id}`),
    [router],
  );

  return (
    <div className="min-h-screen bg-[#efeff4] dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-purple-700 dark:bg-purple-900 text-white safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <IonIcon icon={chevronBackOutline} className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-1.5">
              <IonIcon icon={ribbonOutline} className="w-5 h-5" />
              Women-Led Businesses
            </h1>
            <p className="text-xs text-purple-200 mt-0.5">Supporting women entrepreneurs</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full bg-white/10"
          >
            <IonIcon icon={funnelOutline} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Hero */}
      {stats && stats.total > 0 && (
        <div className="bg-gradient-to-b from-purple-700 to-purple-600 dark:from-purple-900 dark:to-purple-800 px-4 pb-6 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] text-purple-200 mt-0.5">Businesses</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{stats.categoriesCovered}</p>
              <p className="text-[10px] text-purple-200 mt-0.5">Categories</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white flex items-center justify-center gap-0.5">
                <IonIcon icon={star} className="w-4 h-4 text-amber-300" />
                {Number(stats.avgRating).toFixed(1)}
              </p>
              <p className="text-[10px] text-purple-200 mt-0.5">Avg Rating</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-4 py-3 space-y-3">
          {/* Sort */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Sort By</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sortBy === opt.value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories && categories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setSelectedCategory(null); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    !selectedCategory
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 12).map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Chips */}
      {(selectedCategory || sortBy !== "rating") && (
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {sortBy !== "rating" && (
            <span className="shrink-0 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
              <button onClick={() => setSortBy("rating")}>
                <IonIcon icon={closeCircle} className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="shrink-0 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {categories?.find((c: any) => c.id === selectedCategory)?.name || "Category"}
              <button onClick={() => setSelectedCategory(null)}>
                <IonIcon icon={closeCircle} className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      <div className="px-4 pt-3 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-[130px] bg-gray-200 dark:bg-slate-700" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <IonIcon icon={ribbonOutline} className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">No businesses found</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Count */}
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Showing {providers.length} of {meta?.total || 0} women-led businesses
            </p>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider: any) => (
                <div
                  key={provider.id}
                  onClick={() => handleProviderClick(provider.id)}
                  className="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-purple-100 dark:border-purple-900/30 shadow-sm active:scale-[0.97] transition-transform"
                >
                  {/* Image */}
                  <div className="relative h-[120px] overflow-hidden bg-gray-100 dark:bg-slate-700">
                    {provider.image ? (
                      <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                        <span className="text-3xl font-bold text-purple-200 dark:text-purple-700">{provider.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                    )}
                    {/* Women-Led Badge */}
                    <div className="absolute top-2 right-2 bg-purple-600/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-[2px] rounded-md flex items-center gap-0.5">
                      <IonIcon icon={ribbonOutline} className="w-2.5 h-2.5" />
                      <span>♀</span>
                    </div>
                    {/* Verified */}
                    {provider.verified && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-md p-0.5">
                        <IonIcon icon={shieldCheckmarkOutline} className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                    {/* Rating */}
                    {provider.rating > 0 && (
                      <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-[2px] rounded-md flex items-center gap-0.5">
                        <IonIcon icon={star} className="w-2.5 h-2.5" />
                        {Number(provider.rating).toFixed(1)}
                      </div>
                    )}
                    {/* Distance */}
                    {provider.distance != null && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-[2px] rounded-md flex items-center gap-0.5">
                        <IonIcon icon={navigateOutline} className="w-2.5 h-2.5" />
                        {provider.distance < 1 ? `${Math.round(provider.distance * 1000)}m` : `${provider.distance.toFixed(1)} km`}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-2.5 py-2">
                    <h4 className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{provider.name}</h4>
                    {provider.services && (
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{provider.services}</p>
                    )}
                    {provider.location && (
                      <div className="flex items-center gap-0.5 mt-1 text-[9px] text-gray-400 dark:text-slate-500">
                        <IonIcon icon={locationOutline} className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{provider.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {page} / {meta.totalPages}
                </span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
