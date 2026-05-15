"use client";
import { memo } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  sparklesOutline,
  star,
  locationOutline,
  shieldCheckmarkOutline,
  navigateOutline,
  pricetagOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import OptimizedImage from "@/app/components/ui/optimized-image";
import type { HomeSponsoredProvider } from "@/services/home.service";

const formatDistance = (d: number) =>
  d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;

const SponsoredCarousel = ({
  providers,
  isLoading = false,
}: {
  providers: HomeSponsoredProvider[];
  isLoading?: boolean;
}) => {
  const router = useRouter();

  if (!isLoading && (!providers || providers.length === 0)) return null;

  return (
    <div className="mb-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <IonIcon icon={sparklesOutline} className="w-3 h-3 text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Featured Businesses
          </h2>
        </div>
      </div>

      {/* Skeleton Loading */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[220px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-amber-100 dark:border-amber-900/40 animate-pulse"
            >
              <div className="h-[130px] bg-slate-200 dark:bg-slate-700" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5" />
                <div className="h-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-3/5" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
        {/* Scroll hint gradient */}
        <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none rounded-r-2xl" />
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {providers.map((provider, i) => (
            <div
              key={provider.sponsoredListingId}
              onClick={() =>
                router.push(
                  `${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`
                )
              }
              className="shrink-0 w-[220px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.96] transition-transform duration-150 shadow-[0_2px_12px_rgba(245,158,11,0.08)] border border-amber-100/60 dark:border-amber-900/30"
            >
              {/* Image */}
              <div className="relative h-[130px] overflow-hidden bg-gradient-to-br from-amber-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
                {provider.image ? (
                  <OptimizedImage
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-full"
                    width={220}
                    height={130}
                    priority={i < 3}
                    preset="card"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/30 dark:to-slate-800">
                    <span className="text-4xl font-bold text-amber-300/60 dark:text-amber-700/60">
                      {provider.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Gradient overlay for readability */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                  {/* Featured badge — glass style */}
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
                    <IonIcon icon={sparklesOutline} className="w-2.5 h-2.5" />
                    Featured
                  </div>

                  {/* Verified badge */}
                  {provider.verified && (
                    <div className="bg-white/95 backdrop-blur-sm text-emerald-600 text-[9px] font-bold px-1.5 py-1 rounded-lg flex items-center gap-0.5 shadow-sm">
                      <IonIcon icon={shieldCheckmarkOutline} className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Bottom badges */}
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                  {/* Distance pill */}
                  {provider.distance != null && (
                    <div className="bg-white/95 backdrop-blur-sm text-slate-700 dark:text-slate-800 text-[9px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                      <IonIcon icon={navigateOutline} className="w-2.5 h-2.5 text-amber-500" />
                      {formatDistance(provider.distance)}
                    </div>
                  )}

                  {/* Has Active Deals badge */}
                  {provider.hasActiveOffer && (
                    <div className="bg-rose-500/95 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                      <IonIcon icon={pricetagOutline} className="w-2.5 h-2.5" />
                      Deals
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">
                  {provider.name}
                </h4>

                {/* Category */}
                {provider.primaryCategory && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 line-clamp-1">
                    {provider.primaryCategory}
                  </p>
                )}

                {/* Description snippet */}
                {provider.description && (
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {provider.description}
                  </p>
                )}

                {/* Rating + Reviews */}
                <div className="flex items-center gap-1.5 mt-2">
                  {provider.rating > 0 ? (
                    <div className="flex items-center gap-0.5 bg-emerald-600 px-1.5 py-0.5 rounded-md">
                      <IonIcon icon={star} className="w-2.5 h-2.5 text-white" />
                      <span className="text-[10px] font-bold text-white">
                        {provider.rating.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                      <IonIcon icon={star} className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[10px] font-medium text-slate-400">New</span>
                    </div>
                  )}
                  {provider.reviewCount > 0 && (
                    <span className="text-[9px] text-slate-400 font-medium">
                      {provider.reviewCount} review{provider.reviewCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Location row */}
                {provider.location && (
                  <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-400">
                    <IonIcon icon={locationOutline} className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate font-medium">{provider.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
};

export default memo(SponsoredCarousel);
