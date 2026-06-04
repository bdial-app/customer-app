"use client";
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { star, sparklesOutline, navigateOutline } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { PersonalizedCategory } from "@/services/home.service";
import OptimizedImage from "@/app/components/ui/optimized-image";

interface PicksProvider {
  id: string | number;
  name: string;
  image: string;
  rating?: number;
  reviews?: number;
  location?: string;
  service?: string;
  verified?: boolean;
  distance?: number;
}

const FALLBACK_REASONS = [
  "Picked just for you",
  "Trending nearby",
  "Highly rated near you",
];

const PicksForYou = ({
  providers,
  personalizedCategories,
  isLoading = false,
}: {
  providers: PicksProvider[];
  personalizedCategories?: PersonalizedCategory[] | null;
  isLoading?: boolean;
}) => {
  const router = useRouter();

  const reasons = useMemo(() => {
    const cats = (personalizedCategories || [])
      .filter((c) => c && c.name)
      .slice(0, 5)
      .map((c) => `Because you love ${c.name}`);
    return cats.length > 0 ? cats : FALLBACK_REASONS;
  }, [personalizedCategories]);

  if (!isLoading && (!providers || providers.length === 0)) return null;

  return (
    <div className="mb-3">
      {/* Header */}
      <div className="flex items-end justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
              boxShadow: "0 4px 12px rgba(139,92,246,0.35)",
            }}
          >
            <IonIcon icon={sparklesOutline} className="text-white text-base" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Picks for you
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Curated from your interests
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`${ROUTE_PATH.ALL_SERVICES}?sort=relevance`)}
          className="text-xs font-semibold px-3 py-1 rounded-full active:scale-95 transition-transform"
          style={{ color: "#8B5CF6", backgroundColor: "rgba(139,92,246,0.10)" }}
        >
          See All →
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[240px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-pulse"
            >
              <div className="h-[160px] bg-slate-200 dark:bg-slate-700" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {providers.map((provider, idx) => {
            const reason = reasons[idx % reasons.length];
            return (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeOut" }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`)
                }
                className="shrink-0 w-[240px] rounded-2xl overflow-hidden cursor-pointer shadow-md shadow-slate-900/[0.08] bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800"
              >
                {/* Image with reason chip overlay */}
                <div className="relative h-[160px] overflow-hidden bg-gradient-to-br from-violet-100 to-pink-50 dark:from-slate-700 dark:to-slate-800">
                  {provider.image ? (
                    <OptimizedImage
                      src={provider.image}
                      alt={provider.name}
                      className="w-full h-full"
                      width={240}
                      height={160}
                      priority={idx < 2}
                      preset="card"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-white/80">
                        {provider.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Bottom scrim for chip legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                  {/* Why we picked this — top floating chip */}
                  <div
                    className="absolute top-2.5 left-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.92), rgba(236,72,153,0.92))",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                  >
                    <IonIcon icon={sparklesOutline} className="text-[11px] shrink-0" />
                    <span className="truncate">{reason}</span>
                  </div>

                  {/* Verified badge */}
                  {provider.verified && (
                    <div className="absolute bottom-2.5 right-2.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      ✓ Verified
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                    {provider.name}
                  </h4>
                  {provider.service && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
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
                      <div className="flex items-center gap-0.5 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded-md">
                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                          New
                        </span>
                      </div>
                    )}
                    {provider.distance != null && (
                      <div className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <IonIcon
                          icon={navigateOutline}
                          className="w-2.5 h-2.5 text-amber-500"
                        />
                        <span>
                          {provider.distance < 1
                            ? `${Math.round(provider.distance * 1000)}m`
                            : `${provider.distance.toFixed(1)} km`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(PicksForYou);
