"use client";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  searchOutline,
  locationOutline,
  starOutline,
  star,
  heartOutline,
  heart,
  flashOutline,
  trendingUpOutline,
  timeOutline,
  ribbonOutline,
  sparklesOutline,
  checkmarkCircleOutline,
  navigateOutline,
  shieldCheckmarkOutline,
  femaleOutline,
  diamondOutline,
  megaphoneOutline,
  pricetagOutline,
  peopleOutline,
  arrowForwardOutline,
  rocketOutline,
  optionsOutline,
} from "ionicons/icons";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { useNearbyProviders } from "@/hooks/useProvider";
import { useAppSelector } from "@/hooks/useAppStore";
import { useToggleSaved, useSavedItemIds } from "@/hooks/useSavedItems";
import { useExploreFeed, useTrackAd } from "@/hooks/useExplore";
import type {
  ExploreProvider,
  SponsoredProvider,
  ProviderWithOffer,
} from "@/services/explore.service";
import ProviderBadgeList from "./explore/provider-badge";
import InfiniteScroll from "./infinite-scroll";
import FilterSheet, { type AllServicesFilters } from "./filter-sheet";
import FilterChips from "./filter-chips";

type SortKey = "nearest" | "top_rated" | "newest";

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "nearest", label: "Nearest", icon: locationOutline },
  { key: "top_rated", label: "Top Rated", icon: starOutline },
  { key: "newest", label: "Newest", icon: timeOutline },
];

const QUICK_ACTIONS: { label: string; icon: string; color: string; bg: string; border: string; activeColor: string; activeBg: string; filterKey: "womenLedOnly" | "verifiedOnly" | "topRated" | "featured" }[] = [
  { label: "Women-Led", icon: femaleOutline, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", activeColor: "text-white", activeBg: "bg-purple-600 border-purple-600", filterKey: "womenLedOnly" },
  { label: "Verified", icon: shieldCheckmarkOutline, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", activeColor: "text-white", activeBg: "bg-emerald-600 border-emerald-600", filterKey: "verifiedOnly" },
  { label: "Top Rated", icon: star, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", activeColor: "text-white", activeBg: "bg-amber-600 border-amber-600", filterKey: "topRated" },
  { label: "Featured", icon: diamondOutline, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", activeColor: "text-white", activeBg: "bg-blue-600 border-blue-600", filterKey: "featured" },
];

const EMPTY_FILTERS: AllServicesFilters = {
  categoryIds: new Set(),
  minRating: null,
  maxDistance: null,
  verifiedOnly: false,
  womenLedOnly: false,
};

const COLLECTION_GRADIENTS = [
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-blue-400 to-indigo-600",
  "from-pink-400 to-rose-600",
  "from-violet-400 to-purple-600",
  "from-cyan-400 to-sky-600",
];

const COLLECTION_ICONS = [ribbonOutline, flashOutline, sparklesOutline, trendingUpOutline, diamondOutline, megaphoneOutline];

const STATIC_COLLECTIONS = [
  { id: "wedding", title: "Wedding Season", count: "24+", gradient: "from-amber-400 to-orange-600", icon: ribbonOutline },
  { id: "budget", title: "Under ₹500", count: "45+", gradient: "from-emerald-400 to-teal-600", icon: flashOutline },
  { id: "new", title: "New Arrivals", count: "12+", gradient: "from-blue-400 to-indigo-600", icon: sparklesOutline },
  { id: "popular", title: "Most Booked", count: "30+", gradient: "from-pink-400 to-rose-600", icon: trendingUpOutline },
];

const formatDistance = (d: number) =>
  d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`;

const formatOfferLabel = (type: string, value: number) =>
  type === "percentage" ? `${value}% OFF` : `₹${value} OFF`;

/* ── Skeleton Loader ── */
const SectionSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="px-4 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 animate-pulse">
        <div className="flex gap-3">
          <div className="w-[90px] h-[90px] rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
            <div className="h-2.5 bg-slate-50 rounded-full w-1/2" />
            <div className="h-2.5 bg-slate-50 rounded-full w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ── Horizontal Card Skeleton ── */
const CardCarouselSkeleton = ({ cards = 3 }: { cards?: number }) => (
  <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="shrink-0 w-[170px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
        <div className="h-[115px] bg-slate-100" />
        <div className="p-2.5 space-y-2">
          <div className="h-3 bg-slate-100 rounded-full w-4/5" />
          <div className="h-2.5 bg-slate-50 rounded-full w-3/5" />
          <div className="h-2.5 bg-slate-50 rounded-full w-2/5" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Impression Tracker Hook ── */
function useImpressionTracker(
  trackAd: ReturnType<typeof useTrackAd>,
  items: { sponsoredListingId?: string; offerId?: string; id?: string }[],
  entityType: "sponsored_listing" | "promo_banner" | "provider_offer",
) {
  const tracked = useRef(new Set<string>());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const entityId = (entry.target as HTMLElement).dataset.trackId;
          if (!entityId || tracked.current.has(entityId)) return;
          tracked.current.add(entityId);
          trackAd.mutate({ eventType: "impression", entityType, entityId });
        });
      },
      { threshold: 0.5 },
    );

    const children = ref.current.querySelectorAll("[data-track-id]");
    children.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [items, entityType, trackAd]);

  return ref;
}

/* ── Banner Carousel ── */

function BannerCarousel({
  banners,
  onBannerClick,
}: {
  banners: import("@/services/explore.service").ExploreBanner[];
  onBannerClick: (banner: import("@/services/explore.service").ExploreBanner) => void;
}) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const count = banners.length;

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const child = el.children[index] as HTMLElement | undefined;
      if (child) {
        el.scrollTo({ left: child.offsetLeft - 16, behavior: "smooth" });
      }
      setCurrent(index);
    },
    [],
  );

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (count <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % count;
        scrollTo(next);
        return next;
      });
    }, 4000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [count, scrollTo]);

  // Reset auto-play on manual interaction
  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (count <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % count;
        scrollTo(next);
        return next;
      });
    }, 4000);
  }, [count, scrollTo]);

  // Detect manual scroll end to sync indicator
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const childWidth = (el.children[0] as HTMLElement)?.offsetWidth ?? 1;
    const idx = Math.round(scrollLeft / childWidth);
    if (idx !== current && idx >= 0 && idx < count) {
      setCurrent(idx);
      resetAutoPlay();
    }
  }, [current, count, resetAutoPlay]);

  return (
    <div className="mt-5">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            const next = diff > 0
              ? Math.min(current + 1, count - 1)
              : Math.max(current - 1, 0);
            scrollTo(next);
            resetAutoPlay();
          }
        }}
        className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {banners.map((banner) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBannerClick(banner)}
            style={{
              background: banner.gradient || "linear-gradient(135deg,#7c3aed,#5b21b6)",
            }}
            className="rounded-2xl p-4 cursor-pointer relative overflow-hidden flex-shrink-0 w-[calc(100%-32px)] snap-center"
          >
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/[0.08]" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex-1">
                {banner.tag && (
                  <span className="text-[9px] font-bold tracking-wider text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
                    {banner.tag}
                  </span>
                )}
                <h3 className="text-base font-extrabold text-white mt-1 leading-tight">
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p className="text-[11px] text-white/70 mt-0.5">{banner.subtitle}</p>
                )}
              </div>
              {banner.emoji && <span className="text-3xl">{banner.emoji}</span>}
              <span className="text-[10px] font-bold text-white bg-white/20 px-3 py-1.5 rounded-xl shrink-0">
                {banner.cta ?? "View →"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dots indicator */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { scrollTo(i); resetAutoPlay(); }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-1.5 bg-amber-500"
                  : "w-1.5 h-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */

const ExploreContent = () => {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("nearest");
  const [filters, setFilters] = useState<AllServicesFilters>({ ...EMPTY_FILTERS, categoryIds: new Set() });
  const [sheetOpened, setSheetOpened] = useState(false);

  // Active quick-action pills state
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());

  const user = useAppSelector((state) => state.auth.user as any);
  const feedParams = {
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
  };

  const { data: feed, isLoading: feedLoading } = useExploreFeed(feedParams);
  const trackAd = useTrackAd();

  // Map sort key to API sortBy
  const sortByParam = sort === "top_rated" ? "rating" as const : sort === "newest" ? "newest" as const : undefined;

  const { data: nearbyData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: nearbyLoading } =
    useNearbyProviders({
      lat: user?.latitude || 18.5204,
      lng: user?.longitude || 73.8567,
      city: user?.city,
      limit: 12,
      radius: filters.maxDistance || 25,
      categoryIds: Array.from(filters.categoryIds),
      sortBy: sortByParam,
      minRating: filters.minRating ?? undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      womenLedOnly: filters.womenLedOnly || undefined,
    });

  const activeFilterCount =
    filters.categoryIds.size +
    (filters.minRating ? 1 : 0) +
    (filters.maxDistance ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.womenLedOnly ? 1 : 0);

  // Toggle quick action pill (in-place filter)
  const handleQuickActionToggle = useCallback((filterKey: string) => {
    setActiveActions((prev) => {
      const next = new Set(prev);
      if (next.has(filterKey)) next.delete(filterKey);
      else next.add(filterKey);
      return next;
    });
    setFilters((prev) => {
      const next = { ...prev, categoryIds: new Set(prev.categoryIds) };
      switch (filterKey) {
        case "womenLedOnly":
          next.womenLedOnly = !prev.womenLedOnly;
          break;
        case "verifiedOnly":
          next.verifiedOnly = !prev.verifiedOnly;
          break;
        case "topRated":
          next.minRating = prev.minRating && prev.minRating >= 4 ? null : 4;
          break;
        case "featured":
          // featured maps to sort by rating for now
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
    setActiveActions(new Set());
  }, []);

  const handleApplyFilters = useCallback((f: AllServicesFilters) => {
    setFilters({ ...f, categoryIds: new Set(f.categoryIds) });
    setSheetOpened(false);
  }, []);

  const { data: savedIds = [] } = useSavedItemIds();
  const toggleSaved = useToggleSaved();

  const savedProviderIds = useMemo(
    () => new Set(savedIds.filter((s) => s.itemType === "provider").map((s) => s.itemId)),
    [savedIds],
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      toggleSaved.mutate({ itemId: id, itemType: "provider" });
    },
    [toggleSaved],
  );

  // Impression tracking refs
  const sponsoredRef = useImpressionTracker(
    trackAd,
    feed?.sponsoredCarousel ?? [],
    "sponsored_listing",
  );
  const offersRef = useImpressionTracker(
    trackAd,
    feed?.activeOffers ?? [],
    "provider_offer",
  );

  // Nearby providers with sorting
  const nearbyProviders = useMemo(() => {
    if (!nearbyData) return [];
    const mapped = nearbyData.pages.flatMap((page) =>
      page.data.map((p: any) => ({
        id: p.id,
        name: p.brandName,
        service: p.services || p.description?.split(",")[0] || "Services",
        distance: p.distance,
        rating: p.rating ?? 0,
        reviews: p.reviewCount ?? 0,
        image: p.profilePhotoUrl || p.bannerImageUrl || "",
        verified: p.status === "active",
        womenLed: p.isWomenLed || false,
        isFeatured: p.isFeatured || false,
        location: [p.area, p.city].filter(Boolean).join(", "),
        badges: [],
      })),
    );
    if (sort === "top_rated") return [...mapped].sort((a, b) => b.rating - a.rating);
    if (sort === "nearest") return [...mapped].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    return mapped;
  }, [nearbyData, sort]);

  // ── Client-side filter for feed sections ──
  const hasActiveFilter = activeFilterCount > 0;

  const filterProvider = useCallback(
    (p: { isWomenLed?: boolean; verified?: boolean; rating?: number; distance?: number | null }) => {
      if (filters.womenLedOnly && !p.isWomenLed) return false;
      if (filters.verifiedOnly && !p.verified) return false;
      if (filters.minRating && (p.rating ?? 0) < filters.minRating) return false;
      if (filters.maxDistance && p.distance != null && p.distance > filters.maxDistance) return false;
      return true;
    },
    [filters],
  );

  // Filtered feed sections (only apply when filters are active)
  const filteredSponsored = useMemo(
    () => hasActiveFilter ? (feed?.sponsoredCarousel ?? []).filter(filterProvider) : (feed?.sponsoredCarousel ?? []),
    [feed?.sponsoredCarousel, filterProvider, hasActiveFilter],
  );
  const filteredOffers = useMemo(
    () => hasActiveFilter ? (feed?.activeOffers ?? []).filter(filterProvider) : (feed?.activeOffers ?? []),
    [feed?.activeOffers, filterProvider, hasActiveFilter],
  );
  const filteredPopularNearby = useMemo(
    () => hasActiveFilter ? (feed?.popularNearby ?? []).filter(filterProvider) : (feed?.popularNearby ?? []),
    [feed?.popularNearby, filterProvider, hasActiveFilter],
  );
  const filteredTopRated = useMemo(
    () => hasActiveFilter ? (feed?.topRated ?? []).filter(filterProvider) : (feed?.topRated ?? []),
    [feed?.topRated, filterProvider, hasActiveFilter],
  );
  const filteredSpotlightProviders = useMemo(
    () => hasActiveFilter ? (feed?.categorySpotlight?.providers ?? []).filter(filterProvider) : (feed?.categorySpotlight?.providers ?? []),
    [feed?.categorySpotlight?.providers, filterProvider, hasActiveFilter],
  );
  const filteredNewArrivals = useMemo(
    () => hasActiveFilter ? (feed?.newArrivals ?? []).filter(filterProvider) : (feed?.newArrivals ?? []),
    [feed?.newArrivals, filterProvider, hasActiveFilter],
  );

  // Collections from quick categories or static fallback
  const collections = useMemo(() => {
    const cats = feed?.quickCategories ?? [];
    if (cats.length >= 4) {
      return cats.slice(0, 6).map((cat, i) => ({
        id: cat.id,
        title: cat.name,
        count: cat.providerCount > 0 ? `${cat.providerCount}+` : "",
        gradient: COLLECTION_GRADIENTS[i % COLLECTION_GRADIENTS.length],
        icon: COLLECTION_ICONS[i % COLLECTION_ICONS.length],
        categoryId: cat.id,
      }));
    }
    return STATIC_COLLECTIONS;
  }, [feed?.quickCategories]);

  const handleSponsoredClick = useCallback(
    (p: SponsoredProvider) => {
      trackAd.mutate({
        eventType: "click",
        entityType: "sponsored_listing",
        entityId: p.sponsoredListingId,
      });
      router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${p.id}`);
    },
    [trackAd, router],
  );

  const handleOfferClick = useCallback(
    (p: ProviderWithOffer) => {
      trackAd.mutate({
        eventType: "click",
        entityType: "provider_offer",
        entityId: p.offerId,
      });
      router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${p.id}`);
    },
    [trackAd, router],
  );

  const goToProvider = useCallback(
    (id: string) => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${id}`),
    [router],
  );

  const isLoading = feedLoading || nearbyLoading;

  return (
    <div className="flex flex-col pb-4">

      {/* ── Sticky Filter Bar ── */}
      <div className="sticky top-0 z-20 bg-[#FAFAFA]/95 dark:bg-slate-950/95 backdrop-blur-md pb-1">

        {/* ── 1. Search Bar ── */}
        <div className="px-4 pt-2 pb-1">
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(ROUTE_PATH.SEARCH)}
            className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 shadow-sm cursor-pointer"
          >
            <IonIcon icon={searchOutline} className="text-base text-slate-400 shrink-0" />
            <span className="flex-1 text-sm text-slate-400">Search services, businesses...</span>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">Search</span>
          </motion.div>
        </div>

        {/* ── 2. Quick Action Pills (functional filters) ── */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pt-1.5 pb-0.5">
          {QUICK_ACTIONS.map((action, i) => {
            const isActive = activeActions.has(action.filterKey);
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickActionToggle(action.filterKey)}
                className={`shrink-0 flex items-center gap-1 border px-2.5 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? `${action.activeBg} ${action.activeColor}`
                    : `${action.bg} ${action.border}`
                }`}
              >
                <IonIcon icon={action.icon} className={`text-xs ${isActive ? action.activeColor : action.color}`} />
                <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? action.activeColor : action.color}`}>{action.label}</span>
              </motion.button>
            );
          })}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSheetOpened(true)}
            className={`shrink-0 flex items-center gap-1 border px-2.5 py-1.5 rounded-xl transition-all ${
              activeFilterCount > 0
                ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200/50"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300"
            }`}
          >
            <IonIcon icon={optionsOutline} className="text-xs" />
            <span className="text-[10px] font-bold whitespace-nowrap">Filters</span>
            {activeFilterCount > 0 && (
              <span className="h-[14px] min-w-[14px] px-0.5 bg-white text-amber-600 text-[8px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* ── 2b. Filter Chips ── */}
        <div className="px-4 pt-0.5 pb-0.5">
          <FilterChips
            filters={filters}
            onRemoveCategory={handleRemoveCategory}
            onRemoveRating={() => setFilters((prev) => ({ ...prev, minRating: null }))}
            onRemoveDistance={() => setFilters((prev) => ({ ...prev, maxDistance: null }))}
            onRemoveVerified={() => {
              setFilters((prev) => ({ ...prev, verifiedOnly: false }));
              setActiveActions((prev) => { const n = new Set(prev); n.delete("verifiedOnly"); return n; });
            }}
            onRemoveWomenLed={() => {
              setFilters((prev) => ({ ...prev, womenLedOnly: false }));
              setActiveActions((prev) => { const n = new Set(prev); n.delete("womenLedOnly"); return n; });
            }}
            onClearAll={handleClearAllFilters}
          />
        </div>

      </div>

      {/* ── 3. Sponsored Carousel — revenue: CPC ads ── */}
      {feedLoading && (
        <div className="mt-4">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
          </div>
          <CardCarouselSkeleton cards={3} />
        </div>
      )}
      {!feedLoading && filteredSponsored.length > 0 && (
        <div className="mt-4" ref={sponsoredRef}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={megaphoneOutline} className="text-sm text-amber-500" />
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Sponsored</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {filteredSponsored.map((p, i) => (
              <motion.div
                key={p.id}
                data-track-id={p.sponsoredListingId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSponsoredClick(p)}
                className="shrink-0 w-[170px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border-2 border-amber-200/60 dark:border-amber-700/40"
              >
                <div className="relative h-[115px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-slate-200">{p.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    <IonIcon icon={diamondOutline} className="w-2.5 h-2.5" />
                    Ad
                  </div>
                  {p.distance != null && (
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                      <IonIcon icon={navigateOutline} className="w-2.5 h-2.5 text-amber-500" />
                      {formatDistance(p.distance)}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h4 className="text-[13px] font-semibold text-slate-800 dark:text-white line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{p.services || p.location}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {p.rating > 0 ? (
                      <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-md">
                        <IonIcon icon={star} className="w-2.5 h-2.5 text-green-600" />
                        <span className="text-[10px] font-bold text-green-700">{p.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">New</span>
                    )}
                    <ProviderBadgeList badges={p.badges} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Active Offers — revenue: drive provider sign-ups ── */}
      {feedLoading && (
        <div className="mt-5">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
          </div>
          <CardCarouselSkeleton cards={3} />
        </div>
      )}
      {!feedLoading && filteredOffers.length > 0 && (
        <div className="mt-5" ref={offersRef}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <IonIcon icon={pricetagOutline} className="text-base text-rose-500" />
            </motion.div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Deals & Offers</h2>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ml-auto">
              Limited Time
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {filteredOffers.map((p, i) => (
              <motion.div
                key={p.offerId}
                data-track-id={p.offerId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOfferClick(p)}
                className="shrink-0 w-[170px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-rose-100 dark:border-rose-900/40"
              >
                <div className="relative h-[100px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-200">{p.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {formatOfferLabel(p.discountType, p.discountValue)}
                  </div>
                </div>
                <div className="p-2.5">
                  <h4 className="text-[12px] font-semibold text-slate-800 dark:text-white line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5 line-clamp-1">{p.offerTitle}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {p.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <IonIcon icon={star} className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{p.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {p.distance != null && (
                      <span className="text-[9px] text-slate-400">{formatDistance(p.distance)}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Quick Categories — discovery grid ── */}
      <div className="mt-5">
        <h2 className="text-[15px] font-bold text-slate-800 px-4 mb-2.5">Curated Collections</h2>
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {collections.slice(0, 4).map((col: any, i: number) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                col.categoryId
                  ? router.push(`${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(col.title)}&categoryIds=${col.categoryId}`)
                  : router.push(`${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(col.title)}`)
              }
              className={`rounded-2xl bg-gradient-to-br ${col.gradient} p-3.5 cursor-pointer relative overflow-hidden`}
            >
              <div className="absolute right-2 top-2 opacity-20">
                <IonIcon icon={col.icon} className="text-4xl text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-[13px] font-bold text-white leading-tight">{col.title}</h3>
                {col.count && <p className="text-[10px] text-white/60 mt-0.5">{col.count} providers</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 6. Trending Categories ── */}
      {(feed?.quickCategories?.length ?? 0) > 0 && (
        <div className="mt-5">
          <h2 className="text-[15px] font-bold text-slate-800 px-4 mb-2.5">Trending Now</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.quickCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(cat.name)}&categoryIds=${cat.id}`)}
                className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm px-3 py-2 rounded-xl"
              >
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{cat.name}</span>
                {cat.providerCount > 0 && (
                  <span className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">{cat.providerCount}</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Popular Nearby — core discovery ── */}
      {filteredPopularNearby.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <div className="flex items-center gap-2">
              <IonIcon icon={locationOutline} className="text-sm text-blue-500" />
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Popular Nearby</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {filteredPopularNearby.map((p, i) => (
              <ProviderCard
                key={p.id}
                provider={p}
                index={i}
                isSaved={savedProviderIds.has(p.id)}
                onToggleSave={handleToggle}
                onClick={() => goToProvider(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Promo Banner Carousel ── */}
      {(feed?.bannerAds?.length ?? 0) > 0 && (
        <BannerCarousel
          banners={feed!.bannerAds}
          onBannerClick={(banner) => {
            trackAd.mutate({
              eventType: "click",
              entityType: "promo_banner",
              entityId: banner.id,
            });
            if (banner.linkUrl) router.push(banner.linkUrl);
          }}
        />
      )}

      {/* ── 9. Top Rated ── */}
      {filteredTopRated.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={star} className="text-sm text-amber-500" />
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Top Rated</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {filteredTopRated.map((p, i) => (
              <ProviderCard
                key={p.id}
                provider={p}
                index={i}
                isSaved={savedProviderIds.has(p.id)}
                onToggleSave={handleToggle}
                onClick={() => goToProvider(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 10. Category Spotlight ── */}
      {feed?.categorySpotlight && filteredSpotlightProviders.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <div className="flex items-center gap-2">
              {feed.categorySpotlight.category.icon && (
                <span className="text-base">{feed.categorySpotlight.category.icon}</span>
              )}
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">
                Explore {feed.categorySpotlight.category.name}
              </h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                router.push(
                  `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(feed.categorySpotlight!.category.name)}&categoryIds=${feed.categorySpotlight!.category.id}`,
                )
              }
              className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600"
            >
              See All <IonIcon icon={arrowForwardOutline} className="text-[10px]" />
            </motion.button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {filteredSpotlightProviders.map((p, i) => (
              <ProviderCard
                key={p.id}
                provider={p}
                index={i}
                isSaved={savedProviderIds.has(p.id)}
                onToggleSave={handleToggle}
                onClick={() => goToProvider(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 11. New Arrivals ── */}
      {filteredNewArrivals.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={rocketOutline} className="text-sm text-indigo-500" />
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">New Arrivals</h2>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-auto">
              Last 30 Days
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {filteredNewArrivals.map((p, i) => (
              <ProviderCard
                key={p.id}
                provider={p}
                index={i}
                isSaved={savedProviderIds.has(p.id)}
                onToggleSave={handleToggle}
                onClick={() => goToProvider(p.id)}
                isNew
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 12. Platform Stats — social proof ── */}
      {feed?.platformStats && (
        <div className="mt-5 mx-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-extrabold text-white">{feed.platformStats.verifiedProviders}</p>
              <p className="text-[9px] text-slate-400">Providers</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{feed.platformStats.totalReviews}</p>
              <p className="text-[9px] text-slate-400">Reviews</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-amber-400">
                {feed.platformStats.avgRating > 0 ? feed.platformStats.avgRating.toFixed(1) : "—"}
              </p>
              <p className="text-[9px] text-slate-400">Avg Rating</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{feed.platformStats.totalBookings}</p>
              <p className="text-[9px] text-slate-400">Bookings</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-2 bg-slate-50 dark:bg-slate-800 mx-0 mt-5" />

      {/* ── 13. Discover Nearby — infinite scroll list ── */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-slate-800 dark:text-white mr-auto">Discover Nearby</h2>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <motion.button
              key={opt.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold transition-colors ${
                sort === opt.key ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              <IonIcon icon={opt.icon} className="text-xs" />
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SectionSkeleton rows={4} />
      ) : (
        <div className="flex flex-col px-4 gap-3 pb-2">
          <AnimatePresence>
            {nearbyProviders.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <IonIcon icon={searchOutline} className="text-2xl text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-400">No providers found nearby</p>
                <p className="text-[12px] text-slate-300 mt-1">Try expanding your search radius</p>
              </motion.div>
            ) : (
              nearbyProviders.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  layout
                  whileTap={{ scale: 0.98 }}
                  onClick={() => goToProvider(p.id)}
                  className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 cursor-pointer"
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative w-[90px] h-[90px] rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-slate-100 to-slate-50">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-slate-200">{p.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      )}
                      {p.verified && (
                        <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <IonIcon icon={checkmarkCircleOutline} className="text-[7px]" />
                          Verified
                        </div>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => handleToggle(e, p.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                      >
                        <IonIcon
                          icon={savedProviderIds.has(p.id) ? heart : heartOutline}
                          className={`text-xs ${savedProviderIds.has(p.id) ? "text-red-400" : "text-white"}`}
                        />
                      </motion.button>
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-1 flex-1">{p.name}</h3>
                        {p.distance != null && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                            <IonIcon icon={navigateOutline} className="text-[9px]" />
                            {formatDistance(p.distance)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{p.service}</p>

                      <div className="flex items-center gap-2.5 mt-1.5">
                        {p.rating > 0 ? (
                          <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                            <IonIcon icon={star} className="text-[10px] text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{p.rating.toFixed(1)}</span>
                            {p.reviews > 0 && <span className="text-[9px] text-amber-600/60">({p.reviews})</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">New</span>
                        )}
                        {p.womenLed && (
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">♀ Women-Led</span>
                        )}
                      </div>

                      {p.location && (
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.location}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {hasNextPage && (
            <InfiniteScroll onLoadMore={() => fetchNextPage()} isLoading={isFetchingNextPage} hasMore={hasNextPage}>
              <div />
            </InfiniteScroll>
          )}

          {!hasNextPage && nearbyProviders.length > 0 && !isLoading && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2">
                <IonIcon icon={checkmarkCircleOutline} className="text-sm text-slate-300" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">You've seen all nearby providers</p>
            </div>
          )}
        </div>
      )}

      {/* ── Filter Sheet ── */}
      <FilterSheet
        opened={sheetOpened}
        filters={filters}
        onClose={() => setSheetOpened(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

/* ── Reusable Provider Card (horizontal scroll card) ── */

function ProviderCard({
  provider: p,
  index,
  isSaved,
  onToggleSave,
  onClick,
  isNew,
}: {
  provider: ExploreProvider;
  index: number;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
  isNew?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="shrink-0 w-[160px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-100 dark:border-slate-700"
    >
      <div className="relative h-[110px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-bold text-slate-200">{p.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
        {p.verified && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <IonIcon icon={checkmarkCircleOutline} className="text-[7px]" />
            Verified
          </div>
        )}
        {isNew && !p.verified && (
          <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">
            NEW
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => onToggleSave(e, p.id)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <IonIcon
            icon={isSaved ? heart : heartOutline}
            className={`text-xs ${isSaved ? "text-red-400" : "text-white"}`}
          />
        </motion.button>
        {p.distance != null && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <IonIcon icon={navigateOutline} className="w-2.5 h-2.5 text-amber-500" />
            {formatDistance(p.distance)}
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h4 className="text-[12px] font-semibold text-slate-800 dark:text-white line-clamp-1">{p.name}</h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{p.services || p.location}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {p.rating > 0 ? (
            <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
              <IonIcon icon={star} className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{p.rating.toFixed(1)}</span>
              {p.reviewCount > 0 && <span className="text-[9px] text-amber-600/60">({p.reviewCount})</span>}
            </div>
          ) : (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">New</span>
          )}
        </div>
        <ProviderBadgeList badges={p.badges} />
      </div>
    </motion.div>
  );
}

export default ExploreContent;
