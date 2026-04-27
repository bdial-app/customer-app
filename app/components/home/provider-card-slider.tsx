"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { star, location, navigateOutline } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

interface Provider {
  id: string | number;
  name: string;
  image: string;
  rating?: number;
  reviews?: number;
  location?: string;
  service?: string;
  verified?: boolean;
  womenLed?: boolean;
  price?: string;
  distance?: number;
}

const ProviderCardSlider = ({
  title,
  subtitle,
  providers,
  viewAllLink,
  accentColor = "#F8CB45",
  isLoading = false,
}: {
  title: string;
  subtitle?: string;
  providers: Provider[];
  viewAllLink?: string;
  accentColor?: string;
  isLoading?: boolean;
}) => {
  const router = useRouter();

  return (
    <div className="mb-2">
      {/* Section Header */}
      <div className="flex items-end justify-between px-4 pt-4 pb-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {viewAllLink && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(viewAllLink)}
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: accentColor, backgroundColor: `${accentColor}15` }}
          >
            See All →
          </motion.button>
        )}
      </div>

      {/* Skeleton Loading State */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[150px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-50 dark:border-slate-700 animate-pulse">
              <div className="h-[120px] bg-slate-100 dark:bg-slate-700" />
              <div className="p-2.5 space-y-2">
                <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full w-4/5" />
                <div className="h-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-full w-3/5" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-slate-100 rounded-md" />
                  <div className="h-3 w-14 bg-slate-50 rounded-full mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
      /* Card Slider */
      <div
        className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {providers.map((provider, idx) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: idx * 0.06 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`)}
            className="shrink-0 w-[150px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-50 dark:border-slate-800"
          >
            {/* Image */}
            <div className="relative h-[120px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
              {provider.image ? (
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-200">{provider.name?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              {/* Verified Badge */}
              {provider.verified && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  ✓ Verified
                </div>
              )}
              {/* Women-Led Badge */}
              {provider.womenLed && (
                <div
                  className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, #F0E6FF, #FFE6F0)", color: "#9B59B6" }}
                >
                  ♀ Women-Led
                </div>
              )}
              {/* Price pill */}
              {provider.price && (
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  ₹{provider.price}
                </div>
              )}
              {/* Distance pill */}
              {provider.distance != null && !provider.price && (
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  <IonIcon icon={navigateOutline} className="w-2.5 h-2.5 text-amber-500" />
                  {provider.distance < 1
                    ? `${Math.round(provider.distance * 1000)}m`
                    : `${provider.distance.toFixed(1)} km`}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2.5">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 leading-tight">
                {provider.name}
              </h4>
              {provider.service && (
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {provider.service}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {provider.rating ? (
                  <div className="flex items-center gap-0.5 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-md">
                    <IonIcon icon={star} className="w-3 h-3 text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                      {provider.rating}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">New</span>
                  </div>
                )}
                {provider.location && (
                  <div className="flex items-center gap-0.5 text-[10px] text-slate-400 truncate">
                    <IonIcon icon={location} className="w-2.5 h-2.5" />
                    <span className="truncate">{provider.location}</span>
                    {provider.distance != null && (
                      <span className="shrink-0 ml-auto text-amber-600 font-semibold">
                        ~{provider.distance < 1
                          ? `${Math.round(provider.distance * 1000)}m`
                          : `${provider.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ProviderCardSlider;
