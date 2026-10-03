"use client";
import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { bagHandle, arrowForward, heart, heartOutline, navigate, locationOutline } from "ionicons/icons";
import OptimizedImage from "@/app/components/ui/optimized-image";
import { useCatalogList, useCatalogLocation, useSavedProducts } from "@/hooks/useCatalog";
import { catalogHref, formatPrice, itemDistance, productHref } from "@/app/components/catalog/catalog-utils";

/**
 * "Products around you" — a two-row shop window of small square tiles,
 * nearest first. Denser than the big product cards elsewhere on home.
 */
const ProductsAroundYou = () => {
  const { items, isLoading, isError, hasLocation, area, sort } = useCatalogList("product", "around", 14);
  const { city } = useCatalogLocation();
  const { isSaved, toggle } = useSavedProducts();

  const shown = items.slice(0, 12);

  if (isError || (!isLoading && shown.length < 4)) return null;

  const subtitle = hasLocation ? "Closest first — from shops near you" : city ? `From shops in ${city}` : "From local shops on Tijarah";
  const seeAll = catalogHref("product", { title: "Products around you", filters: { sort, area } });

  return (
    <section data-tour="home-products-around" className="pt-5 pb-4">
      <div className="flex items-end justify-between px-4 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 shrink-0">
            <IonIcon icon={bagHandle} className="text-amber-600 dark:text-amber-400 text-base" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
              Products around you
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>
        <Link href={seeAll} className="shrink-0 flex items-center gap-0.5 text-[12px] font-bold text-amber-600 dark:text-amber-400">
          See all <IonIcon icon={arrowForward} className="text-[11px]" />
        </Link>
      </div>

      <div className="grid grid-rows-2 grid-flow-col auto-cols-[124px] gap-x-2.5 gap-y-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="w-[124px] h-[124px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-2.5 w-4/5 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ))
          : shown.map((item, i) => {
              const price = formatPrice(item.price, item.currency);
              const distance = itemDistance(item);
              const saved = isSaved(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.25 }}
                >
                  <Link href={productHref(item.id, "home_feed")} className="block active:scale-[0.96] transition-transform">
                    <div className="relative w-[124px] h-[124px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-800">
                      {item.photoUrl ? (
                        <OptimizedImage src={item.photoUrl} alt={item.name} className="w-full h-full" width={124} height={124} preset="product" priority={i < 4} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-700 dark:to-slate-800">
                          <span className="text-2xl font-extrabold text-amber-300">{item.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      )}

                      {distance && (
                        <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/55 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                          <IonIcon icon={item.approximateLocation ? locationOutline : navigate} className="text-[8px]" />
                          {distance}
                        </span>
                      )}

                      <button
                        type="button"
                        aria-label={saved ? "Remove from saved" : "Save"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle(item.id);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-900/70 flex items-center justify-center active:scale-75 transition-transform"
                      >
                        <IonIcon icon={saved ? heart : heartOutline} className={`text-[12px] ${saved ? "text-rose-500" : "text-slate-600 dark:text-slate-200"}`} />
                      </button>

                      {/* Price sticker */}
                      <span
                        className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-lg text-[11px] font-extrabold shadow-sm ${
                          price ? "bg-white text-slate-900" : "bg-amber-500 text-white text-[9.5px]"
                        }`}
                      >
                        {price ?? "Ask price"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11.5px] font-semibold text-slate-800 dark:text-white leading-tight line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{item.providerName}</p>
                  </Link>
                </motion.div>
              );
            })}
      </div>
    </section>
  );
};

export default memo(ProductsAroundYou);
