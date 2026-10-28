"use client";

import { useMemo, Fragment, useEffect, useRef } from "react";
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
  pricetag,
  star,
  locationOutline,
  navigateOutline,
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
import type {
  SearchEntityType,
  SearchSortBy,
  ProviderSearchResult,
  ProductSearchResult,
  SearchResponse,
  SearchFallback,
} from "@/services/search.service";
import { reportSponsored } from "@/services/search.service";
import { trackAdEvent } from "@/services/explore.service";
import { fallbackToOriginal, sizedImageUrl } from "@/utils/image-optimization";
import { distanceLabel, isApproximate } from "@/utils/distance-label";
import { businessHref } from "@/utils/share-links";
import { discountValueLabel } from "@/app/components/offers/offer-ui";

import SearchFilterSheet from "./search-filter-sheet";
import SearchFilterChips from "./search-filter-chips";
import ProviderResultCard from "./cards/provider-result-card";
import { ApproximateDivider, shouldShowApproximateDivider } from "@/utils/approximate-divider";
import ProductResultCard from "./cards/product-result-card";
import CategoryResultCard from "./cards/category-result-card";
import InfiniteScroll from "../infinite-scroll";
import { useBackDismiss } from "@/hooks/useBackDismiss";

const TABS: { key: SearchEntityType; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "🔍" },
  { key: "providers", label: "Businesses", icon: "🏪" },
  { key: "products", label: "Products", icon: "📦" },
  { key: "services", label: "Services", icon: "🛠️" },
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
  useBackDismiss(showSortMenu, () => setShowSortMenu(false), { kind: "menu" });
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
    if (activeTab === "products" || activeTab === "services") {
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

  const activeFilterCount =
    filters.categoryIds.length +
    (filters.minRating ? 1 : 0) +
    (filters.maxDistance ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.womenLedOnly ? 1 : 0) +
    (filters.listingType !== "all" ? 1 : 0);

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
                  : tab.key === "products" || tab.key === "services"
                    ? activeTab === tab.key
                      ? results?.products?.total ?? 0
                      : activeTab === "all"
                        ? (results?.products?.data ?? []).filter((p) => (p.productType === "service") === (tab.key === "services")).length
                        : 0
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
          <p className="text-[11.5px] text-gray-500 dark:text-slate-400 font-medium">
            {`${totalResults.toLocaleString()} result${totalResults !== 1 ? "s" : ""} for “${results.meta.correctedQuery ?? query}”`}
            {results.meta.correctedQuery && (
              <span className="text-gray-400 dark:text-slate-500">{` · you searched “${query}”`}</span>
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
          <AllResultsView results={results} query={results.meta.correctedQuery ?? query} onCategoryTap={onCategoryTap} />
        ) : activeTab === "providers" ? (
          <InfiniteScroll
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          >
            <div className="grid grid-cols-2 gap-3">
              {(Array.isArray(results.providers?.data) ? results.providers.data : []).map((p, i: number, all) => (
                <Fragment key={p.id}>
                  {shouldShowApproximateDivider(all, i) && <ApproximateDivider item={p} />}
                  <ProviderResultCard provider={p} index={i} />
                </Fragment>
              ))}
            </div>
          </InfiniteScroll>
        ) : activeTab === "products" || activeTab === "services" ? (
          <InfiniteScroll
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          >
            <div className="grid grid-cols-2 gap-3">
              {(Array.isArray(results.products?.data) ? results.products.data : []).map((p, i: number) => (
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
              {(Array.isArray(results.categories?.data) ? results.categories.data : []).map((c, i: number) => (
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

// ── "All" tab: Sponsored → Deals → best matches (strongest section first) → Top rated ──

/** In "All", drop anything far weaker than the best match; the tabs still list everything. */
const RELATIVE_FLOOR = 0.6;

/** Report each card once per visit when half of it is on screen. */
function useViewReports(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const id = el.dataset.viewId;
          const kind = el.dataset.viewKind;
          if (!id || !kind || seen.current.has(id)) continue;
          seen.current.add(id);
          if (kind === "sponsored") reportSponsored("impression", id, "search_results");
          else trackAdEvent({ eventType: "impression", entityType: "provider_offer", entityId: id, position: "search_deals" }).catch(() => {});
        }
      },
      { threshold: 0.5 },
    );
    root.querySelectorAll("[data-view-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const Rail = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 items-stretch">{children}</div>
  </div>
);

/** A business with a live deal: the offer leads, the business follows. */
const DealCard = ({ p, index }: { p: ProviderSearchResult; index: number }) => {
  const router = useRouter();
  const image = p.profilePhotoUrl || p.bannerImageUrl || "";
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.04 }}
      onClick={() => {
        if (p.offerId) trackAdEvent({ eventType: "click", entityType: "provider_offer", entityId: p.offerId, position: "search_deals" }).catch(() => {});
        router.push(businessHref(p));
      }}
      className="w-[220px] h-full text-left flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-900/40 shadow-[0_2px_10px_rgba(244,63,94,0.10)] dark:shadow-none active:scale-[0.97] transition-transform"
    >
      <div className="relative h-[104px] bg-gray-100 dark:bg-slate-700">
        {image ? (
          <img src={sizedImageUrl(image, 480)} alt={p.brandName} className="w-full h-full object-cover" loading="lazy" onError={fallbackToOriginal(image)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🏪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute top-2 left-2 rounded-xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 text-white px-2.5 py-1 shadow-md">
          <span className="text-[15px] font-extrabold leading-none">{discountValueLabel(p.discountType, p.discountValue ?? 0)}</span>
          <span className="ml-1 text-[9px] font-bold tracking-wider">OFF</span>
        </div>
        {distanceLabel(p) && (
          <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-slate-800/95 text-gray-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <IonIcon icon={isApproximate(p) ? locationOutline : navigateOutline} className="w-3 h-3 text-amber-500" />
            {distanceLabel(p)}
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug line-clamp-1">{p.offerTitle || "Special offer"}</p>
        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1">{p.brandName}</p>
        <div className="mt-auto pt-2 flex items-center gap-1.5">
          {p.avgRating != null && p.avgRating > 0 && (
            <span className="flex items-center gap-0.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              <IonIcon icon={star} className="w-2.5 h-2.5" />
              {p.avgRating.toFixed(1)}
            </span>
          )}
          <span className="ml-auto text-[10.5px] font-bold text-rose-600 dark:text-rose-300">View deal →</span>
        </div>
      </div>
    </motion.button>
  );
};

type MatchKey = "services" | "products" | "providers";
const MATCH_META: Record<MatchKey, { title: string; single: string; icon: string; tab: SearchEntityType }> = {
  services: { title: "Services", single: "service", icon: "🛠️", tab: "services" },
  products: { title: "Products", single: "product", icon: "📦", tab: "products" },
  providers: { title: "Businesses", single: "business", icon: "🏪", tab: "providers" },
};

const AllResultsView = ({ results, query, onCategoryTap }: { results: SearchResponse; query: string; onCategoryTap?: (name: string, id: string) => void }) => {
  const dispatch = useAppDispatch();
  const items = useMemo(() => results.products?.data ?? [], [results]);
  const providers = useMemo(() => results.providers?.data ?? [], [results]);
  const sponsoredBiz = useMemo(() => results.sponsored ?? [], [results]);
  const deals = useMemo(() => (results.deals ?? []).filter((d) => d.discountValue != null), [results]);
  const topRated = results.topRated ?? [];
  const categories = results.categories?.data ?? [];

  // Paid placements: businesses and items together, strongest match first.
  const sponsored = useMemo(() => {
    const list: ({ kind: "biz"; p: ProviderSearchResult } | { kind: "item"; p: ProductSearchResult })[] = [
      ...sponsoredBiz.map((p) => ({ kind: "biz" as const, p })),
      ...items.filter((p) => p.isSponsored).map((p) => ({ kind: "item" as const, p })),
    ];
    return list.sort((a, b) => (b.p.relevanceScore ?? 0) - (a.p.relevanceScore ?? 0));
  }, [sponsoredBiz, items]);

  // Organic matches, split by kind; whichever kind matches best leads.
  const matches = useMemo(() => {
    const organic = items.filter((p) => !p.isSponsored);
    const lists = {
      services: organic.filter((p) => p.productType === "service"),
      products: organic.filter((p) => p.productType !== "service"),
      providers,
    };
    // Header counts match the tabs: every item of that kind, sponsored included.
    const counts = {
      services: items.filter((p) => p.productType === "service").length,
      products: items.filter((p) => p.productType !== "service").length,
      providers: results.providers?.total ?? providers.length,
    };
    // Already on screen in the Sponsored, Deals or Top rated rows.
    const elsewhere = {
      services: items.filter((p) => p.isSponsored && p.productType === "service").length,
      products: items.filter((p) => p.isSponsored && p.productType !== "service").length,
      providers: sponsoredBiz.length + (results.deals?.length ?? 0) + (results.topRated?.length ?? 0),
    };
    const top = Math.max(0, ...[...organic, ...providers].map((x) => x.relevanceScore ?? 0));
    const floor = top * RELATIVE_FLOOR;
    return (Object.keys(lists) as MatchKey[])
      .map((key) => {
        const all = lists[key] as (ProductSearchResult | ProviderSearchResult)[];
        const strong = all.filter((x) => (x.relevanceScore ?? 0) >= floor);
        const more = Math.max(0, counts[key] - elsewhere[key] - strong.length);
        return { key, count: counts[key], more, strong, best: strong[0]?.relevanceScore ?? 0 };
      })
      .filter((m) => m.strong.length > 0)
      .sort((a, b) => b.best - a.best);
  }, [items, providers, results, sponsoredBiz]);

  const viewsRef = useViewReports([sponsored, deals]);

  return (
    <div ref={viewsRef} className="space-y-6">
      {/* ── Related categories ── */}
      {categories.length > 0 && onCategoryTap && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {categories.slice(0, 8).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategoryTap(c.name, c.id)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[12px] font-semibold text-gray-700 dark:text-slate-200 active:scale-95 transition-transform"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* ── 1. Sponsored ── */}
      {sponsored.length > 0 && (
        <section className="-mx-4 px-4 py-3.5 bg-gradient-to-br from-amber-50 via-orange-50/50 to-transparent dark:from-amber-950/30 dark:via-slate-900 dark:to-transparent border-y border-amber-100/80 dark:border-amber-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">⚡</span>
            <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">Sponsored</h3>
            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">AD</span>
            <span className="ml-auto text-[11px] text-gray-400 dark:text-slate-500 truncate">{`Promoted for “${query}”`}</span>
          </div>
          <Rail>
            {sponsored.map((s, i) => (
              <div
                key={`${s.kind}-${s.p.id}`}
                data-view-kind="sponsored"
                data-view-id={s.p.sponsoredListingId}
                className={`shrink-0 ${s.kind === "biz" ? "w-[200px]" : "w-[172px]"}`}
              >
                {s.kind === "biz" ? <ProviderResultCard provider={s.p} index={i} /> : <ProductResultCard product={s.p} index={i} />}
              </div>
            ))}
          </Rail>
        </section>
      )}

      {/* ── 2. Deals & offers ── */}
      {deals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <IonIcon icon={pricetag} className="text-rose-500 text-[15px]" />
            <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">Deals &amp; Offers</h3>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-0.5 rounded-full">Limited time</span>
          </div>
          <Rail>
            {deals.map((p, i) => (
              <div key={p.id} data-view-kind="offer" data-view-id={p.offerId} className="shrink-0">
                <DealCard p={p} index={i} />
              </div>
            ))}
          </Rail>
        </section>
      )}

      {/* ── 3. Best matches, strongest kind first ── */}
      {matches.map((m, idx) => {
        const meta = MATCH_META[m.key];
        return (
          <section key={m.key}>
            <SectionHeader
              title={meta.title}
              icon={meta.icon}
              count={m.count}
              badge={idx === 0 && matches.length > 1 ? "Best match" : undefined}
            />
            {/* Every match is listed right here — no "See all" detour */}
            <div className="grid grid-cols-2 gap-3">
              {m.strong.map((x, i) =>
                m.key === "providers" ? (
                  <ProviderResultCard key={x.id} provider={x as ProviderSearchResult} index={i} />
                ) : (
                  <ProductResultCard key={x.id} product={x as ProductSearchResult} index={i} />
                ),
              )}
            </div>
            {/* Only when more exist than this page holds (or loosely related ones were left out) */}
            {m.more > 0 && (
              <button
                type="button"
                onClick={() => dispatch(setActiveTab(meta.tab))}
                className="mt-3 w-full h-10 rounded-xl text-[12.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-900/20 active:scale-[0.99] transition-transform"
              >
                {`Show ${m.more} more ${m.more === 1 ? meta.single : meta.title.toLowerCase()}`}
              </button>
            )}
          </section>
        );
      })}

      {/* ── 4. Top rated ── */}
      {topRated.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">⭐</span>
            <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">Top rated</h3>
          </div>
          <Rail>
            {topRated.map((p, i) => (
              <div key={p.id} className="shrink-0 w-[200px]">
                <ProviderResultCard provider={p} index={i} />
              </div>
            ))}
          </Rail>
        </section>
      )}
    </div>
  );
};

const SectionHeader = ({
  title,
  icon,
  count,
  badge,
}: {
  title: string;
  icon: string;
  count: number;
  badge?: string;
}) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="flex items-center gap-1.5 text-[15px] font-extrabold text-gray-900 dark:text-white">
      <span className="text-sm">{icon}</span>
      {title}
      <span className="text-gray-400 dark:text-slate-500 font-medium text-[12px]">({count})</span>
      {badge && (
        <span className="ml-1 text-[9.5px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </h3>
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
  fallback?: SearchFallback;
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
      {!!fallback?.peopleAlsoSearched?.length && (
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
      {!!fallback?.relatedCategories?.length && (
        <div className="w-full text-left mb-5">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Browse related categories</h4>
          <div className="flex flex-wrap gap-2">
            {fallback.relatedCategories.map((c) => (
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
      {(!!fallback?.relaxedProviders?.length || !!fallback?.nearbyPopular?.length) && (
        <div className="w-full text-left mb-5">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            {fallback?.relaxedProviders?.length ? 'Close matches' : 'Popular nearby'}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {(fallback?.relaxedProviders || fallback?.nearbyPopular || []).slice(0, 4).map((p, i: number) => (
              <ProviderResultCard key={p.id} provider={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Trending searches */}
      {!!fallback?.trending?.length && (
        <div className="w-full text-left">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Trending searches</h4>
          <div className="flex flex-wrap gap-2">
            {fallback.trending.map((t) => (
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
