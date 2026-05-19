"use client";
import { memo } from "react";
import { IonIcon } from "@ionic/react";
import { sparklesOutline, star, navigateOutline } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import OptimizedImage from "@/app/components/ui/optimized-image";

interface Provider {
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

const RecentlyAdded = ({
  providers,
  isLoading = false,
  viewAllLink,
}: {
  providers: Provider[];
  isLoading?: boolean;
  viewAllLink?: string;
}) => {
  const router = useRouter();

  if (providers.length === 0 && !isLoading) return null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
              Recently Added
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              New providers this month
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(viewAllLink || ROUTE_PATH.ALL_SERVICES)}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full active:scale-95 transition-transform"
        >
          See All →
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[150px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-50 dark:border-slate-700 animate-pulse">
              <div className="h-[120px] bg-slate-100 dark:bg-slate-700" />
              <div className="p-2.5 space-y-2">
                <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full w-4/5" />
                <div className="h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3">
          {providers.map((provider, idx) => (
            <div
              key={provider.id}
              onClick={() => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`)}
              className="shrink-0 w-[150px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-50 dark:border-slate-800 active:scale-[0.97] transition-transform"
            >
              <div className="relative h-[120px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                {provider.image ? (
                  <OptimizedImage
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-full"
                    width={150}
                    height={120}
                    preset="card"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <span className="text-3xl font-bold text-emerald-200">{provider.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
                {/* "New" badge */}
                <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                New
                </div>
                {provider.distance != null && (
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    <IonIcon icon={navigateOutline} className="w-2.5 h-2.5 text-amber-500" />
                    {provider.distance < 1
                      ? `${Math.round(provider.distance * 1000)}m`
                      : `${provider.distance.toFixed(1)} km`}
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{provider.name}</h4>
                {provider.service && (
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{provider.service}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {provider.rating ? (
                    <div className="flex items-center gap-0.5 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-md">
                      <IonIcon icon={star} className="w-3 h-3 text-green-600" />
                      <span className="text-[10px] font-bold text-green-700 dark:text-green-400">{provider.rating}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Just joined</span>
                    </div>
                  )}
                  {provider.reviews !== undefined && provider.reviews > 0 && (
                    <span className="text-[10px] text-slate-400">({provider.reviews})</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(RecentlyAdded);
