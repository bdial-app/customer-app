"use client";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import OptimizedImage from "@/app/components/ui/optimized-image";
import {
  searchOutline,
  locationOutline,
  starOutline,
  star,
  heartOutline,
  heart,
  flashOutline,
  trendingUpOutline,
  ribbonOutline,
  sparklesOutline,
  checkmarkCircleOutline,
  navigateOutline,
  shieldCheckmarkOutline,
  femaleOutline,
  diamondOutline,
  megaphoneOutline,
  pricetagOutline,
  arrowForwardOutline,
  rocketOutline,
  optionsOutline,
  closeCircle,
  swapVerticalOutline,
  gridOutline,
  listOutline,
  chevronDown,
} from "ionicons/icons";
import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { useNearbyProviders } from "@/hooks/useProvider";
import { useAppSelector } from "@/hooks/useAppStore";
import { useToggleSaved, useSavedItemIds } from "@/hooks/useSavedItems";
import { useExploreFeed, useTrackAd } from "@/hooks/useExplore";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  ExploreProvider,
  SponsoredProvider,
  ProviderWithOffer,
} from "@/services/explore.service";

import ProviderCard from "./provider-card";
import InfiniteScroll from "./infinite-scroll";
import QuickFilterPills, { type QuickFilters } from "./all-services-quick-filters";
import FilterSheet, { type AllServicesFilters } from "./filter-sheet";
import FilterChips from "./filter-chips";

type DiscoverSort = "relevance" | "rating" | "distance" | "reviews";

const DISCOVER_SORT_OPTIONS: { value: DiscoverSort; label: string }[] = [
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

const QUICK_ACTIONS = [
  { label: "Women-Led", icon: femaleOutline, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", query: "?womenLed=true" },
  { label: "Verified", icon: shieldCheckmarkOutline, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", query: "?verified=true" },
  { label: "Top Rated", icon: star, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", query: "?sortBy=rating" },
  { label: "Featured", icon: diamondOutline, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", query: "?featured=true" },
];

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

const ExploreContent = memo(() => {
  const router = useRouter();

  // ── Discover Nearby filter state ──
  const [discoverSearch, setDiscoverSearch] = useState("");
  const debouncedDiscoverSearch = useDebounce(discoverSearch, 400);
  const [discoverSort, setDiscoverSort] = useState<DiscoverSort>("distance");
  const [showDiscoverSortMenu, setShowDiscoverSortMenu] = useState(false);
  const [discoverView, setDiscoverView] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("exploreDiscoverView") as "grid" | "list") || "list";
    }
    return "list";
  });
  const [discoverFilters, setDiscoverFilters] = useState<AllServicesFilters>({
    ...EMPTY_FILTERS,
    categoryIds: new Set(),
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const discoverInputRef = useRef<HTMLInputElement>(null);

  const discoverQuickFilters: QuickFilters = useMemo(
    () => ({
      verifiedOnly: discoverFilters.verifiedOnly,
      womenLedOnly: discoverFilters.womenLedOnly,
      topRated: discoverFilters.minRating !== null && discoverFilters.minRating >= 4,
      nearby: discoverFilters.maxDistance !== null && discoverFilters.maxDistance <= 5,
    }),
    [discoverFilters],
  );

  const activeFilterCount =
    discoverFilters.categoryIds.size +
    (discoverFilters.minRating ? 1 : 0) +
    (discoverFilters.maxDistance ? 1 : 0) +
    (discoverFilters.verifiedOnly ? 1 : 0) +
    (discoverFilters.womenLedOnly ? 1 : 0);

  // Persist view mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("exploreDiscoverView", discoverView);
    }
  }, [discoverView]);

  const handleQuickToggle = useCallback((key: keyof QuickFilters) => {
    setDiscoverFilters((prev) => {
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

  const handleRemoveCategory = useCallback((id: string) => {
    setDiscoverFilters((prev) => {
      const next = new Set(prev.categoryIds);
      next.delete(id);
      return { ...prev, categoryIds: next };
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setDiscoverFilters({ ...EMPTY_FILTERS, categoryIds: new Set() });
  }, []);

  const handleApplyFilters = useCallback((f: AllServicesFilters) => {
    setDiscoverFilters({ ...f, categoryIds: new Set(f.categoryIds) });
    setFilterSheetOpen(false);
  }, []);

  const handleClearDiscoverSearch = useCallback(() => {
    setDiscoverSearch("");
    discoverInputRef.current?.focus();
  }, []);

  const user = useAppSelector((state) => state.auth.user as any);
  const feedParams = {
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
  };

  const { data: feed, isLoading: feedLoading } = useExploreFeed(feedParams);
  const trackAd = useTrackAd();

  const { data: nearbyData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: nearbyLoading, isFetching: nearbyFetching } =
    useNearbyProviders({
      lat: user?.latitude || 18.5204,
      lng: user?.longitude || 73.8567,
      city: user?.city,
      limit: 12,
      radius: discoverFilters.maxDistance || 25,
      search: debouncedDiscoverSearch || undefined,
      categoryIds: Array.from(discoverFilters.categoryIds),
      sortBy: discoverSort === "relevance" ? undefined : discoverSort,
      minRating: discoverFilters.minRating ?? undefined,
      verifiedOnly: discoverFilters.verifiedOnly || undefined,
      womenLedOnly: discoverFilters.womenLedOnly || undefined,
    });

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

  // Nearby providers mapped for shared ProviderCard component
  const nearbyProviders = useMemo(() => {
    if (!nearbyData) return [];
    return nearbyData.pages.flatMap((page) =>
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
        featured: p.isFeatured || false,
        location: [p.area, p.city].filter(Boolean).join(", "),
        badges: [],
      })),
    );
  }, [nearbyData]);

  const nearbyTotal = nearbyData?.pages?.[0]?.meta?.total ?? nearbyProviders.length;
  const isDiscoverSearching = nearbyFetching && !isFetchingNextPage && !nearbyLoading;

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

  return (
    <div className="flex flex-col pb-4">

      {/* ── 1. Search Bar ── */}
      <div className="px-4 pt-2 pb-1">
        <div
          onClick={() => router.push(ROUTE_PATH.SEARCH)}
          className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-3 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
        >
          <IonIcon icon={searchOutline} className="text-base text-slate-400 shrink-0" />
          <span className="flex-1 text-sm text-slate-400">Search services, businesses...</span>
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">Search</span>
        </div>
      </div>

      {/* ── 2. Quick Action Pills ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3 pb-1">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={action.label}
            onClick={() => router.push(`${ROUTE_PATH.SEARCH}${action.query}`)}
            className={`shrink-0 flex items-center gap-1.5 ${action.bg} border ${action.border} px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-transform`}
          >
            <IonIcon icon={action.icon} className={`text-sm ${action.color}`} />
            <span className={`text-[11px] font-bold ${action.color} whitespace-nowrap`}>{action.label}</span>
          </button>
        ))}
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
      {!feedLoading && (feed?.sponsoredCarousel?.length ?? 0) > 0 && (
        <div className="mt-4" ref={sponsoredRef}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={megaphoneOutline} className="text-sm text-amber-500" />
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Sponsored</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.sponsoredCarousel.map((p, i) => (
              <div
                key={p.id}
                data-track-id={p.sponsoredListingId}
                onClick={() => handleSponsoredClick(p)}
                className="shrink-0 w-[170px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border-2 border-amber-200/60 dark:border-amber-700/40 active:scale-[0.97] transition-transform"
              >
                <div className="relative h-[115px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  {p.image ? (
                    <OptimizedImage src={p.image} alt={p.name} className="w-full h-full" width={170} height={115} priority={i < 3} />
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
                  </div>
                </div>
              </div>
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
      {!feedLoading && (feed?.activeOffers?.length ?? 0) > 0 && (
        <div className="mt-5" ref={offersRef}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={pricetagOutline} className="text-base text-rose-500" />
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Deals & Offers</h2>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ml-auto">
              Limited Time
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.activeOffers.map((p, i) => (
              <div
                key={p.offerId}
                data-track-id={p.offerId}
                onClick={() => handleOfferClick(p)}
                className="shrink-0 w-[170px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-rose-100 dark:border-rose-900/40 active:scale-[0.96] transition-transform"
              >
                <div className="relative h-[100px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  {p.image ? (
                    <OptimizedImage src={p.image} alt={p.name} className="w-full h-full" width={170} height={100} priority={i < 3} />
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Quick Categories — discovery grid ── */}
      <div className="mt-5">
        <h2 className="text-[15px] font-bold text-slate-800 px-4 mb-2.5">Curated Collections</h2>
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {collections.slice(0, 4).map((col: any, i: number) => (
            <div
              key={col.id}
              onClick={() =>
                col.categoryId
                  ? router.push(`${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(col.title)}&categoryIds=${col.categoryId}`)
                  : router.push(`${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(col.title)}`)
              }
              className={`rounded-2xl bg-gradient-to-br ${col.gradient} p-3.5 cursor-pointer relative overflow-hidden active:scale-[0.96] transition-transform`}
            >
              <div className="absolute right-2 top-2 opacity-20">
                <IonIcon icon={col.icon} className="text-4xl text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-[13px] font-bold text-white leading-tight">{col.title}</h3>
                {col.count && <p className="text-[10px] text-white/60 mt-0.5">{col.count} providers</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Trending Categories ── */}
      {(feed?.quickCategories?.length ?? 0) > 0 && (
        <div className="mt-5">
          <h2 className="text-[15px] font-bold text-slate-800 px-4 mb-2.5">Trending Now</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.quickCategories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => router.push(`${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(cat.name)}&categoryIds=${cat.id}`)}
                className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm px-3 py-2 rounded-xl active:scale-95 transition-transform"
              >
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{cat.name}</span>
                {cat.providerCount > 0 && (
                  <span className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">{cat.providerCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Popular Nearby — core discovery ── */}
      {(feed?.popularNearby?.length ?? 0) > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <div className="flex items-center gap-2">
              <IonIcon icon={locationOutline} className="text-sm text-blue-500" />
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Popular Nearby</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.popularNearby.map((p, i) => (
              <ExploreCarouselCard
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
      {(feed?.topRated?.length ?? 0) > 0 && (
        <div className="mt-5" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 250px" }}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={star} className="text-sm text-amber-500" />
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Top Rated</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.topRated.map((p, i) => (
              <ExploreCarouselCard
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
      {feed?.categorySpotlight && (
        <div className="mt-5" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 250px" }}>
          <div className="flex items-center justify-between px-4 mb-2.5">
            <div className="flex items-center gap-2">
              {feed.categorySpotlight.category.icon && (
                <span className="text-base">{feed.categorySpotlight.category.icon}</span>
              )}
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">
                Explore {feed.categorySpotlight.category.name}
              </h2>
            </div>
            <button
              onClick={() =>
                router.push(
                  `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(feed.categorySpotlight!.category.name)}&categoryIds=${feed.categorySpotlight!.category.id}`,
                )
              }
              className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 active:scale-95 transition-transform"
            >
              See All <IonIcon icon={arrowForwardOutline} className="text-[10px]" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed.categorySpotlight.providers.map((p, i) => (
              <ExploreCarouselCard
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
      {(feed?.newArrivals?.length ?? 0) > 0 && (
        <div className="mt-5" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 250px" }}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={rocketOutline} className="text-sm text-indigo-500" />
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">New Arrivals</h2>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-auto">
              Last 30 Days
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.newArrivals.map((p, i) => (
              <ExploreCarouselCard
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

      {/* ── 13. Discover Nearby — filtered infinite scroll ── */}
      <div className="pt-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-white mr-auto">Discover Nearby</h2>
          {!nearbyLoading && (
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              {nearbyTotal} {nearbyTotal === 1 ? "provider" : "providers"}
            </p>
          )}
        </div>

        {/* Search + filter button */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <div className="flex-1 relative">
            <IonIcon
              icon={searchOutline}
              className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              ref={discoverInputRef}
              type="search"
              inputMode="search"
              placeholder="Search nearby providers..."
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300 dark:focus:border-amber-500 transition-all"
            />
            {discoverSearch.length > 0 && (
              <button
                onClick={handleClearDiscoverSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 active:text-gray-600"
                aria-label="Clear search"
              >
                <IonIcon icon={closeCircle} className="w-4.5 h-4.5" />
              </button>
            )}
            {isDiscoverSearching && (
              <span className="absolute right-9 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            )}
          </div>
          <button
            onClick={() => setFilterSheetOpen(true)}
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
          <QuickFilterPills filters={discoverQuickFilters} onToggle={handleQuickToggle} />
        </div>

        {/* Filter chips + sort + view toggle */}
        {(activeFilterCount > 0 || nearbyProviders.length > 0) && (
          <div className="flex items-center gap-2 px-4 pb-2.5">
            {activeFilterCount > 0 ? (
              <div className="flex-1 overflow-hidden">
                <FilterChips
                  filters={discoverFilters}
                  onRemoveCategory={handleRemoveCategory}
                  onRemoveRating={() => setDiscoverFilters((f) => ({ ...f, minRating: null }))}
                  onRemoveDistance={() => setDiscoverFilters((f) => ({ ...f, maxDistance: null }))}
                  onRemoveVerified={() => setDiscoverFilters((f) => ({ ...f, verifiedOnly: false }))}
                  onRemoveWomenLed={() => setDiscoverFilters((f) => ({ ...f, womenLedOnly: false }))}
                  onClearAll={handleClearAllFilters}
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* View toggle */}
            {nearbyProviders.length > 0 && (
              <button
                onClick={() => setDiscoverView((v) => (v === "grid" ? "list" : "grid"))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 active:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle view"
              >
                <IonIcon icon={discoverView === "grid" ? listOutline : gridOutline} className="w-4 h-4" />
              </button>
            )}

            {/* Sort button */}
            {nearbyProviders.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowDiscoverSortMenu((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700 active:bg-gray-100 dark:active:bg-slate-700 transition-colors"
                >
                  <IonIcon icon={swapVerticalOutline} className="w-3 h-3" />
                  {DISCOVER_SORT_OPTIONS.find((s) => s.value === discoverSort)?.label}
                  <IonIcon icon={chevronDown} className="w-3 h-3" />
                </button>
                {showDiscoverSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDiscoverSortMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 min-w-[160px]">
                      {DISCOVER_SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setDiscoverSort(opt.value);
                            setShowDiscoverSortMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                            discoverSort === opt.value
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

        {/* Results */}
        {nearbyLoading ? (
          <SectionSkeleton rows={4} />
        ) : nearbyProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <IonIcon icon={searchOutline} className="text-2xl text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-400">No providers found nearby</p>
            <p className="text-[12px] text-slate-300 mt-1">
              {activeFilterCount > 0 ? "Try adjusting your filters" : "Try expanding your search radius"}
            </p>
            {(activeFilterCount > 0 || discoverSearch) && (
              <button
                onClick={() => { handleClearAllFilters(); setDiscoverSearch(""); }}
                className="mt-3 text-[13px] font-semibold text-amber-600 active:opacity-70"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="pb-6">
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                <span className="font-semibold text-gray-700 dark:text-slate-300">{nearbyTotal}</span> {nearbyTotal === 1 ? "result" : "results"}
                {discoverSort !== "relevance" && (
                  <span> &middot; {DISCOVER_SORT_OPTIONS.find((s) => s.value === discoverSort)?.label}</span>
                )}
              </p>
            </div>
            <InfiniteScroll
              hasMore={!!hasNextPage}
              isLoading={isFetchingNextPage}
              onLoadMore={fetchNextPage}
            >
              {discoverView === "grid" ? (
                <div className="grid grid-cols-2 gap-3 px-4">
                  {nearbyProviders.map((p, i) => (
                    <ProviderCard key={p.id} provider={p} index={i} variant="grid" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 px-4">
                  {nearbyProviders.map((p, i) => (
                    <ProviderCard key={p.id} provider={p} index={i} variant="list" />
                  ))}
                </div>
              )}
            </InfiniteScroll>

            {!hasNextPage && nearbyProviders.length > 0 && !nearbyLoading && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <IonIcon icon={checkmarkCircleOutline} className="text-sm text-slate-300" />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">You've seen all nearby providers</p>
              </div>
            )}
          </div>
        )}
      </div>

      <FilterSheet
        opened={filterSheetOpen}
        filters={discoverFilters}
        onClose={() => setFilterSheetOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
});

/* ── Horizontal Scroll Provider Card (for carousels) ── */

function ExploreCarouselCard({
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
    <div
      onClick={onClick}
      className="shrink-0 w-[160px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-100 dark:border-slate-700 active:scale-[0.97] transition-transform"
    >
      <div className="relative h-[110px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {p.image ? (
          <OptimizedImage src={p.image} alt={p.name} className="w-full h-full" width={160} height={110} priority={index < 3} />
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
        <button
          onClick={(e) => onToggleSave(e, p.id)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-[0.8] transition-transform"
        >
          <IonIcon
            icon={isSaved ? heart : heartOutline}
            className={`text-xs ${isSaved ? "text-red-400" : "text-white"}`}
          />
        </button>
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
      </div>
    </div>
  );
}

ExploreContent.displayName = "ExploreContent";

export default ExploreContent;
