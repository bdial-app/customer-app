"use client";
import { memo } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { pricetagOutline, star, timeOutline } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import OptimizedImage from "@/app/components/ui/optimized-image";
import type { HomeProviderWithOffer } from "@/services/home.service";

const formatOfferLabel = (type: string, value: number) =>
  type === "percentage" ? `${value}% OFF` : `₹${value} OFF`;

const formatTimeLeft = (endsAt: string) => {
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 7) return `Ends ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${mins}m left`;
};

const formatDistance = (d: number) =>
  d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;

const DealsCarousel = ({
  deals,
  isLoading = false,
}: {
  deals: HomeProviderWithOffer[];
  isLoading?: boolean;
}) => {
  const router = useRouter();

  if (!isLoading && (!deals || deals.length === 0)) return null;

  return (
    <div className="mb-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <IonIcon icon={pricetagOutline} className="text-base text-rose-500" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Deals Around You
          </h2>
          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
            Limited Time
          </span>
        </div>
        <button
          onClick={() => router.push(ROUTE_PATH.DEALS)}
          className="text-xs font-semibold px-3 py-1 rounded-full active:scale-95 transition-transform text-rose-500 bg-rose-50 dark:bg-rose-950/30"
        >
          See All →
        </button>
      </div>

      {/* Skeleton Loading */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[170px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-900/40 animate-pulse"
            >
              <div className="h-[100px] bg-slate-200 dark:bg-slate-700" />
              <div className="p-2.5 space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5" />
                <div className="h-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-full w-3/5" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {deals.map((deal, i) => (
            <div
              key={deal.offerId}
              onClick={() =>
                router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${deal.id}`)
              }
              className="shrink-0 w-[170px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-rose-100 dark:border-rose-900/40 active:scale-[0.96] transition-transform"
            >
              {/* Image */}
              <div className="relative h-[100px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                {deal.image ? (
                  <OptimizedImage
                    src={deal.image}
                    alt={deal.name}
                    className="w-full h-full"
                    width={170}
                    height={100}
                    priority={i < 3}
                    preset="card"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-200 dark:text-slate-600">
                      {deal.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Discount Badge */}
                <div className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                  {formatOfferLabel(deal.discountType, deal.discountValue)}
                </div>
                {/* Multiple Offers Badge */}
                {deal.totalOffers > 1 && (
                  <div className="absolute bottom-2 left-2 bg-slate-900/75 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                    +{deal.totalOffers - 1} more offer{deal.totalOffers > 2 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5">
                <h4 className="text-[12px] font-semibold text-slate-800 dark:text-white line-clamp-1">
                  {deal.name}
                </h4>
                <p className="text-[10px] text-rose-600 font-medium mt-0.5 line-clamp-1">
                  {deal.offerTitle}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {deal.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      <IonIcon icon={star} className="w-2.5 h-2.5 text-amber-500" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {deal.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {deal.distance != null && (
                    <span className="text-[9px] text-slate-400">
                      {formatDistance(deal.distance)}
                    </span>
                  )}
                </div>
                {/* End Date */}
                <div className="flex items-center gap-1 mt-1.5">
                  <IonIcon icon={timeOutline} className="w-2.5 h-2.5 text-rose-400" />
                  <span className="text-[9px] font-medium text-rose-500 dark:text-rose-400">
                    {formatTimeLeft(deal.offerEndsAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(DealsCarousel);
