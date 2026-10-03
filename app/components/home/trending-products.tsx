"use client";
import { memo, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { flame, eyeOutline, arrowForward, checkmarkCircle } from "ionicons/icons";
import OptimizedImage from "@/app/components/ui/optimized-image";
import { useCatalogList } from "@/hooks/useCatalog";
import { catalogHref, formatPrice, productHref } from "@/app/components/catalog/catalog-utils";
import type { CatalogItem } from "@/services/catalog.service";

const PER_COLUMN = 3;
const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-orange-700/70"];

/**
 * "Trending products" — a top chart: numbered rows in swipeable columns of
 * three, ranked by views over the last two weeks.
 */
const TrendingProducts = () => {
  const { items, isLoading, isError, area } = useCatalogList("product", "popular", 12);

  // Only items people actually viewed count as trending.
  const ranked = useMemo(() => items.filter((i) => i.views > 0).slice(0, 9), [items]);

  if (isError || (!isLoading && ranked.length < 3)) return null;

  const columns: CatalogItem[][] = [];
  for (let i = 0; i < ranked.length; i += PER_COLUMN) columns.push(ranked.slice(i, i + PER_COLUMN));

  return (
    <section data-tour="home-trending-products" className="pt-5 pb-4">
      <div className="flex items-end justify-between px-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-500 to-orange-400 shadow-md shadow-rose-200 dark:shadow-none">
            <IonIcon icon={flame} className="text-white text-base" />
          </div>
          <div>
            <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">Trending products</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Most viewed in the last two weeks</p>
          </div>
        </div>
        <Link
          href={catalogHref("product", { title: "Trending products", filters: { sort: "popular", area } })}
          className="shrink-0 flex items-center gap-0.5 text-[12px] font-bold text-rose-600 dark:text-rose-400"
        >
          Top list <IonIcon icon={arrowForward} className="text-[11px]" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-1 scroll-px-4">
        {isLoading
          ? [0, 1].map((c) => (
              <div key={c} className="shrink-0 w-[84%] space-y-3">
                {Array.from({ length: PER_COLUMN }).map((_, r) => (
                  <div key={r} className="flex items-center gap-3">
                    <div className="w-6 h-7 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      <div className="h-2.5 w-1/3 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ))
          : columns.map((col, c) => (
              <div key={c} className="shrink-0 w-[84%] snap-start divide-y divide-slate-100 dark:divide-slate-800">
                {col.map((item, r) => {
                  const rank = c * PER_COLUMN + r + 1;
                  const price = formatPrice(item.price, item.currency);
                  return (
                    <Link
                      key={item.id}
                      href={productHref(item.id, "home_feed")}
                      className="flex items-center gap-3 py-2 active:opacity-70"
                    >
                      <span className={`w-6 text-center text-[26px] font-black italic leading-none tabular-nums ${RANK_COLORS[rank - 1] ?? "text-slate-300 dark:text-slate-600"}`}>
                        {rank}
                      </span>
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        {item.photoUrl ? (
                          <OptimizedImage src={item.photoUrl} alt={item.name} className="w-full h-full" width={64} height={64} preset="avatar" priority={rank <= 3} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-300">
                            {item.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight line-clamp-1">{item.name}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
                          <span className="truncate">{item.providerName}</span>
                          {item.verified && <IonIcon icon={checkmarkCircle} className="text-[11px] text-emerald-500 shrink-0" />}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-[12.5px] font-extrabold ${price ? "text-slate-900 dark:text-white" : "text-amber-600 text-[11px]"}`}>
                            {price ?? "Ask for price"}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-500">
                            <IonIcon icon={eyeOutline} className="text-[11px]" />
                            {item.views} {item.views === 1 ? "view" : "views"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
      </div>
    </section>
  );
};

export default memo(TrendingProducts);
