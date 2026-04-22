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
  filterOutline,
  flashOutline,
  trendingUpOutline,
  timeOutline,
  ribbonOutline,
  sparklesOutline,
  closeCircle,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { useNearbyProviders } from "@/hooks/useProvider";
import { useAppSelector } from "@/hooks/useAppStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useToggleSaved, useSavedItemIds } from "@/hooks/useSavedItems";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import InfiniteScroll from "./infinite-scroll";

type SortKey = "nearest" | "top_rated" | "newest";

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "nearest", label: "Nearest", icon: locationOutline },
  { key: "top_rated", label: "Top Rated", icon: starOutline },
  { key: "newest", label: "Newest", icon: timeOutline },
];

const COLLECTIONS = [
  { id: "wedding", title: "Wedding Season", count: "24+", gradient: "from-amber-400 to-orange-600", icon: ribbonOutline },
  { id: "budget", title: "Under ₹500", count: "45+", gradient: "from-emerald-400 to-teal-600", icon: flashOutline },
  { id: "new", title: "New Arrivals", count: "12+", gradient: "from-blue-400 to-indigo-600", icon: sparklesOutline },
  { id: "popular", title: "Most Booked", count: "30+", gradient: "from-pink-400 to-rose-600", icon: trendingUpOutline },
];

/* ── Component ── */

const ExploreContent = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [sort, setSort] = useState<SortKey>("nearest");

  const user = useAppSelector((state) => state.auth.user as any);

  const { data: feed } = useHomeFeed({
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNearbyProviders({
    lat: user?.latitude || 18.5204,
    lng: user?.longitude || 73.8567,
    search: debouncedSearch,
    city: user?.city,
    limit: 12,
    radius: 20,
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

  const providers = useMemo(() => {
    if (!data) return [];
    const mapped = data.pages.flatMap((page) =>
      page.data.map((p: any) => ({
        id: p.id,
        name: p.brandName,
        service: p.services || p.description?.split(",")[0] || "Services",
        distance: p.distance,
        rating: p.rating ?? 0,
        reviews: p.reviewCount ?? 0,
        image: p.profilePhotoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
        verified: p.status === "active",
        location: [p.area, p.city].filter(Boolean).join(", "),
      }))
    );
    if (sort === "top_rated") return [...mapped].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "nearest") return [...mapped].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    return mapped;
  }, [data, sort]);

  const trendingCategories = (feed as any)?.trendingCategories ?? [];
  const flashDeals = (feed as any)?.promos ?? [];

  return (
    <div className="flex flex-col pb-4">

      {/* ── Search Bar ── */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-sm">
          <IonIcon icon={searchOutline} className="text-base text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search providers, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
          {search ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearch("")}>
              <IonIcon icon={closeCircle} className="text-base text-slate-400" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push(ROUTE_PATH.ALL_SERVICES)}
              className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1"
            >
              <IonIcon icon={filterOutline} className="text-sm text-slate-600" />
              <span className="text-[11px] font-semibold text-slate-600">Filter</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Flash Deals / Promos from API ── */}
      {flashDeals.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <IonIcon icon={flashOutline} className="text-base text-amber-500" />
            </motion.div>
            <h2 className="text-[15px] font-bold text-slate-800">Flash Deals</h2>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
              Limited Time
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {flashDeals.map((deal: any, i: number) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.96 }}
                style={{ background: deal.gradient || "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
                className="shrink-0 w-[200px] rounded-2xl p-3.5 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/[0.08]" />
                <div className="relative z-10">
                  {deal.tag && (
                    <span className="text-[9px] font-bold tracking-wider text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
                      {deal.tag}
                    </span>
                  )}
                  <h3 className="text-base font-extrabold text-white mt-2 leading-tight">{deal.title}</h3>
                  {deal.subtitle && <p className="text-[11px] text-white/70 mt-0.5">{deal.subtitle}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-white/50 flex items-center gap-1">
                      <IonIcon icon={timeOutline} className="text-[10px]" />
                      Limited
                    </span>
                    <span className="text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg">
                      {deal.cta ?? "View →"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Curated Collections ── */}
      <div className="mt-5">
        <h2 className="text-[15px] font-bold text-slate-800 px-4 mb-2.5">Curated Collections</h2>
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {COLLECTIONS.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push(`${ROUTE_PATH.ALL_SERVICES}?search=${col.title}`)}
              className={`rounded-2xl bg-gradient-to-br ${col.gradient} p-3.5 cursor-pointer relative overflow-hidden`}
            >
              <div className="absolute right-2 top-2 opacity-20">
                <IonIcon icon={col.icon} className="text-4xl text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-[13px] font-bold text-white leading-tight">{col.title}</h3>
                <p className="text-[10px] text-white/60 mt-0.5">{col.count} providers</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Trending Categories from API ── */}
      {trendingCategories.length > 0 && (
        <div className="mt-5">
          <h2 className="text-[15px] font-bold text-slate-800 px-4 mb-2.5">Trending Now</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
            {trendingCategories.map((cat: any, i: number) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`${ROUTE_PATH.ALL_SERVICES}?search=${cat.name}`)}
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

      <div className="h-2 bg-slate-50 mx-0 mt-5" />

      {/* ── Sort chips + Discover section ── */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-slate-800 mr-auto">
          {search ? `Results for "${search}"` : "Discover Nearby"}
        </h2>
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

      {/* ── Provider List ── */}
      {isLoading ? (
        <div className="flex flex-col px-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
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
      ) : (
        <div className="flex flex-col px-4 gap-3 pb-2">
          <AnimatePresence>
            {providers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <IonIcon icon={searchOutline} className="text-2xl text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-400">No providers found</p>
                {search && (
                  <button onClick={() => setSearch("")} className="mt-2 text-[12px] text-amber-600 font-semibold">
                    Clear search
                  </button>
                )}
              </motion.div>
            ) : (
              providers.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  layout
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${p.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 cursor-pointer"
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative w-[90px] h-[90px] rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
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
                      <h3 className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-1">{p.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.service}</p>

                      <div className="flex items-center gap-2.5 mt-1.5">
                        {p.rating > 0 && (
                          <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            <IonIcon icon={star} className="text-[10px] text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-700">{p.rating.toFixed(1)}</span>
                            {p.reviews > 0 && <span className="text-[9px] text-amber-600/60">({p.reviews})</span>}
                          </div>
                        )}
                        {p.distance != null && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <IonIcon icon={locationOutline} className="text-[10px]" />
                            {Number(p.distance).toFixed(1)} km
                          </span>
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
            <InfiniteScroll
              onLoadMore={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              hasMore={hasNextPage}
            >
              <div />
            </InfiniteScroll>
          )}
        </div>
      )}
    </div>
  );
};

export default ExploreContent;
