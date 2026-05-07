"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  pricetagOutline,
  star,
  timeOutline,
  chevronBackOutline,
  locationOutline,
  funnelOutline,
  closeCircle,
  flashOutline,
  globeOutline,
  navigateOutline,
  shieldCheckmarkOutline,
  femaleOutline,
  trendingUpOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ROUTE_PATH } from "@/utils/contants";
import { useAppSelector } from "@/hooks/useAppStore";
import { useDeals } from "@/hooks/useDeals";
import { getTopLevelCategories } from "@/services/category.service";
import OptimizedImage from "@/app/components/ui/optimized-image";
import type { ProviderWithOffer } from "@/services/explore.service";

type SortOption = "discount" | "ending_soon" | "distance" | "newest";
type DiscountFilter = "all" | "percentage" | "flat";
type AreaMode = "nearby" | "city" | "all";
type MinDiscountLevel = 0 | 10 | 20 | 30 | 50;
type MinRatingLevel = 0 | 3 | 4 | 4.5;

const SORT_OPTIONS: { value: SortOption; label: string; icon?: string }[] = [
  { value: "discount", label: "Best Discount" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "distance", label: "Nearest" },
  { value: "newest", label: "Newest" },
];

const AREA_OPTIONS: { value: AreaMode; label: string; radius: number }[] = [
  { value: "nearby", label: "Nearby (5km)", radius: 5 },
  { value: "city", label: "My City (25km)", radius: 25 },
  { value: "all", label: "All Areas", radius: 0 },
];

const DISCOUNT_FILTERS: { value: DiscountFilter; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "percentage", label: "% Off" },
  { value: "flat", label: "₹ Off" },
];

const MIN_DISCOUNT_OPTIONS: { value: MinDiscountLevel; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 10, label: "10%+" },
  { value: 20, label: "20%+" },
  { value: 30, label: "30%+" },
  { value: 50, label: "50%+" },
];

const MIN_RATING_OPTIONS: { value: MinRatingLevel; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 3, label: "3★+" },
  { value: 4, label: "4★+" },
  { value: 4.5, label: "4.5★+" },
];

const formatOfferLabel = (type: string, value: number) =>
  type === "percentage" ? `${value}% OFF` : `₹${value} OFF`;

const formatTimeLeft = (endsAt: string) => {
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  if (days > 7)
    return `Ends ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${mins}m left`;
};

const formatEndDate = (endsAt: string) => {
  const end = new Date(endsAt);
  return end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDistance = (d: number) =>
  d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;

const DealCard = ({
  deal,
  onClick,
}: {
  deal: ProviderWithOffer;
  onClick: () => void;
}) => {
  const timeLeft = formatTimeLeft(deal.offerEndsAt);
  const isUrgent = timeLeft.includes("h left") || timeLeft.includes("m left");

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-rose-100 dark:border-rose-900/40 active:scale-[0.97] transition-transform"
    >
      {/* Image */}
      <div className="relative h-[120px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
        {deal.image ? (
          <OptimizedImage
            src={deal.image}
            alt={deal.name}
            className="w-full h-full"
            width={200}
            height={120}
            preset="card"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-bold text-slate-200 dark:text-slate-600">
              {deal.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
        {/* Discount Badge */}
        <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
          {formatOfferLabel(deal.discountType, deal.discountValue)}
        </div>
        {/* Urgency Badge */}
        {isUrgent && (
          <div className="absolute bottom-2 left-2 bg-orange-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <IonIcon icon={flashOutline} className="w-2 h-2" />
            Ending Soon
          </div>
        )}
        {/* Verified Badge */}
        {deal.verified && (
          <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
            ✓ Verified
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h4 className="text-[12px] font-semibold text-slate-800 dark:text-white line-clamp-1">
          {deal.name}
        </h4>
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5 line-clamp-1">
          {deal.offerTitle}
        </p>
        {/* Multiple offers indicator */}
        {(deal.providerDealCount ?? 1) > 1 && (
          <p className="text-[9px] text-blue-500 dark:text-blue-400 font-medium mt-0.5">
            {deal.providerDealCount} offers from this business
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          {deal.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <IonIcon icon={star} className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                {deal.rating.toFixed(1)}
              </span>
            </div>
          )}
          {deal.distance != null && (
            <div className="flex items-center gap-0.5">
              <IonIcon
                icon={locationOutline}
                className="w-2.5 h-2.5 text-slate-400"
              />
              <span className="text-[9px] text-slate-400">
                {formatDistance(deal.distance)}
              </span>
            </div>
          )}
          {deal.location && !deal.distance && (
            <span className="text-[9px] text-slate-400 truncate flex-1">
              {deal.location}
            </span>
          )}
        </div>

        {/* End Date */}
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-rose-50 dark:border-rose-900/30">
          <div className="flex items-center gap-1">
            <IonIcon icon={timeOutline} className="w-2.5 h-2.5 text-rose-400" />
            <span className={`text-[9px] font-semibold ${isUrgent ? "text-orange-500" : "text-rose-500 dark:text-rose-400"}`}>
              {timeLeft}
            </span>
          </div>
          <span className="text-[8px] text-slate-400">
            {formatEndDate(deal.offerEndsAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DealsPageContent = () => {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [sort, setSort] = useState<SortOption>("discount");
  const [areaMode, setAreaMode] = useState<AreaMode>("city");
  const [discountFilter, setDiscountFilter] = useState<DiscountFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [minDiscount, setMinDiscount] = useState<MinDiscountLevel>(0);
  const [minRating, setMinRating] = useState<MinRatingLevel>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [endingSoon, setEndingSoon] = useState(false);
  const [womenLed, setWomenLed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ["top-level-categories"],
    queryFn: getTopLevelCategories,
    staleTime: 10 * 60 * 1000,
  });

  // Compute radius from area mode
  const radius = AREA_OPTIONS.find((a) => a.value === areaMode)?.radius ?? 25;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDeals({
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
    sort,
    radius,
    category: selectedCategory,
    discountType: discountFilter === "all" ? undefined : discountFilter,
    minDiscount: minDiscount > 0 ? minDiscount : undefined,
    verified: verifiedOnly || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    endingSoon: endingSoon || undefined,
    womenLed: womenLed || undefined,
  });

  const deals = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );
  const total = data?.pages[0]?.total ?? 0;

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (discountFilter !== "all") count++;
    if (selectedCategory) count++;
    if (areaMode !== "city") count++;
    if (minDiscount > 0) count++;
    if (minRating > 0) count++;
    if (verifiedOnly) count++;
    if (endingSoon) count++;
    if (womenLed) count++;
    return count;
  }, [discountFilter, selectedCategory, areaMode, minDiscount, minRating, verifiedOnly, endingSoon, womenLed]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setDiscountFilter("all");
    setSelectedCategory(undefined);
    setAreaMode("city");
    setMinDiscount(0);
    setMinRating(0);
    setVerifiedOnly(false);
    setEndingSoon(false);
    setWomenLed(false);
  }, []);

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDealClick = useCallback(
    (deal: ProviderWithOffer) => {
      router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${deal.id}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[#efeff4] dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 shadow-sm" style={{ paddingTop: "var(--sat,0px)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700 active:scale-90 transition-transform"
          >
            <IonIcon
              icon={chevronBackOutline}
              className="w-5 h-5 text-slate-700 dark:text-slate-200"
            />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <IonIcon
                icon={pricetagOutline}
                className="text-lg text-rose-500"
              />
              <h1 className="text-[17px] font-bold text-slate-800 dark:text-white">
                Deals & Offers
              </h1>
            </div>
            {total > 0 && (
              <p className="text-[11px] text-slate-400 mt-0.5 ml-7">
                {total} active deal{total !== 1 ? "s" : ""}
                {areaMode === "nearby" ? " nearby" : areaMode === "city" ? ` in ${user?.city || "your city"}` : " everywhere"}
              </p>
            )}
          </div>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-transform ${
              showFilters || activeFilterCount > 0
                ? "bg-rose-50 dark:bg-rose-950/30"
                : "bg-slate-50 dark:bg-slate-700"
            }`}
          >
            <IonIcon
              icon={funnelOutline}
              className={`w-4.5 h-4.5 ${activeFilterCount > 0 ? "text-rose-500" : "text-slate-500 dark:text-slate-300"}`}
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Area Toggle — always visible */}
        <div className="px-4 pb-2">
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-0.5">
            {AREA_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAreaMode(opt.value)}
                className={`flex-1 text-[10px] font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  areaMode === opt.value
                    ? "bg-white dark:bg-slate-600 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <IonIcon
                  icon={opt.value === "nearby" ? navigateOutline : opt.value === "all" ? globeOutline : locationOutline}
                  className="w-3 h-3"
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Pills */}
        <div className="px-4 pb-2.5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  sort === opt.value
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-3 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3.5 bg-slate-50/50 dark:bg-slate-800/50">
            {/* Quick Toggle Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  verifiedOnly
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                }`}
              >
                <IonIcon icon={shieldCheckmarkOutline} className="w-3 h-3" />
                Verified Only
              </button>
              <button
                onClick={() => setEndingSoon(!endingSoon)}
                className={`flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  endingSoon
                    ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                }`}
              >
                <IonIcon icon={flashOutline} className="w-3 h-3" />
                Ending This Week
              </button>
              <button
                onClick={() => setWomenLed(!womenLed)}
                className={`flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  womenLed
                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 ring-1 ring-purple-200 dark:ring-purple-800"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                }`}
              >
                <IonIcon icon={femaleOutline} className="w-3 h-3" />
                Women-Led
              </button>
            </div>

            {/* Discount Type */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Discount Type
              </p>
              <div className="flex gap-2">
                {DISCOUNT_FILTERS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDiscountFilter(opt.value)}
                    className={`text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      discountFilter === opt.value
                        ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800"
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Discount */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Minimum Discount
              </p>
              <div className="flex gap-2">
                {MIN_DISCOUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMinDiscount(opt.value)}
                    className={`text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      minDiscount === opt.value
                        ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800"
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Provider Rating
              </p>
              <div className="flex gap-2">
                {MIN_RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMinRating(opt.value)}
                    className={`flex items-center gap-0.5 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      minRating === opt.value
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                    }`}
                  >
                    {opt.value > 0 && <IonIcon icon={star} className="w-2.5 h-2.5" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {categories && categories.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      !selectedCategory
                        ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800"
                        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                        selectedCategory === cat.id
                          ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800"
                          : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600"
                      }`}
                    >
                      {cat.icon && <span className="mr-0.5">{cat.icon}</span>}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 active:scale-95"
              >
                <IonIcon icon={closeCircle} className="w-3.5 h-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Chips — shown below header when filters are hidden */}
      {!showFilters && activeFilterCount > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          {discountFilter !== "all" && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full">
              {discountFilter === "percentage" ? "% Off" : "₹ Off"}
              <button onClick={() => setDiscountFilter("all")}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-rose-400" />
              </button>
            </span>
          )}
          {minDiscount > 0 && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full">
              {minDiscount}%+ off
              <button onClick={() => setMinDiscount(0)}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-rose-400" />
              </button>
            </span>
          )}
          {minRating > 0 && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full">
              {minRating}★+
              <button onClick={() => setMinRating(0)}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-amber-400" />
              </button>
            </span>
          )}
          {verifiedOnly && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">
              Verified
              <button onClick={() => setVerifiedOnly(false)}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-emerald-400" />
              </button>
            </span>
          )}
          {endingSoon && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full">
              Ending Soon
              <button onClick={() => setEndingSoon(false)}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-orange-400" />
              </button>
            </span>
          )}
          {womenLed && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full">
              Women-Led
              <button onClick={() => setWomenLed(false)}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-purple-400" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full">
              {categories?.find((c) => c.id === selectedCategory)?.name || "Category"}
              <button onClick={() => setSelectedCategory(undefined)}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-rose-400" />
              </button>
            </span>
          )}
          {areaMode !== "city" && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full">
              {AREA_OPTIONS.find((a) => a.value === areaMode)?.label}
              <button onClick={() => setAreaMode("city")}>
                <IonIcon icon={closeCircle} className="w-3 h-3 text-rose-400" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-900/40 animate-pulse"
            >
              <div className="h-[120px] bg-slate-200 dark:bg-slate-700" />
              <div className="p-2.5 space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5" />
                <div className="h-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-full w-3/5" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && deals.length === 0 && (
        <div className="flex flex-col items-center pt-20 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4">
            <IonIcon
              icon={pricetagOutline}
              className="w-8 h-8 text-rose-300"
            />
          </div>
          <p className="text-[15px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            No deals found
          </p>
          <p className="text-[12px] text-slate-400 mb-4">
            {activeFilterCount > 0
              ? "Try adjusting your filters or expanding your area"
              : "Check back soon for exciting offers from local businesses"}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-[12px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-4 py-2 rounded-full active:scale-95 transition-transform"
            >
              Clear Filters
            </button>
          )}
          {areaMode !== "all" && activeFilterCount === 0 && (
            <button
              onClick={() => setAreaMode("all")}
              className="text-[12px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-4 py-2 rounded-full active:scale-95 transition-transform"
            >
              Show All Areas
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && deals.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] font-medium text-slate-400">
            Showing {deals.length} of {total} deal{total !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Deals Grid */}
      {!isLoading && deals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {deals.map((deal) => (
            <DealCard
              key={deal.offerId}
              deal={deal}
              onClick={() => handleDealClick(deal)}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && deals.length > 0 && !isLoading && (
        <div className="text-center py-6">
          <p className="text-[11px] text-slate-400">
            You&apos;ve seen all {total} deal{total !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default DealsPageContent;
