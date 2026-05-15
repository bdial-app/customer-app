"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Page } from "konsta/react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import {
  arrowBack,
  optionsOutline,
  searchOutline,
  closeCircle,
  chevronDown,
  swapVerticalOutline,
  gridOutline,
  listOutline,
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";

import ProviderCard from "../components/provider-card";
import FilterChips from "../components/filter-chips";
import FilterSheet, { type AllServicesFilters } from "../components/filter-sheet";
import QuickFilterPills, { type QuickFilters } from "../components/all-services-quick-filters";
import EmptyState from "../components/empty-state";
import InfiniteScroll from "../components/infinite-scroll";
import { useReverseGeocode } from "@/hooks/useGeocode";
import { useNearbyProviders } from "@/hooks/useProvider";
import { useAppSelector } from "@/hooks/useAppStore";
import { useAppDispatch } from "@/hooks/useAppStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getItemSync, setItemSync } from "@/utils/storage";
import { setGuestCoords } from "@/store/slices/locationSlice";

type SortOption = "relevance" | "rating" | "distance" | "reviews";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Highest Rated" },
  { value: "distance", label: "Nearest First" },
  { value: "reviews", label: "Most Reviewed" },
];

const EMPTY_FILTERS: AllServicesFilters = {
  categoryIds: new Set(),
  minRating: null,
  maxDistance: null,
  verifiedOnly: false,
  womenLedOnly: false,
};

const AllServicesContent = ({ isSheet = false }: { isSheet?: boolean }) => {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [sheetOpened, setSheetOpened] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Read URL params for pre-selected filters from home page "See All" buttons
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const urlSort = searchParams.get("sort");
    if (urlSort && ["relevance", "rating", "distance", "reviews"].includes(urlSort)) {
      return urlSort as SortOption;
    }
    return "relevance";
  });

  const [filters, setFilters] = useState<AllServicesFilters>(() => {
    const catIds = searchParams.get("categoryIds");
    const minRating = searchParams.get("minRating");
    const maxDistance = searchParams.get("maxDistance");
    const verified = searchParams.get("verified");
    const womenLed = searchParams.get("womenLed");
    return {
      categoryIds: catIds ? new Set(catIds.split(",").filter(Boolean)) : new Set(),
      minRating: minRating ? parseFloat(minRating) : null,
      maxDistance: maxDistance ? parseFloat(maxDistance) : null,
      verifiedOnly: verified === "true",
      womenLedOnly: womenLed === "true",
    };
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (getItemSync("allServicesView") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  // Quick filters derived from main filters
  const quickFilters: QuickFilters = useMemo(
    () => ({
      verifiedOnly: filters.verifiedOnly,
      womenLedOnly: filters.womenLedOnly,
      topRated: filters.minRating !== null && filters.minRating >= 4,
      nearby: filters.maxDistance !== null && filters.maxDistance <= 5,
    }),
    [filters],
  );

  // Keep internal state in sync if the URL changes
  useEffect(() => {
    const next = searchParams.get("search") ?? "";
    setSearchQuery((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  // Persist view mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      setItemSync("allServicesView", viewMode);
    }
  }, [viewMode]);

  const user = useAppSelector((state) => state.auth.user as any);
  const guestCoords = useAppSelector((state) => state.location.guestCoords);
  const selectedCity = useAppSelector((state) => state.location.selectedCity);

  // Effective location: user profile coords > guest coords from location picker
  const effectiveLat = user?.latitude ?? guestCoords?.lat;
  const effectiveLng = user?.longitude ?? guestCoords?.lng;

  // Auto-request geolocation when page opens without coordinates (fire-and-forget)
  useEffect(() => {
    if (effectiveLat || effectiveLng) return; // already have coordinates
    let cancelled = false;
    import("@/utils/geolocation").then(({ getCurrentPosition }) => {
      getCurrentPosition({ timeout: 10000 }).then((pos) => {
        if (!cancelled) {
          dispatch(setGuestCoords({ lat: pos.latitude, lng: pos.longitude }));
        }
      }).catch(() => {
        // Silently continue — page loads city-only or all providers
      });
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: addressData } = useReverseGeocode(
    !selectedCity && effectiveLat && effectiveLng
      ? { lat: effectiveLat, lng: effectiveLng }
      : null,
  );

  // Effective city: selected city > reverse-geocoded city > user profile city
  const effectiveCity = selectedCity ?? addressData?.city ?? user?.city;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isProvidersLoading,
    isFetching,
  } = useNearbyProviders({
    lat: effectiveLat,
    lng: effectiveLng,
    search: debouncedSearch,
    city: effectiveCity,
    categoryIds: Array.from(filters.categoryIds),
    limit: 12,
    radius: filters.maxDistance || 15,
    sortBy: sortBy === "relevance" ? undefined : sortBy,
    minRating: filters.minRating ?? undefined,
    verifiedOnly: filters.verifiedOnly || undefined,
    womenLedOnly: filters.womenLedOnly || undefined,
  });

  const providers = useMemo(() => {
    if (!data) return [];
    const mapped = data.pages.flatMap((page) =>
      (Array.isArray(page?.data) ? page.data : []).map((p: any) => ({
        id: p.id,
        name: p.brandName,
        image: p.profilePhotoUrl || p.bannerImageUrl || "",
        location: [p.area, p.city].filter(Boolean).join(", "),
        rating: p.rating ?? null,
        reviews: p.reviewCount ?? 0,
        verified: p.status === "active",
        service: p.services || p.description?.split(",")[0] || "Services",
        distance: p.distance,
        womenLed: p.isWomenLed || false,
        featured: p.isFeatured || false,
      })),
    );
    // Sponsored/featured providers float to top
    return mapped.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [data]);

  const activeFilterCount =
    filters.categoryIds.size +
    (filters.minRating ? 1 : 0) +
    (filters.maxDistance ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.womenLedOnly ? 1 : 0);
  const totalCount = data?.pages?.[0]?.meta?.total ?? providers.length;
  const isSearching = isFetching && !isFetchingNextPage && !isProvidersLoading;

  // Quick filter toggle
  const handleQuickToggle = useCallback((key: keyof QuickFilters) => {
    setFilters((prev) => {
      const next = { ...prev, categoryIds: new Set(prev.categoryIds) };
      switch (key) {
        case "verifiedOnly":
          next.verifiedOnly = !prev.verifiedOnly;
          break;
        case "womenLedOnly":
          next.womenLedOnly = !prev.womenLedOnly;
          break;
        case "topRated":
          next.minRating = prev.minRating && prev.minRating >= 4 ? null : 4;
          break;
        case "nearby":
          next.maxDistance = prev.maxDistance && prev.maxDistance <= 5 ? null : 5;
          break;
      }
      return next;
    });
  }, []);

  // Filter chip removals
  const handleRemoveCategory = useCallback((id: string) => {
    setFilters((prev) => {
      const next = new Set(prev.categoryIds);
      next.delete(id);
      return { ...prev, categoryIds: next };
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS, categoryIds: new Set() });
  }, []);

  const handleApplyFilters = useCallback((f: AllServicesFilters) => {
    setFilters({ ...f, categoryIds: new Set(f.categoryIds) });
    setSheetOpened(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, []);

  return (
    <Page className="!bg-[#FAFAFA] dark:!bg-slate-950">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800"
        style={{ paddingTop: isSheet ? "0px" : "var(--sat,0px)" }}
      >
        {/* Title row */}
        {!isSheet && (
          <div className="flex items-center gap-3 px-4 pt-3 pb-1">
            <button
              onClick={() => goBack("/")}
              className="w-9 h-9 -ml-1 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-full active:scale-90 transition-transform"
              aria-label="Back"
            >
              <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {initialSearch || "All Services"}
              </h1>
              {!isProvidersLoading && (
                <p className="text-[11px] text-gray-400 dark:text-slate-500 -mt-0.5">
                  {totalCount} {totalCount === 1 ? "service" : "services"} found
                  {addressData?.city ? ` in ${addressData.city}` : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-2">
          <div className="flex-1 relative">
            <IonIcon
              icon={searchOutline}
              className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              placeholder="Search services, providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300 dark:focus:border-amber-500 transition-all"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 active:text-gray-600"
                aria-label="Clear search"
              >
                <IonIcon icon={closeCircle} className="w-4.5 h-4.5" />
              </button>
            )}
            {isSearching && (
              <span className="absolute right-9 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            )}
          </div>
          <button
            onClick={() => setSheetOpened(true)}
            className={`relative h-11 px-3.5 rounded-2xl flex items-center gap-1.5 text-[13px] font-semibold transition-all active:scale-[0.97] border ${
              activeFilterCount > 0
                ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200/50"
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-100 dark:border-slate-700"
            }`}
            aria-label="Open filters"
          >
            <IonIcon icon={optionsOutline} className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="h-[18px] min-w-[18px] px-1 bg-white text-amber-600 text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick filter pills */}
        <div className="px-4 pb-2">
          <QuickFilterPills filters={quickFilters} onToggle={handleQuickToggle} />
        </div>

        {/* Filter chips + sort + view toggle */}
        {(activeFilterCount > 0 || providers.length > 0) && (
          <div className="flex items-center gap-2 px-4 pb-2.5">
            {activeFilterCount > 0 ? (
              <div className="flex-1 overflow-hidden">
                <FilterChips
                  filters={filters}
                  onRemoveCategory={handleRemoveCategory}
                  onRemoveRating={() => setFilters((f) => ({ ...f, minRating: null }))}
                  onRemoveDistance={() => setFilters((f) => ({ ...f, maxDistance: null }))}
                  onRemoveVerified={() => setFilters((f) => ({ ...f, verifiedOnly: false }))}
                  onRemoveWomenLed={() => setFilters((f) => ({ ...f, womenLedOnly: false }))}
                  onClearAll={handleClearAllFilters}
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* View toggle */}
            {providers.length > 0 && (
              <button
                onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 active:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle view"
              >
                <IonIcon icon={viewMode === "grid" ? listOutline : gridOutline} className="w-4 h-4" />
              </button>
            )}

            {/* Sort button */}
            {providers.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700 active:bg-gray-100 dark:active:bg-slate-700 transition-colors"
                >
                  <IonIcon icon={swapVerticalOutline} className="w-3 h-3" />
                  {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
                  <IonIcon icon={chevronDown} className="w-3 h-3" />
                </button>
                {showSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 min-w-[160px]">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                            sortBy === opt.value
                              ? "text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/50 dark:bg-amber-900/20"
                              : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {isProvidersLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-pulse"
            >
              <div className="h-[140px] bg-gray-100 dark:bg-slate-800" />
              <div className="p-2.5 space-y-2">
                <div className="h-3.5 bg-gray-100 dark:bg-slate-700 rounded-full w-4/5" />
                <div className="h-2.5 bg-gray-50 dark:bg-slate-800 rounded-full w-3/5" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-gray-100 dark:bg-slate-700 rounded-md" />
                  <div className="h-3 w-10 bg-gray-50 dark:bg-slate-800 rounded-full mt-1" />
                </div>
                <div className="h-3 bg-gray-50 dark:bg-slate-800 rounded-full w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          activeFilterCount={activeFilterCount}
          onClearSearch={handleClearSearch}
          onClearFilters={handleClearAllFilters}
        />
      ) : (
        <div className="pt-2 pb-6">
          {/* Results context bar */}
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              <span className="font-semibold text-gray-700 dark:text-slate-300">{totalCount}</span> {totalCount === 1 ? "result" : "results"}
              {sortBy !== "relevance" && (
                <span> &middot; {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}</span>
              )}
            </p>
          </div>
          <InfiniteScroll
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3 px-4">
                {providers.map((p, i) => (
                  <ProviderCard key={p.id} provider={p} index={i} variant="grid" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-4">
                {providers.map((p, i) => (
                  <ProviderCard key={p.id} provider={p} index={i} variant="list" />
                ))}
              </div>
            )}
          </InfiniteScroll>
        </div>
      )}

      <FilterSheet
        opened={sheetOpened}
        filters={filters}
        onClose={() => setSheetOpened(false)}
        onApply={handleApplyFilters}
      />
    </Page>
  );
};

export default AllServicesContent;
