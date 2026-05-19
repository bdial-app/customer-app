"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  searchOutline,
  sparklesOutline,
  closeOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ROUTE_PATH } from "@/utils/contants";
import { useAppSelector } from "@/hooks/useAppStore";
import {
  getWomenLedHub,
  WomenLedHubParams,
  WomenLedProvider,
} from "@/services/provider.service";
import { getTopLevelCategories } from "@/services/category.service";

type SortOption = "rating" | "newest" | "reviews";

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: "rating", label: "Top Rated", icon: "⭐" },
  { value: "newest", label: "Newest", icon: "🆕" },
  { value: "reviews", label: "Most Reviews", icon: "💬" },
];

const PAGE_LIMIT = 12;

export default function WomenLedPageContent() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const guestCoords = useAppSelector((state) => state.location.guestCoords);
  const selectedCity = useAppSelector((state) => state.location.selectedCity);

  // Effective location: user profile > guest coords; selected city > user profile city
  const effectiveLat = user?.latitude ?? guestCoords?.lat;
  const effectiveLng = user?.longitude ?? guestCoords?.lng;
  const effectiveCity = selectedCity ?? user?.city ?? undefined;

  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const buildParams = useCallback(
    (page: number): WomenLedHubParams => ({
      page,
      limit: PAGE_LIMIT,
      sortBy,
      categoryIds: selectedCategory || undefined,
      lat: effectiveLat ?? undefined,
      lng: effectiveLng ?? undefined,
      city: effectiveCity,
      search: debouncedSearch || undefined,
    }),
    [sortBy, selectedCategory, effectiveLat, effectiveLng, effectiveCity, debouncedSearch],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["women-led-hub", sortBy, selectedCategory, debouncedSearch, effectiveCity, effectiveLat, effectiveLng],
    queryFn: ({ pageParam = 1 }) => getWomenLedHub(buildParams(pageParam)),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages into a single providers list
  const allProviders = useMemo(
    () => data?.pages?.flatMap((p) => p.providers) ?? [],
    [data],
  );
  const stats = data?.pages?.[0]?.stats;
  const totalCount = data?.pages?.[0]?.meta?.total ?? 0;

  const { data: categories } = useQuery({
    queryKey: ["top-level-categories"],
    queryFn: getTopLevelCategories,
    staleTime: 1000 * 60 * 30,
  });

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleProviderClick = useCallback(
    (id: string) => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${id}`),
    [router],
  );

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (sortBy !== "rating" ? 1 : 0) +
    (debouncedSearch ? 1 : 0);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FAF7FF] dark:bg-slate-900">
      {/* ─── Header ─── */}
      <div
        className="shrink-0 bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-600 dark:from-purple-900 dark:via-purple-800 dark:to-fuchsia-900 text-white"
        style={{ paddingTop: "var(--sat,0px)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 -ml-1 rounded-full active:bg-white/10 transition-colors">
            <IonIcon icon={chevronBackOutline} className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold flex items-center gap-1.5">
              <span className="text-lg">♀</span>
              Women-Led Hub
            </h1>
            {!showSearch && (
              <p className="text-[11px] text-purple-200 mt-0.5">
                Empowering women entrepreneurs
              </p>
            )}
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors"
          >
            <IonIcon icon={showSearch ? closeOutline : searchOutline} className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors"
          >
            <IonIcon icon={funnelOutline} className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 text-[9px] font-bold text-purple-900 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <IonIcon
                icon={searchOutline}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search women-led businesses..."
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-white/15 backdrop-blur-sm text-white placeholder-purple-300 text-sm font-medium border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <IonIcon icon={closeCircle} className="w-4 h-4 text-purple-300" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && stats.total > 0 && !showSearch && (
          <div className="px-4 pb-4 pt-1">
            <div className="flex gap-2">
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2.5 text-center border border-white/10">
                <p className="text-xl font-extrabold">{stats.total}</p>
                <p className="text-[9px] text-purple-200 font-medium mt-0.5 uppercase tracking-wider">
                  Businesses
                </p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2.5 text-center border border-white/10">
                <p className="text-xl font-extrabold">{stats.categoriesCovered}</p>
                <p className="text-[9px] text-purple-200 font-medium mt-0.5 uppercase tracking-wider">
                  Categories
                </p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2.5 text-center border border-white/10">
                <p className="text-xl font-extrabold flex items-center justify-center gap-0.5">
                  <IonIcon icon={star} className="w-3.5 h-3.5 text-amber-300" />
                  {Number(stats.avgRating).toFixed(1)}
                </p>
                <p className="text-[9px] text-purple-200 font-medium mt-0.5 uppercase tracking-wider">
                  Avg Rating
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Curved bottom */}
        <div className="h-4 bg-[#FAF7FF] dark:bg-slate-900 rounded-t-[24px]" />
      </div>

      {/* ─── Filters Panel ─── */}
      {showFilters && (
        <div className="shrink-0 bg-white dark:bg-slate-800 border-b border-purple-100 dark:border-slate-700 px-4 py-3 space-y-3 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-purple-400 dark:text-purple-300 mb-2 uppercase tracking-wider">
              Sort By
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    sortBy === opt.value
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-none"
                      : "bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-slate-600"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {categories && categories.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-purple-400 dark:text-purple-300 mb-2 uppercase tracking-wider">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    !selectedCategory
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-none"
                      : "bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-slate-600"
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 12).map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      selectedCategory === cat.id
                        ? "bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-none"
                        : "bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-slate-600"
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

      {/* ─── Active Filter Chips ─── */}
      {activeFilterCount > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          {debouncedSearch && (
            <span className="shrink-0 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] px-3 py-1.5 rounded-full font-semibold">
              &quot;{debouncedSearch}&quot;
              <button onClick={() => setSearchQuery("")}>
                <IonIcon icon={closeCircle} className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {sortBy !== "rating" && (
            <span className="shrink-0 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] px-3 py-1.5 rounded-full font-semibold">
              {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
              <button onClick={() => setSortBy("rating")}>
                <IonIcon icon={closeCircle} className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="shrink-0 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] px-3 py-1.5 rounded-full font-semibold">
              {categories?.find((c: any) => c.id === selectedCategory)?.name || "Category"}
              <button onClick={() => setSelectedCategory(null)}>
                <IonIcon icon={closeCircle} className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ─── Scrollable Content Area ─── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="px-4 pt-2 pb-28">
          {isLoading ? (
            /* Skeleton */
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse flex h-[120px]"
                >
                  <div className="w-[120px] shrink-0 bg-purple-100 dark:bg-slate-700" />
                  <div className="flex-1 p-3 space-y-2.5">
                    <div className="h-4 bg-purple-100 dark:bg-slate-700 rounded-lg w-3/4" />
                    <div className="h-3 bg-purple-50 dark:bg-slate-700 rounded-lg w-1/2" />
                    <div className="h-3 bg-purple-50 dark:bg-slate-700 rounded-lg w-2/3" />
                    <div className="flex gap-2">
                      <div className="h-5 w-12 bg-purple-50 dark:bg-slate-700 rounded-md" />
                      <div className="h-5 w-16 bg-purple-50 dark:bg-slate-700 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : allProviders.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-3xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-5 rotate-6">
                <span className="text-4xl">♀</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                No businesses found
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-[250px] mx-auto">
                Try adjusting your filters or search to discover women-led businesses
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSortBy("rating");
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold active:scale-95 transition-transform"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <p className="text-[11px] text-purple-400 dark:text-purple-300 mb-3 font-semibold">
                {totalCount} women-led business{totalCount !== 1 ? "es" : ""} found
              </p>

              {/* Provider List */}
              <div className="space-y-3">
                {allProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onClick={() => handleProviderClick(provider.id)}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={observerRef} className="h-1" />

              {/* Loading more */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-purple-400 font-medium">Loading more...</span>
                </div>
              )}

              {/* End of list */}
              {!hasNextPage && allProviders.length > 0 && (
                <p className="text-center text-[11px] text-gray-400 dark:text-slate-500 py-6 font-medium">
                  You&apos;ve seen all {totalCount} businesses ✨
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Provider Card Component ─── */
function ProviderCard({
  provider,
  onClick,
}: {
  provider: WomenLedProvider;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all duration-150 ${
        provider.isSponsored
          ? "border-2 border-amber-300/60 dark:border-amber-600/40 shadow-amber-100/50 dark:shadow-none"
          : "border border-purple-100/60 dark:border-slate-700"
      }`}
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-[110px] shrink-0 overflow-hidden bg-purple-50 dark:bg-slate-700">
          {provider.image ? (
            <img
              src={provider.image}
              alt={provider.name}
              className="w-full h-full object-cover min-h-[120px]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full min-h-[120px] flex items-center justify-center bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30">
              <span className="text-4xl font-bold text-purple-300 dark:text-purple-600">
                {provider.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Sponsored badge */}
          {provider.isSponsored && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-[8px] font-extrabold text-amber-900 text-center py-0.5 tracking-wider uppercase flex items-center justify-center gap-0.5">
              <IonIcon icon={sparklesOutline} className="w-2.5 h-2.5" />
              Featured
            </div>
          )}

          {/* Rating pill */}
          {provider.rating > 0 && (
            <div className="absolute bottom-1.5 left-1.5 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-[3px] rounded-lg flex items-center gap-0.5">
              <IonIcon icon={star} className="w-2.5 h-2.5" />
              {provider.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div>
            {/* Name + badges */}
            <div className="flex items-start gap-1.5">
              <h4 className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-1 flex-1">
                {provider.name}
              </h4>
              <div className="flex items-center gap-1 shrink-0">
                {provider.verified && (
                  <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <IonIcon icon={shieldCheckmarkOutline} className="w-3 h-3 text-emerald-500" />
                  </div>
                )}
                <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <IonIcon icon={ribbonOutline} className="w-2.5 h-2.5 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Services */}
            {provider.services && (
              <p className="text-[11px] text-purple-500 dark:text-purple-400 mt-1 line-clamp-1 font-medium">
                {provider.services}
              </p>
            )}

            {/* Description */}
            {provider.description && (
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {provider.description}
              </p>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-2 mt-2">
            {provider.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                <IonIcon icon={locationOutline} className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[100px]">{provider.location}</span>
              </span>
            )}
            {provider.distance != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-500 dark:text-blue-400 font-semibold">
                <IonIcon icon={navigateOutline} className="w-3 h-3 shrink-0" />
                {provider.distance < 1
                  ? `${Math.round(provider.distance * 1000)}m`
                  : `${provider.distance.toFixed(1)} km`}
              </span>
            )}
            {provider.reviewCount > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                {provider.reviewCount} review{provider.reviewCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
