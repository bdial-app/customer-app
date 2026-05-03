"use client";
import { memo } from "react";
import { IonIcon } from "@ionic/react";
import { locationOutline, star, navigateOutline } from "ionicons/icons";
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

interface CitySpotlightProps {
  city: string;
  providers: Provider[];
  isLoading?: boolean;
  viewAllLink?: string;
}

const CitySpotlight = ({ city, providers, isLoading, viewAllLink }: CitySpotlightProps) => {
  const router = useRouter();

  if (!city && !isLoading) return null;

  return (
    <div className="mb-2">
      {/* Header with city badge */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <IonIcon icon={locationOutline} className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
              Popular in {city}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Best rated in your city
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(viewAllLink || ROUTE_PATH.ALL_SERVICES)}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full active:scale-95 transition-transform"
        >
          See All →
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pl-4 pr-4 pb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[200px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-50 dark:border-slate-700 animate-pulse">
              <div className="h-[110px] bg-slate-100 dark:bg-slate-700" />
              <div className="p-2.5 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded-full w-4/5" />
                <div className="h-2.5 bg-slate-50 rounded-full w-3/5" />
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
              className="shrink-0 w-[200px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-50 dark:border-slate-800 active:scale-[0.97] transition-transform"
            >
              <div className="relative h-[110px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                {provider.image ? (
                  <OptimizedImage
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-full"
                    width={200}
                    height={110}
                    priority={idx < 2}
                    preset="card"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <span className="text-3xl font-bold text-blue-200">{provider.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    ✓ Verified
                  </div>
                )}
                {/* City badge */}
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  <IonIcon icon={locationOutline} className="w-2.5 h-2.5 text-blue-500" />
                  {city}
                </div>
              </div>
              <div className="p-2.5">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{provider.name}</h4>
                {provider.service && (
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{provider.service}</p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1.5">
                    {provider.rating ? (
                      <div className="flex items-center gap-0.5 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-md">
                        <IonIcon icon={star} className="w-3 h-3 text-green-600" />
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400">{provider.rating}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">New</span>
                      </div>
                    )}
                    {provider.reviews !== undefined && provider.reviews > 0 && (
                      <span className="text-[10px] text-slate-400">({provider.reviews})</span>
                    )}
                  </div>
                  {provider.distance != null && (
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                      <IonIcon icon={navigateOutline} className="w-2.5 h-2.5" />
                      {provider.distance < 1
                        ? `${Math.round(provider.distance * 1000)}m`
                        : `${provider.distance.toFixed(1)}km`}
                    </span>
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

export default memo(CitySpotlight);
