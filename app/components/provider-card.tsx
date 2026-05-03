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
} from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";

export interface ProviderCardData {
  id: string;
  name: string;
  image: string;
  rating?: number | null;
  reviews?: number;
  location?: string;
  service?: string;
  verified?: boolean;
  womenLed?: boolean;
  featured?: boolean;
  distance?: number | null;
}

interface ProviderCardProps {
  provider: ProviderCardData;
  index?: number;
  variant?: "grid" | "list";
}

const formatDistance = (d: number) =>
  d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`;

const RatingPill = ({ rating, reviews }: { rating?: number | null; reviews?: number }) => {
  if (rating != null && rating > 0) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5 bg-emerald-600 px-1.5 py-[3px] rounded-md">
          <IonIcon icon={star} className="w-2.5 h-2.5 text-white" />
          <span className="text-[10px] font-bold text-white leading-none">{Number(rating).toFixed(1)}</span>
        </div>
        {reviews != null && reviews > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-slate-500">{reviews} {reviews === 1 ? "review" : "reviews"}</span>
        )}
      </div>
    );
  }
  return (
    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-[3px] rounded-md">New</span>
  );
};

const ProviderCard = ({ provider, index = 0, variant = "grid" }: ProviderCardProps) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`);
  };

  // ───────── LIST VARIANT — Swiggy/Zomato-style horizontal card ─────────
  if (variant === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.025, duration: 0.2 }}
        onClick={handleNavigate}
        className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-150 flex ${
          provider.featured
            ? "border border-amber-200 dark:border-amber-700/50 shadow-[0_2px_12px_rgba(245,158,11,0.08)]"
            : "border border-gray-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        }`}
      >
        {/* Image */}
        <div className="relative w-[110px] shrink-0 overflow-hidden bg-gray-100 dark:bg-slate-800">
          {provider.image ? (
            <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700">
              <span className="text-2xl font-bold text-amber-200 dark:text-slate-600">{provider.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          {/* Sponsored ribbon */}
          {provider.featured && (
            <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-bold px-2 py-[2px] rounded-br-lg">
              AD
            </div>
          )}
          {/* Distance pill */}
          {provider.distance != null && (
            <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-[2px] rounded-md flex items-center gap-0.5">
              <IonIcon icon={navigateOutline} className="w-2.5 h-2.5" />
              {formatDistance(provider.distance)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 min-w-0 flex flex-col">
          {/* Row 1: Name + badges */}
          <div className="flex items-start gap-1.5">
            <h4 className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug line-clamp-1 flex-1">{provider.name}</h4>
            <div className="flex items-center gap-1 shrink-0">
              {provider.verified && (
                <IonIcon icon={shieldCheckmarkOutline} className="w-3.5 h-3.5 text-emerald-500" />
              )}
              {provider.womenLed && (
                <span className="flex items-center gap-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-[8px] font-bold px-1.5 py-[2px] rounded-md">
                  <IonIcon icon={ribbonOutline} className="w-2.5 h-2.5" />
                  <span>Women-Led</span>
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Service category */}
          {provider.service && (
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{provider.service}</p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Row 3: Rating + reviews */}
          <div className="mt-auto">
            <RatingPill rating={provider.rating} reviews={provider.reviews} />
          </div>

          {/* Row 4: Location */}
          {provider.location && (
            <div className="flex items-center gap-0.5 mt-1 text-[10px] text-gray-400 dark:text-slate-500 min-w-0">
              <IonIcon icon={locationOutline} className="w-3 h-3 shrink-0" />
              <span className="truncate">{provider.location}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ───────── GRID VARIANT — Blinkit-style compact card ─────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2 }}
      onClick={handleNavigate}
      className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform duration-150 ${
        provider.featured
          ? "border border-amber-200 dark:border-amber-700/50 shadow-[0_2px_12px_rgba(245,158,11,0.08)]"
          : "border border-gray-100 dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
      }`}
    >
      {/* Image */}
      <div className="relative h-[130px] overflow-hidden bg-gray-100 dark:bg-slate-800">
        {provider.image ? (
          <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700">
            <span className="text-3xl font-bold text-amber-200 dark:text-slate-600">{provider.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Top-left: Sponsored or Verified badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {provider.featured && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-bold px-2 py-[2px] rounded-md shadow-sm">
              Sponsored
            </div>
          )}
          {provider.verified && !provider.featured && (
            <div className="bg-white/95 backdrop-blur-sm text-emerald-600 text-[8px] font-bold px-1.5 py-[2px] rounded-md flex items-center gap-0.5 shadow-sm">
              <IonIcon icon={shieldCheckmarkOutline} className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        {/* Top-right: Women-Led */}
        {provider.womenLed && (
          <div className="absolute top-2 right-2 bg-purple-600/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-[2px] rounded-md flex items-center gap-0.5 shadow-sm">
            <IonIcon icon={ribbonOutline} className="w-2.5 h-2.5" />
            <span>♀</span>
          </div>
        )}

        {/* Bottom: Distance pill */}
        {provider.distance != null && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-[2px] rounded-md flex items-center gap-0.5">
            <IonIcon icon={navigateOutline} className="w-2.5 h-2.5" />
            {formatDistance(provider.distance)}
          </div>
        )}

        {/* Bottom-right: Rating on image */}
        {provider.rating != null && provider.rating > 0 && (
          <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-[2px] rounded-md flex items-center gap-0.5 shadow-sm">
            <IonIcon icon={star} className="w-2.5 h-2.5" />
            {Number(provider.rating).toFixed(1)}
          </div>
        )}
      </div>

      {/* Info — compact */}
      <div className="px-2.5 py-2">
        <h4 className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{provider.name}</h4>
        {provider.service && (
          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{provider.service}</p>
        )}
        {provider.location && (
          <div className="flex items-center gap-0.5 mt-1 text-[9px] text-gray-400 dark:text-slate-500">
            <IonIcon icon={locationOutline} className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{provider.location}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProviderCard;
