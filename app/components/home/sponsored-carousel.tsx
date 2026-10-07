"use client";
import { memo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { Crown } from "lucide-react";
import {
  star,
  locationOutline,
  shieldCheckmarkOutline,
  navigateOutline,
  pricetagOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import OptimizedImage from "@/app/components/ui/optimized-image";
import { useTrackAd } from "@/hooks/useExplore";
import type { HomeSponsoredProvider } from "@/services/home.service";
import { distanceLabel } from "@/utils/distance-label";

// A city-level pin shows the town instead of a distance that would be wrong.
const formatDistance = (p: Parameters<typeof distanceLabel>[0]) => distanceLabel(p, true);

const SponsoredCarousel = ({
  providers,
  isLoading = false,
}: {
  providers: HomeSponsoredProvider[];
  isLoading?: boolean;
}) => {
  const router = useRouter();
  const trackAd = useTrackAd();
  const trackedRef = useRef(new Set<string>());
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * Record a view once per listing, when the card is at least half on screen —
   * same 50% threshold the explore feed uses. This writes an ad_event row for
   * the admin analytics chart; the listing's own impression counter is
   * incremented server-side when the feed is built, so nothing is double-counted.
   */
  useEffect(() => {
    const node = listRef.current;
    if (!node || isLoading || providers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const entityId = (entry.target as HTMLElement).dataset.trackId;
          if (!entityId || trackedRef.current.has(entityId)) return;
          trackedRef.current.add(entityId);
          trackAd.mutate({ eventType: "impression", entityType: "sponsored_listing", entityId });
        });
      },
      { threshold: 0.5 },
    );

    node.querySelectorAll("[data-track-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [providers, isLoading, trackAd]);

  /** Bill the click, then navigate. */
  const handleClick = useCallback(
    (provider: HomeSponsoredProvider) => {
      if (provider.sponsoredListingId) {
        trackAd.mutate({
          eventType: "click",
          entityType: "sponsored_listing",
          entityId: provider.sponsoredListingId,
        });
      }
      router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`);
    },
    [trackAd, router],
  );

  if (!isLoading && (!Array.isArray(providers) || providers.length === 0)) return null;

  return (
    <section className="mb-2" aria-label="Featured businesses">
      {/* Section header: these are paid placements, so say so plainly. */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <span className="relative w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30 ring-1 ring-inset ring-white/40">
          <Crown className="w-[18px] h-[18px] text-white" strokeWidth={2.3} fill="currentColor" fillOpacity={0.3} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">Featured Businesses</h2>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Promoted by businesses near you</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden px-4 pb-4">
          {[1, 2].map((i) => (
            <div key={i} className="shrink-0 w-[74%] max-w-[280px] rounded-[20px] overflow-hidden bg-white dark:bg-slate-800 ring-1 ring-amber-200/70 dark:ring-amber-500/20 animate-pulse">
              <div className="h-[140px] bg-slate-200 dark:bg-slate-700" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5" />
                <div className="h-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-2/5" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // The next card peeks in from the edge, so it's clear the row scrolls.
        <div
          ref={listRef}
          className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4 snap-x snap-mandatory scroll-px-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {providers.map((provider, i) => {
            const distance = formatDistance(provider);
            return (
              <button
                type="button"
                key={provider.sponsoredListingId}
                data-track-id={provider.sponsoredListingId}
                onClick={() => handleClick(provider)}
                className="snap-start shrink-0 w-[74%] max-w-[280px] text-left rounded-[20px] p-[1.5px] bg-gradient-to-br from-amber-300 via-amber-200 to-orange-300 dark:from-amber-400/70 dark:via-amber-500/15 dark:to-amber-400/40 shadow-[0_10px_24px_-16px_rgba(217,119,6,0.55)] active:scale-[0.97] transition-transform duration-150"
              >
                <div className="h-full rounded-[18.5px] overflow-hidden bg-white dark:bg-slate-800 flex flex-col">
                  {/* Image */}
                  <div className="relative h-[140px] shrink-0 overflow-hidden bg-gradient-to-br from-amber-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
                    {provider.image ? (
                      <OptimizedImage
                        src={provider.image}
                        alt={provider.name}
                        className="w-full h-full"
                        width={280}
                        height={140}
                        priority={i < 2}
                        preset="card"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-slate-800">
                        <span className="text-5xl font-extrabold text-amber-400/70 dark:text-amber-600/60">
                          {provider.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent" />

                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
                      <span className="inline-flex items-center gap-1 pl-1.5 pr-2 py-[3px] rounded-full bg-slate-950/60 backdrop-blur-md text-amber-300 text-[10.5px] font-bold ring-1 ring-amber-300/40">
                        <Crown className="w-3 h-3" strokeWidth={2.4} fill="currentColor" fillOpacity={0.35} />
                        Featured
                      </span>
                      {provider.verified && (
                        <span className="w-6 h-6 rounded-full bg-white/95 flex items-center justify-center shadow-sm" aria-label="Verified">
                          <IonIcon icon={shieldCheckmarkOutline} className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
                      {distance && (
                        <span className="inline-flex items-center gap-1 bg-white/95 text-slate-700 text-[10.5px] font-semibold px-2 py-[3px] rounded-full shadow-sm">
                          <IonIcon icon={navigateOutline} className="w-3 h-3 text-amber-500" />
                          {distance}
                        </span>
                      )}
                      {provider.hasActiveOffer && (
                        <span className="ml-auto inline-flex items-center gap-1 bg-rose-500 text-white text-[10.5px] font-bold px-2 py-[3px] rounded-full shadow-sm">
                          <IonIcon icon={pricetagOutline} className="w-3 h-3" />
                          Deals
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info: rating and place line up at the bottom of every card */}
                  <div className="flex-1 flex flex-col p-3.5">
                    <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">{provider.name}</h3>
                    {provider.primaryCategory && (
                      <p className="text-[11.5px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-1">{provider.primaryCategory}</p>
                    )}
                    {provider.description && (
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-snug">{provider.description}</p>
                    )}

                    <div className="mt-auto pt-3 flex items-center gap-2 min-w-0">
                      {provider.rating > 0 ? (
                        <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                          <IonIcon icon={star} className="w-3 h-3" />
                          {provider.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                          <IonIcon icon={star} className="w-3 h-3" />
                          New
                        </span>
                      )}
                      {provider.reviewCount > 0 && (
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          {provider.reviewCount} review{provider.reviewCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {provider.location && (
                        <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-slate-400 min-w-0">
                          <IonIcon icon={locationOutline} className="w-3 h-3 shrink-0" />
                          <span className="truncate font-medium">{provider.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default memo(SponsoredCarousel);
