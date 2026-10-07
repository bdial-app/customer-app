"use client";
import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { construct, chatbubbleEllipses, star, checkmarkCircle, chevronForward, constructOutline } from "ionicons/icons";
import OptimizedImage from "@/app/components/ui/optimized-image";
import { useCatalogList, useCatalogLocation } from "@/hooks/useCatalog";
import { useCatalogCardActions } from "@/app/components/catalog/catalog-results";
import { catalogHref, formatPrice, itemDistance, productHref } from "@/app/components/catalog/catalog-utils";

const ROWS = 4;

/**
 * "Services around you" — a compact widget: the nearest few services as
 * rows, each with a one-tap chat, and a footer into the full list.
 */
const ServicesAroundYou = () => {
  const { items, total, isLoading, isError, hasLocation, area, sort } = useCatalogList("service", "around", ROWS);
  const { city } = useCatalogLocation();
  const actions = useCatalogCardActions();

  if (isError || (!isLoading && items.length < 2)) return null;

  const subtitle = hasLocation ? "Local pros, closest first" : city ? `Local pros in ${city}` : "Local pros on Tijarah";
  const seeAll = catalogHref("service", { title: "Services around you", filters: { sort, area } });

  return (
    <section className="px-4 pt-5 pb-4">
      <div data-tour="home-services-around" className="rounded-3xl overflow-hidden border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #0EA5E9)", boxShadow: "0 4px 14px rgba(79,70,229,0.28)" }}
          >
            <IonIcon icon={construct} className="text-white text-base" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">Services around you</h2>
            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Rows */}
        <div className="mx-3 rounded-2xl bg-white/90 dark:bg-slate-800/80 divide-y divide-slate-100 dark:divide-slate-700/70 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          {isLoading
            ? Array.from({ length: ROWS }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-[52px] h-[52px] rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <div className="h-2.5 w-2/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  </div>
                </div>
              ))
            : items.map((item, i) => {
                const price = formatPrice(item.price, item.currency);
                const distance = itemDistance(item, false);
                const own = actions.isOwn(item);
                const opening = actions.isEnquiring(item);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <Link href={productHref(item.id, "home_feed")} className="flex items-center gap-3 p-3 active:bg-slate-50 dark:active:bg-slate-700/50">
                      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-indigo-50 dark:bg-slate-700 shrink-0">
                        {item.photoUrl ? (
                          <OptimizedImage src={item.photoUrl} alt={item.name} className="w-full h-full" width={52} height={52} preset="thumbnail" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IonIcon icon={constructOutline} className="text-xl text-indigo-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight truncate">{item.name}</p>
                        <div className="mt-0.5 flex items-center gap-1 min-w-0 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate">{item.providerName}</span>
                          {item.verified && <IonIcon icon={checkmarkCircle} className="text-[11px] text-emerald-500 shrink-0" />}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px]">
                          {item.rating > 0 && (
                            <span className="flex items-center gap-0.5 font-bold text-slate-700 dark:text-slate-200">
                              <IonIcon icon={star} className="text-[9px] text-amber-500" />
                              {item.rating.toFixed(1)}
                            </span>
                          )}
                          {distance && <span className="text-indigo-600 dark:text-indigo-300 font-semibold truncate">{distance}</span>}
                          {(item.rating > 0 || distance) && <span className="text-slate-300 dark:text-slate-600">·</span>}
                          <span className={`font-semibold ${price ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
                            {price ? `from ${price}` : "Quote on request"}
                          </span>
                        </div>
                      </div>

                      {!own && (
                        <button
                          type="button"
                          aria-label={`Chat about ${item.name}`}
                          disabled={opening}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            actions.enquire(item);
                          }}
                          className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none active:scale-90 transition-transform disabled:opacity-60"
                        >
                          {opening ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <IonIcon icon={chatbubbleEllipses} className="text-[17px]" />
                          )}
                        </button>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
        </div>

        {/* Footer */}
        <Link
          href={seeAll}
          className="flex items-center justify-between px-4 py-3 text-[12.5px] font-bold text-indigo-700 dark:text-indigo-300 active:opacity-70"
        >
          <span>{total > ROWS ? `See all ${total} services` : "Browse all services"}</span>
          <IonIcon icon={chevronForward} className="text-[14px]" />
        </Link>
      </div>
    </section>
  );
};

export default memo(ServicesAroundYou);
