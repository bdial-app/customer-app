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

type SortKey = "nearest" | "top_rated" | "newest";

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "nearest", label: "Nearest", icon: locationOutline },
  { key: "top_rated", label: "Top Rated", icon: starOutline },
  { key: "newest", label: "Newest", icon: timeOutline },
];

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
      <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 animate-pulse">
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
      <div key={i} className="shrink-0 w-[170px] bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
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

/* ── Main Component ── */

const ExploreContent = () => {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("nearest");

  const user = useAppSelector((state) => state.auth.user as any);
  const feedParams = {
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
  };

  const { data: feed, isLoading: feedLoading } = useExploreFeed(feedParams);
  const trackAd = useTrackAd();

  const { data: nearbyData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: nearbyLoading } =
    useNearbyProviders({
      lat: user?.latitude || 18.5204,
      lng: user?.longitude || 73.8567,
      city: user?.city,
      limit: 12,
      radius: 25,
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

      {/* ── 1. Search Bar ── */}
      <div className="px-4 pt-2 pb-1">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(ROUTE_PATH.SEARCH)}
          className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-3.5 py-3 shadow-sm cursor-pointer"
        >
          <IonIcon icon={searchOutline} className="text-base text-slate-400 shrink-0" />
          <span className="flex-1 text-sm text-slate-400">Search services, businesses...</span>
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Search</span>
        </motion.div>
      </div>

      {/* ── 2. Quick Action Pills ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3 pb-1">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`${ROUTE_PATH.SEARCH}${action.query}`)}
            className={`shrink-0 flex items-center gap-1.5 ${action.bg} border ${action.border} px-3 py-2 rounded-xl shadow-sm`}
          >
            <IonIcon icon={action.icon} className={`text-sm ${action.color}`} />
            <span className={`text-[11px] font-bold ${action.color} whitespace-nowrap`}>{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ── 3. Sponsored Carousel — revenue: CPC ads ── */}
      {feedLoading && (
        <div className="mt-4">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <div className="w-4 h-4 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
          </div>
          <CardCarouselSkeleton cards={3} />
        </div>
      )}
      {!feedLoading && (feed?.sponsoredCarousel?.length ?? 0) > 0 && (
        <div className="mt-4" ref={sponsoredRef}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={megaphoneOutline} className="text-sm text-amber-500" />
            <h2 className="text-[15px] font-bold text-slate-800">Sponsored</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.sponsoredCarousel.map((p, i) => (
              <motion.div
                key={p.id}
                data-track-id={p.sponsoredListingId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSponsoredClick(p)}
                className="shrink-0 w-[170px] bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border-2 border-amber-200/60"
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
                  <h4 className="text-[13px] font-semibold text-slate-800 line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{p.services || p.location}</p>
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
            <div className="w-4 h-4 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
          </div>
          <CardCarouselSkeleton cards={3} />
        </div>
      )}
      {!feedLoading && (feed?.activeOffers?.length ?? 0) > 0 && (
        <div className="mt-5" ref={offersRef}>
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <IonIcon icon={pricetagOutline} className="text-base text-rose-500" />
            </motion.div>
            <h2 className="text-[15px] font-bold text-slate-800">Deals & Offers</h2>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ml-auto">
              Limited Time
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.activeOffers.map((p, i) => (
              <motion.div
                key={p.offerId}
                data-track-id={p.offerId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOfferClick(p)}
                className="shrink-0 w-[170px] bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-rose-100"
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
                  <h4 className="text-[12px] font-semibold text-slate-800 line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5 line-clamp-1">{p.offerTitle}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {p.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <IonIcon icon={star} className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-700">{p.rating.toFixed(1)}</span>
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
                className="shrink-0 flex items-center gap-1.5 bg-white border border-slate-100 shadow-sm px-3 py-2 rounded-xl"
              >
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                <span className="text-[12px] font-semibold text-slate-700 whitespace-nowrap">{cat.name}</span>
                {cat.providerCount > 0 && (
                  <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">{cat.providerCount}</span>
                )}
              </motion.button>
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
              <h2 className="text-[15px] font-bold text-slate-800">Popular Nearby</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.popularNearby.map((p, i) => (
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

      {/* ── 8. Interstitial Banner Ad ── */}
      {feed?.bannerAd && (
        <div className="mx-4 mt-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (feed.bannerAd?.id) {
                trackAd.mutate({
                  eventType: "click",
                  entityType: "promo_banner",
                  entityId: feed.bannerAd.id,
                });
              }
              if (feed.bannerAd?.linkUrl) router.push(feed.bannerAd.linkUrl);
            }}
            style={{ background: feed.bannerAd.gradient || "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
            className="rounded-2xl p-4 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/[0.08]" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex-1">
                {feed.bannerAd.tag && (
                  <span className="text-[9px] font-bold tracking-wider text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
                    {feed.bannerAd.tag}
                  </span>
                )}
                <h3 className="text-base font-extrabold text-white mt-1 leading-tight">{feed.bannerAd.title}</h3>
                {feed.bannerAd.subtitle && <p className="text-[11px] text-white/70 mt-0.5">{feed.bannerAd.subtitle}</p>}
              </div>
              {feed.bannerAd.emoji && <span className="text-3xl">{feed.bannerAd.emoji}</span>}
              <span className="text-[10px] font-bold text-white bg-white/20 px-3 py-1.5 rounded-xl shrink-0">
                {feed.bannerAd.cta ?? "View →"}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── 9. Top Rated ── */}
      {(feed?.topRated?.length ?? 0) > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={star} className="text-sm text-amber-500" />
            <h2 className="text-[15px] font-bold text-slate-800">Top Rated</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.topRated.map((p, i) => (
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
      {feed?.categorySpotlight && (
        <div className="mt-5">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <div className="flex items-center gap-2">
              {feed.categorySpotlight.category.icon && (
                <span className="text-base">{feed.categorySpotlight.category.icon}</span>
              )}
              <h2 className="text-[15px] font-bold text-slate-800">
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
            {feed.categorySpotlight.providers.map((p, i) => (
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
      {(feed?.newArrivals?.length ?? 0) > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <IonIcon icon={rocketOutline} className="text-sm text-indigo-500" />
            <h2 className="text-[15px] font-bold text-slate-800">New Arrivals</h2>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-auto">
              Last 30 Days
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {feed!.newArrivals.map((p, i) => (
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

      <div className="h-2 bg-slate-50 mx-0 mt-5" />

      {/* ── 13. Discover Nearby — infinite scroll list ── */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-slate-800 mr-auto">Discover Nearby</h2>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <motion.button
              key={opt.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSort(opt.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold transition-colors ${
                sort === opt.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
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
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
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
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 cursor-pointer"
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
                        <h3 className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-1 flex-1">{p.name}</h3>
                        {p.distance != null && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            <IonIcon icon={navigateOutline} className="text-[9px]" />
                            {formatDistance(p.distance)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.service}</p>

                      <div className="flex items-center gap-2.5 mt-1.5">
                        {p.rating > 0 ? (
                          <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            <IonIcon icon={star} className="text-[10px] text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-700">{p.rating.toFixed(1)}</span>
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
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                <IonIcon icon={checkmarkCircleOutline} className="text-sm text-slate-300" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">You've seen all nearby providers</p>
            </div>
          )}
        </div>
      )}
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
      className="shrink-0 w-[160px] bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-100"
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
        <h4 className="text-[12px] font-semibold text-slate-800 line-clamp-1">{p.name}</h4>
        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{p.services || p.location}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {p.rating > 0 ? (
            <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
              <IonIcon icon={star} className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700">{p.rating.toFixed(1)}</span>
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
