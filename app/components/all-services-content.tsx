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
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";

import ProviderList from "../components/provider-list";
import FilterChips from "../components/filter-chips";
import FilterSheet from "../components/filter-sheet";
import EmptyState from "../components/empty-state";
import InfiniteScroll from "../components/infinite-scroll";
import { useReverseGeocode } from "@/hooks/useGeocode";
import { useNearbyProviders } from "@/hooks/useProvider";
import { useAppSelector } from "@/hooks/useAppStore";
import { useDebounce } from "@/hooks/useDebounce";

type SortOption = "relevance" | "rating" | "distance" | "reviews";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Highest Rated" },
  { value: "distance", label: "Nearest First" },
  { value: "reviews", label: "Most Reviewed" },
];

const AllServicesContent = ({ isSheet = false }: { isSheet?: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [sheetOpened, setSheetOpened] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set(),
  );

  // Keep internal state in sync if the URL changes
  useEffect(() => {
    const next = searchParams.get("search") ?? "";
    setSearchQuery((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const user = useAppSelector((state) => state.auth.user as any);

  const { data: addressData } = useReverseGeocode(
    user?.latitude && user?.longitude
      ? { lat: user.latitude, lng: user.longitude }
      : null,
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isProvidersLoading,
    isFetching,
  } = useNearbyProviders({
    lat: user?.latitude || 18.5204,
    lng: user?.longitude || 73.8567,
    search: debouncedSearch,
    city: addressData?.city,
    categoryIds: Array.from(selectedFilters),
    limit: 12,
    radius: 15,
  });

  const providers = useMemo(() => {
    if (!data) return [];
    const mapped = data.pages.flatMap((page) =>
      page.data.map((p: any) => ({
        ...p,
        name: p.brandName,
        image:
          p.profilePhotoUrl || p.bannerImageUrl || "",
        location: [p.area, p.city].filter(Boolean).join(", "),
        rating: p.rating ?? null,
        reviews: p.reviewCount ?? 0,
        verified: p.status === "active",
        service: p.services || p.description?.split(",")[0] || "Services",
        distance: p.distance,
        womenLed: p.isWomenLed || false,
      })),
    );

    // Client-side sorting
    const sorted = [...mapped];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "distance":
        sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        break;
      case "reviews":
        sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [data, sortBy]);

  const activeFilterCount = selectedFilters.size;
  const totalCount = data?.pages?.[0]?.meta?.total ?? providers.length;
  const isSearching = isFetching && !isFetchingNextPage && !isProvidersLoading;

  const handleRemoveFilter = useCallback((filterId: string) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      next.delete(filterId);
      return next;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedFilters(new Set());
  }, []);

  const handleApplyFilters = useCallback((filters: Set<string>) => {
    setSelectedFilters(new Set(filters));
    setSheetOpened(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, []);

  return (
    <Page className="!bg-[#FAFAFA]">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 bg-white border-b border-gray-100"
        style={{ paddingTop: isSheet ? "0px" : "env(safe-area-inset-top)" }}
      >
        {/* Title row */}
        {!isSheet && (
          <div className="flex items-center gap-3 px-4 pt-3 pb-1">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors"
              aria-label="Back"
            >
              <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-800" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                {initialSearch || "All Services"}
              </h1>
              {!isProvidersLoading && (
                <p className="text-[11px] text-gray-400 -mt-0.5">
                  {totalCount} {totalCount === 1 ? "service" : "services"} found
                  {addressData?.city ? ` in ${addressData.city}` : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-2.5">
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
              className="w-full h-11 pl-10 pr-10 rounded-2xl bg-gray-50 border border-gray-100 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300 transition-all"
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
                : "bg-white text-gray-700 border-gray-100 hover:border-gray-200"
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

        {/* Filter chips + sort */}
        {(activeFilterCount > 0 || providers.length > 0) && (
          <div className="flex items-center gap-2 px-4 pb-2.5">
            {activeFilterCount > 0 ? (
              <div className="flex-1 overflow-hidden">
                <FilterChips
                  selectedFilters={selectedFilters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}
            {/* Sort button */}
            {providers.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 active:bg-gray-100 transition-colors"
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
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px]">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                            sortBy === opt.value
                              ? "text-amber-600 font-semibold bg-amber-50/50"
                              : "text-gray-700 hover:bg-gray-50"
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
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
            >
              <div className="h-[140px] bg-gray-100" />
              <div className="p-2.5 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
                <div className="h-2.5 bg-gray-50 rounded-full w-3/5" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-gray-100 rounded-md" />
                  <div className="h-3 w-10 bg-gray-50 rounded-full mt-1" />
                </div>
                <div className="h-3 bg-gray-50 rounded-full w-2/3" />
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
        <div className="pt-3 pb-6">
          <InfiniteScroll
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          >
            <ProviderList providerList={providers} />
          </InfiniteScroll>
        </div>
      )}

      <FilterSheet
        opened={sheetOpened}
        selectedFilters={selectedFilters}
        onClose={() => setSheetOpened(false)}
        onApply={handleApplyFilters}
      />
    </Page>
  );
};

export default AllServicesContent;
