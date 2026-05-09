"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  optionsOutline,
  swapVerticalOutline,
  checkmark,
  searchOutline,
  sadOutline,
} from "ionicons/icons";
import { useState, useCallback } from "react";
import { useSearchResults } from "@/hooks/useSearch";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import {
  setActiveTab,
  setSortBy,
  setCategoryIds,
  resetFilters,
} from "@/store/slices/searchSlice";
import type { SearchEntityType, SearchSortBy, ProviderSearchResult } from "@/services/search.service";

import SearchFilterSheet from "./search-filter-sheet";
import SearchFilterChips from "./search-filter-chips";
import ProviderResultCard from "./cards/provider-result-card";
import ProductResultCard from "./cards/product-result-card";
import CategoryResultCard from "./cards/category-result-card";
import InfiniteScroll from "../infinite-scroll";

const TABS: { key: SearchEntityType; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "🔍" },
  { key: "providers", label: "Businesses", icon: "🏪" },
  { key: "products", label: "Products", icon: "📦" },
  { key: "categories", label: "Categories", icon: "📂" },
];

const SORT_OPTIONS: { value: SearchSortBy; label: string; icon: string }[] = [
  { value: "relevance", label: "Most Relevant", icon: "✨" },
  { value: "distance", label: "Nearest First", icon: "📍" },
  { value: "rating", label: "Top Rated", icon: "⭐" },
  { value: "newest", label: "Newest First", icon: "🆕" },
];

interface Props {
  query: string;
  lat?: number;
  lng?: number;
  city?: string;
  onCategoryTap?: (name: string, id: string) => void;
}

const SearchResultsView = ({ query, lat, lng, city, onCategoryTap }: Props) => {
  const dispatch = useAppDispatch();
  const { activeTab, filters } = useAppSelector((s) => s.search);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const searchParams = useMemo(
    () => ({
      q: query,
      lat,
      lng,
      radius: filters.maxDistance ?? 25,
      type: activeTab,
      categoryIds: filters.categoryIds.length ? filters.categoryIds : undefined,
      sortBy: filters.sortBy,
      minRating: filters.minRating ?? undefined,
      city,
      limit: activeTab === "all" ? 50 : 10,
      verifiedOnly: filters.verifiedOnly || undefined,
      womenLedOnly: filters.womenLedOnly || undefined,
    }),
    [query, lat, lng, activeTab, filters, city]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useSearchResults({ ...searchParams, enabled: !!query });

  const results = useMemo(() => {
    if (!data?.pages) return null;
    const first = data.pages[0];
    if (activeTab === "all") return first;

    if (activeTab === "providers") {
      return {
        ...first,
        providers: {
          data: data.pages.flatMap((p) => p.providers.data),
          total: first.providers.total,
        },
      };
    }
    if (activeTab === "products") {
      return {
        ...first,
        products: {
          data: data.pages.flatMap((p) => p.products.data),
          total: first.products.total,
        },
      };
    }
    if (activeTab === "categories") {
      return {
        ...first,
        categories: {
          data: data.pages.flatMap((p) => p.categories.data),
          total: first.categories.total,
        },
      };
    }
    return first;
  }, [data, activeTab]);

  const totalResults = results?.meta?.totalResults ?? 0;
  const tookMs = results?.meta?.tookMs ?? 0;

  const activeFilterCount =
    filters.categoryIds.length +
    (filters.minRating ? 1 : 0) +
    (filters.maxDistance ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.womenLedOnly ? 1 : 0);

  return (
    <div className="flex flex-col">
      {/* ── Tabs ──────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800">
        <div className="flex items-stretch overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "all"
                ? totalResults
                : tab.key === "providers"
                  ? results?.providers?.total ?? 0
                  : tab.key === "products"
                    ? results?.products?.total ?? 0
                    : results?.categories?.total ?? 0;

            return (
              <button
                key={tab.key}
                onClick={() => dispatch(setActiveTab(tab.key))}
                className={`relative flex-1 min-w-0 flex flex-col items-center gap-0.5 px-3 pt-3 pb-2.5 text-center transition-colors ${
                  isActive
                    ? "text-amber-600"
                    : "text-gray-400 active:text-gray-600"
                }`}
              >
                <span className="text-[13px] font-semibold whitespace-nowrap">
                  {tab.label}
                </span>
                {!isLoading && count > 0 && (
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      isActive ? "text-amber-500" : "text-gray-400"
                    }`}
                  >
                    {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="search-tab-indicator"
                    className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-amber-500 rounded-t-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-gray-100 dark:bg-slate-700" />
      </div>

      {/* ── Filter bar ────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-b border-gray-50 dark:border-slate-700">
        {/* Filter button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilterSheetOpen(true)}
          className={`h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-[12px] font-bold transition-all border ${
            activeFilterCount > 0
              ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200"
              : "bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 shadow-sm"
          }`}
        >
          <IonIcon icon={optionsOutline} className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="h-[18px] min-w-[18px] px-0.5 bg-white text-amber-600 text-[10px] font-black rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </motion.button>

        <SearchFilterChips />

        <div className="flex-1" />

        {/* Sort dropdown */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSortMenu((v) => !v)}
            className="flex items-center gap-1 h-9 px-3 rounded-xl text-[12px] font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm active:bg-gray-50 dark:active:bg-slate-600"
          >
            <IonIcon icon={swapVerticalOutline} className="w-3.5 h-3.5" />
            Sort
          </motion.button>
          {showSortMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSortMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 min-w-[180px] overflow-hidden"
              >
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = filters.sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        dispatch(setSortBy(opt.value));
                        setShowSortMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-[13px] transition-colors ${
                        isSelected
                          ? "text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/60 dark:bg-amber-900/20"
                          : "text-gray-700 dark:text-slate-300 active:bg-gray-50 dark:active:bg-slate-700"
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span className="flex-1 text-left">{opt.label}</span>
                      {isSelected && (
                        <IonIcon
                          icon={checkmark}
                          className="w-4 h-4 text-amber-500"
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* ── Meta ──────────────────────────────── */}
      {!isLoading && results && totalResults > 0 && (
        <div className="px-4 pt-2.5 pb-0.5">
          <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
            {totalResults.toLocaleString()} result{totalResults !== 1 ? "s" : ""} for &ldquo;
            {query}&rdquo;
            {tookMs > 0 && (
              <span className="text-gray-300 dark:text-slate-600"> · {tookMs}ms</span>
            )}
          </p>
        </div>
      )}

      {/* ── Results ───────────────────────────── */}
      <div className="px-4 pt-2 pb-8">
        {isLoading ? (
          <ResultsSkeleton />
        ) : !results || totalResults === 0 ? (
          <EmptyResults query={query} fallback={results?.fallback} didYouMean={results?.meta?.didYouMean} onSearch={onCategoryTap ? (q: string) => onCategoryTap(q, '') : undefined} />
        ) : activeTab === "all" ? (
          <AllResultsView results={results} onCategoryTap={onCategoryTap} />
        ) : activeTab === "providers" ? (
          <InfiniteScroll
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          >
            <div className="grid grid-cols-2 gap-3">
              {(Array.isArray(results.providers?.data) ? results.providers.data : []).map((p: any, i: number) => (
                <ProviderResultCard key={p.id} provider={p} index={i} />
              ))}
            </div>
          </InfiniteScroll>
        ) : activeTab === "products" ? (
          <InfiniteScroll
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          >
            <div className="grid grid-cols-2 gap-3">
              {(Array.isArray(results.products?.data) ? results.products.data : []).map((p: any, i: number) => (
                <ProductResultCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </InfiniteScroll>
        ) : (
          <InfiniteScroll
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          >
            <div className="space-y-2">
              {(Array.isArray(results.categories?.data) ? results.categories.data : []).map((c: any, i: number) => (
                <CategoryResultCard key={c.id} category={c} index={i} onTap={onCategoryTap} />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>

      <SearchFilterSheet
        opened={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
      />
    </div>
  );
};

// ── "All" tab — prioritized sections: Sponsored → Deals → Top Rated → Regular ──

const AllResultsView = ({ results, onCategoryTap }: { results: any; onCategoryTap?: (name: string, id: string) => void }) => {
  const dispatch = useAppDispatch();
  const sponsored: ProviderSearchResult[] = results.sponsored ?? [];
  const deals: ProviderSearchResult[] = results.deals ?? [];
  const topRated: ProviderSearchResult[] = results.topRated ?? [];
  const providers = results.providers?.data ?? [];
  const products = results.products?.data ?? [];
  const categories = results.categories?.data ?? [];

  return (
    <div className="space-y-6">
      {/* ── Sponsored Section ──────────────────── */}
      {sponsored.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Sponsored</h3>
            <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 dark:bg-slate-700 dark:text-slate-400 px-1.5 py-0.5 rounded">AD</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {sponsored.map((p, i) => (
              <div key={p.id} className="min-w-[200px] max-w-[200px] flex-shrink-0">
                <ProviderResultCard provider={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Deals & Offers Section ────────────── */}
      {deals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🏷️</span>
            <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Deals & Offers</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {deals.map((p, i) => (
              <div key={p.id} className="min-w-[200px] max-w-[200px] flex-shrink-0 relative">
                <ProviderResultCard provider={p} index={i} />
                {p.discountValue && (
                  <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                    {p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Top Rated Section ─────────────────── */}
      {topRated.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">⭐</span>
            <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Top Rated</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {topRated.map((p, i) => (
              <div key={p.id} className="min-w-[200px] max-w-[200px] flex-shrink-0">
                <ProviderResultCard provider={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Regular Businesses ────────────────── */}
      {providers.length > 0 && (
        <section>
          <SectionHeader
            title="Businesses"
            count={results.providers.total}
            onSeeAll={() => dispatch(setActiveTab("providers"))}
          />
          <div className="grid grid-cols-2 gap-3">
            {providers.slice(0, 4).map((p: any, i: number) => (
              <ProviderResultCard key={p.id} provider={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Products & Services ───────────────── */}
      {products.length > 0 && (
        <section>
          <SectionHeader
            title="Products & Services"
            count={results.products.total}
            onSeeAll={() => dispatch(setActiveTab("products"))}
          />
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p: any, i: number) => (
              <ProductResultCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Categories ────────────────────────── */}
      {categories.length > 0 && (
        <section>
          <SectionHeader
            title="Categories"
            count={results.categories.total}
            onSeeAll={() => dispatch(setActiveTab("categories"))}
          />
          <div className="space-y-2">
            {categories.slice(0, 3).map((c: any, i: number) => (
              <CategoryResultCard key={c.id} category={c} index={i} onTap={onCategoryTap} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const SectionHeader = ({
  title,
  count,
  onSeeAll,
}: {
  title: string;
  count: number;
  onSeeAll: () => void;
}) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">
      {title}
      <span className="text-gray-400 dark:text-slate-500 font-medium ml-1.5 text-[12px]">({count})</span>
    </h3>
    {count > 4 && (
      <button
        onClick={onSeeAll}
        className="text-[12px] font-bold text-amber-500 active:opacity-60 px-2 py-1 rounded-lg active:bg-amber-50 dark:active:bg-amber-900/20 transition-colors"
      >
        See all →
      </button>
    )}
  </div>
);

// ── Loading skeleton ──────────────────────────────────────────

const ResultsSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 pt-1">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 animate-pulse"
      >
        <div className="h-[140px] bg-gray-100 dark:bg-slate-700" />
        <div className="p-3 space-y-2">
          <div className="h-3.5 bg-gray-100 dark:bg-slate-700 rounded-full w-4/5" />
          <div className="h-2.5 bg-gray-50 dark:bg-slate-800 rounded-full w-3/5" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 w-12 bg-gray-100 dark:bg-slate-700 rounded-md" />
            <div className="h-5 w-16 bg-gray-50 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ── Empty state ───────────────────────────────────────────────

// ── Enhanced empty state with fallback data ───────────────────

const EmptyResults = ({ query, fallback, didYouMean, onSearch }: {
  query: string;
  fallback?: any;
  didYouMean?: string;
  onSearch?: (q: string) => void;
}) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center pt-10 text-center px-2"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mb-5 shadow-sm">
        <IonIcon icon={sadOutline} className="w-9 h-9 text-gray-400 dark:text-slate-500" />
      </div>
      <h3 className="text-[16px] font-bold text-gray-800 dark:text-white mb-1.5">
        No exact results found
      </h3>
      <p className="text-[13px] text-gray-400 dark:text-slate-400 max-w-[280px] leading-relaxed mb-4">
        We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try these instead:
      </p>

      {/* Did you mean? */}
      {didYouMean && (
        <button
          onClick={() => onSearch?.(didYouMean)}
          className="mb-4 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[13px] font-semibold text-amber-700 dark:text-amber-400 active:bg-amber-100 dark:active:bg-amber-900/50 transition-colors"
        >
          Did you mean: <span className="font-bold">&ldquo;{didYouMean}&rdquo;</span>?
        </button>
      )}

      {/* People also searched */}
      {fallback?.peopleAlsoSearched?.length > 0 && (
        <div className="w-full text-left mb-5">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">People also searched</h4>
          <div className="flex flex-wrap gap-2">
            {fallback.peopleAlsoSearched.map((q: string) => (
              <button
                key={q}
                onClick={() => onSearch?.(q)}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-[12px] font-medium text-gray-600 dark:text-slate-300 active:bg-gray-50 dark:active:bg-slate-600 transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related categories */}
      {fallback?.relatedCategories?.length > 0 && (
        <div className="w-full text-left mb-5">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Browse related categories</h4>
          <div className="flex flex-wrap gap-2">
            {fallback.relatedCategories.map((c: any) => (
              <button
                key={c.id}
                onClick={() => router.push(`/search?q=${encodeURIComponent(c.name)}&categoryIds=${c.id}`)}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-[12px] font-medium text-gray-600 dark:text-slate-300 active:bg-gray-50 dark:active:bg-slate-600 transition-colors shadow-sm"
              >
                {c.name} <span className="text-gray-400 dark:text-slate-500">({c.providerCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Relaxed / nearby popular providers */}
      {(fallback?.relaxedProviders?.length > 0 || fallback?.nearbyPopular?.length > 0) && (
        <div className="w-full text-left mb-5">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            {fallback?.relaxedProviders?.length > 0 ? 'Close matches' : 'Popular nearby'}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {(fallback?.relaxedProviders || fallback?.nearbyPopular || []).slice(0, 4).map((p: any, i: number) => (
              <ProviderResultCard key={p.id} provider={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Trending searches */}
      {fallback?.trending?.length > 0 && (
        <div className="w-full text-left">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Trending searches</h4>
          <div className="flex flex-wrap gap-2">
            {fallback.trending.map((t: any) => (
              <button
                key={t.query}
                onClick={() => onSearch?.(t.query)}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-[12px] font-medium text-gray-600 dark:text-slate-300 active:bg-gray-50 dark:active:bg-slate-600 transition-colors shadow-sm"
              >
                🔥 {t.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SearchResultsView;
