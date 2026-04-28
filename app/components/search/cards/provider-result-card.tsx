"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  star,
  locationOutline,
  shieldCheckmarkOutline,
  navigateOutline,
  ribbonOutline,
  diamondOutline,
} from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import { useTrackAd } from "@/hooks/useExplore";
import type { ProviderSearchResult } from "@/services/search.service";

interface Props {
  provider: ProviderSearchResult;
  index: number;
}

const ProviderResultCard = ({ provider, index }: Props) => {
  const router = useRouter();
  const trackAd = useTrackAd();

  const image =
    provider.profilePhotoUrl || provider.bannerImageUrl || "";

  const handleClick = () => {
    if (provider.isSponsored && provider.sponsoredListingId) {
      trackAd.mutate({
        eventType: "click",
        entityType: "sponsored_listing",
        entityId: provider.sponsoredListingId,
      });
    }
    router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={handleClick}
      className={`cursor-pointer bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.97] transition-transform duration-150 ${
        provider.isSponsored
          ? "border-2 border-amber-200 shadow-[0_2px_12px_rgba(245,158,11,0.08)]"
          : "border border-gray-100"
      }`}
    >
      {/* Image */}
      <div className="relative h-[140px] overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={provider.brandName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <span className="text-3xl opacity-20">🏪</span>
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {/* Sponsored badge */}
          {provider.isSponsored && (
            <div className="bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 shadow-sm">
              <IonIcon icon={diamondOutline} className="w-3 h-3" />
              Ad
            </div>
          )}

          {/* Verified badge */}
          {!provider.isSponsored && provider.status === "active" && (
            <div className="bg-white/95 backdrop-blur-sm text-emerald-600 text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <IonIcon icon={shieldCheckmarkOutline} className="w-3 h-3" />
              Verified
            </div>
          )}

          {/* Women-led badge */}
          {provider.isWomenLed && (
            <div className="bg-white/95 backdrop-blur-sm text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm text-purple-600">
              <IonIcon icon={ribbonOutline} className="w-3 h-3" />
              Women-Led
            </div>
          )}
        </div>

        {/* Bottom badges row */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          {/* Distance */}
          {provider.distance != null && (
            <div className="bg-white/95 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <IonIcon icon={navigateOutline} className="w-3 h-3 text-amber-500" />
              {provider.distance < 1
                ? `${Math.round(provider.distance * 1000)}m`
                : `${provider.distance.toFixed(1)} km`}
            </div>
          )}

          {/* Featured */}
          {provider.isFeatured && (
            <div className="bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-sm">
              Featured
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-1">
          {provider.brandName}
        </h4>

        {provider.categories && (
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 font-medium">
            {provider.categories}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-2">
          {provider.avgRating != null && provider.avgRating > 0 ? (
            <div className="flex items-center gap-1 bg-emerald-600 px-2 py-0.5 rounded-md">
              <IonIcon icon={star} className="w-2.5 h-2.5 text-white" />
              <span className="text-[10px] font-bold text-white">
                {provider.avgRating.toFixed(1)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
              <IonIcon icon={star} className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-[10px] font-medium text-gray-400">New</span>
            </div>
          )}
          {provider.reviewCount > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">
              {provider.reviewCount} review{provider.reviewCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {(provider.area || provider.city) && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <IonIcon icon={locationOutline} className="w-3 h-3 flex-shrink-0" />
            <span className="truncate font-medium">
              {[provider.area, provider.city].filter(Boolean).join(", ")}
            </span>
            {provider.distance != null && (
              <span className="ml-auto flex-shrink-0 text-amber-600 font-semibold">
                ~{provider.distance < 1
                  ? `${Math.round(provider.distance * 1000)}m`
                  : `${provider.distance.toFixed(1)} km`}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProviderResultCard;
