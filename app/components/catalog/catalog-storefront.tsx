"use client";
import { memo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  searchOutline,
  arrowForwardOutline,
  sparkles,
  flame,
  navigate,
  ribbon,
  pricetag,
  star,
  rocket,
  bagHandle,
  chatbubblesOutline,
  shieldCheckmarkOutline,
  starOutline,
  storefrontOutline,
} from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import CategoryIcon from "@/app/components/ui/category-icon";
import type { CatalogShelf, CatalogType, CatalogCategoryChip } from "@/services/catalog.service";
import { useCatalogLocation, useCatalogShelves } from "@/hooks/useCatalog";
import ProductCard, { ProductCardSkeleton } from "./product-card";
import { ServiceRailCard, ServiceRailSkeleton } from "./service-card";
import CatalogResults, { useCatalogCardActions } from "./catalog-results";
import { catalogHref, typeNoun, type CatalogFilters } from "./catalog-utils";

const SHELF_STYLE: Record<string, { icon: string; color: string }> = {
  for_you: { icon: sparkles, color: "text-violet-500" },
  trending: { icon: flame, color: "text-rose-500" },
  near_you: { icon: navigate, color: "text-sky-500" },
  featured: { icon: ribbon, color: "text-violet-500" },
  budget: { icon: pricetag, color: "text-emerald-500" },
  top_rated: { icon: star, color: "text-amber-500" },
  new_sellers: { icon: rocket, color: "text-indigo-500" },
};

/* ── One horizontal shelf ── */
function Shelf({
  shelf,
  type,
  actions,
  first,
}: {
  shelf: CatalogShelf;
  type: CatalogType;
  actions: ReturnType<typeof useCatalogCardActions>;
  /** The top shelf, which the tour points at (which shelves show varies per person). */
  first?: boolean;
}) {
  const style = SHELF_STYLE[shelf.key] ?? { icon: sparkles, color: "text-amber-500" };
  const isForYou = shelf.key === "for_you";

  return (
    <section
      data-tour={first ? "store-first-shelf" : `store-shelf-${shelf.key}`}
      className={`mt-6 ${isForYou ? "mx-4 rounded-3xl bg-gradient-to-br from-violet-50 via-fuchsia-50/60 to-amber-50 dark:from-violet-950/40 dark:via-slate-900 dark:to-slate-900 border border-violet-100/80 dark:border-violet-900/40 py-3.5" : ""}`}
      style={isForYou ? undefined : { contentVisibility: "auto", containIntrinsicSize: "auto 280px" }}
    >
      <div className={`flex items-end justify-between gap-3 mb-2.5 ${isForYou ? "px-3.5" : "px-4"}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <IonIcon icon={style.icon} className={`text-[15px] ${style.color}`} />
            <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight">{shelf.title}</h2>
          </div>
          {shelf.subtitle && <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{shelf.subtitle}</p>}
        </div>
        {shelf.seeAll && (
          <Link
            href={catalogHref(type, { title: shelf.title, filters: shelf.seeAll })}
            className="shrink-0 flex items-center gap-0.5 text-[12px] font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
          >
            See all <IonIcon icon={arrowForwardOutline} className="text-[11px]" />
          </Link>
        )}
      </div>
      <div className={`flex gap-3 overflow-x-auto no-scrollbar pb-1 ${isForYou ? "px-3.5" : "px-4"}`}>
        {shelf.items.map((item, i) =>
          type === "service" ? (
            <ServiceRailCard
              key={item.id}
              item={item}
              priority={i < 2}
              isSaved={actions.isSaved(item.id)}
              onToggleSave={actions.toggle}
              onEnquire={actions.enquire}
              enquiring={actions.isEnquiring(item)}
              isOwn={actions.isOwn(item)}
            />
          ) : (
            <ProductCard
              key={item.id}
              item={item}
              variant="rail"
              priority={i < 3}
              showTrending={shelf.key === "trending"}
              isSaved={actions.isSaved(item.id)}
              onToggleSave={actions.toggle}
            />
          ),
        )}
      </div>
    </section>
  );
}

/* ── "Shop by category" tiles ── */
function CategoryTiles({ categories, type }: { categories: CatalogCategoryChip[]; type: CatalogType }) {
  if (categories.length === 0) return null;
  return (
    <section className="mt-5" data-tour="store-categories">
      <h2 className="px-4 mb-2.5 text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight">
        {type === "service" ? "Browse by category" : "Shop by category"}
      </h2>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
        {categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
            <Link
              href={catalogHref(type, { title: cat.name, filters: { categoryId: cat.id } })}
              className="shrink-0 w-[84px] flex flex-col items-center text-center active:scale-95 transition-transform"
            >
              <CategoryIcon icon={cat.icon} iconColor={cat.iconColor} name={cat.name} size="lg" />
              <span className="mt-1.5 text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">{cat.name}</span>
              <span className="text-[9.5px] text-slate-400">{cat.itemCount}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Intro card: what this storefront holds and where ── */
function IntroCard({ type, total, where }: { type: CatalogType; total: number; where: string }) {
  const isService = type === "service";
  const points = isService
    ? [
        { icon: chatbubblesOutline, label: "Chat with the pro" },
        { icon: shieldCheckmarkOutline, label: "Verified badges" },
        { icon: starOutline, label: "Real reviews" },
      ]
    : [
        { icon: storefrontOutline, label: "Local shops" },
        { icon: chatbubblesOutline, label: "Ask the seller" },
        { icon: shieldCheckmarkOutline, label: "Verified badges" },
      ];

  return (
    <div
      data-tour="store-intro"
      className={`mx-4 mt-3 rounded-3xl p-4 relative overflow-hidden ${
        isService ? "bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500" : "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500"
      }`}
    >
      <div className="absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute right-8 -bottom-10 w-24 h-24 rounded-full bg-white/10" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">{isService ? "Services" : "Shop local"}</p>
        <h2 className="mt-1 text-[19px] font-extrabold text-white leading-tight">
          {total > 0 ? `${total} ${typeNoun(type, total !== 1)} ${where}` : isService ? "Services from local pros" : "Products from local shops"}
        </h2>
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {points.map((p) => (
            <span key={p.label} className="flex items-center gap-1 text-[10.5px] font-semibold text-white bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full">
              <IonIcon icon={p.icon} className="text-[11px]" />
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const ShelvesSkeleton = ({ type }: { type: CatalogType }) => (
  <div className="mt-6 space-y-6">
    {[0, 1].map((s) => (
      <div key={s}>
        <div className="px-4 mb-3 space-y-1.5">
          <div className="h-4 w-32 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-3 w-48 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4">
          {Array.from({ length: 3 }).map((_, i) => (type === "service" ? <ServiceRailSkeleton key={i} /> : <ProductCardSkeleton key={i} variant="rail" />))}
        </div>
      </div>
    ))}
  </div>
);

/* ── Storefront ── */
const CatalogStorefront = memo(function CatalogStorefront({ type }: { type: CatalogType }) {
  const router = useRouter();
  const location = useCatalogLocation();
  const { data, isLoading, isError } = useCatalogShelves(type);
  const actions = useCatalogCardActions();

  // The grid starts in the same area the storefront settled on; the
  // customer's own filter choices replace it from then on.
  const [filters, setFilters] = useState<CatalogFilters | null>(null);
  const scopeArea: CatalogFilters["area"] = data?.scope === "all" || !data ? "all" : "city";
  const gridFilters: CatalogFilters = filters ?? { sort: "recommended", area: scopeArea };

  const where =
    data?.scope === "nearby" ? "near you" : data?.scope === "city" && location.city ? `in ${location.city}` : "on Tijarah";

  return (
    <div className="flex flex-col pb-24">
      {/* Search */}
      <div className="px-4 pt-2">
        <button
          data-tour="store-search"
          onClick={() => router.push(ROUTE_PATH.SEARCH)}
          className="w-full flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-3 shadow-sm active:scale-[0.98] transition-transform text-left"
        >
          <IonIcon icon={searchOutline} className="text-base text-slate-400 shrink-0" />
          <span className="flex-1 text-sm text-slate-400">
            {type === "service" ? "Search services — tailoring, AC repair…" : "Search products — ridas, sweets, gifts…"}
          </span>
        </button>
      </div>

      {isLoading ? (
        <>
          <div className="mx-4 mt-3 h-[122px] rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="flex gap-2.5 overflow-hidden px-4 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[84px] flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-2.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
          <ShelvesSkeleton type={type} />
        </>
      ) : (
        <>
          {!isError && <IntroCard type={type} total={data?.totalItems ?? 0} where={where} />}
          {data && <CategoryTiles categories={data.categories} type={type} />}
          {data?.shelves.map((shelf, i) => (
            <Shelf key={shelf.key} shelf={shelf} type={type} actions={actions} first={i === 0} />
          ))}

          <div className="mt-8 border-t-8 border-slate-50 dark:border-slate-950/60" />
          <CatalogResults
            type={type}
            filters={gridFilters}
            onFiltersChange={setFilters}
            heading={
              <div className="px-4 pt-5 flex items-center gap-2">
                <IonIcon icon={type === "service" ? chatbubblesOutline : bagHandle} className={`text-[16px] ${type === "service" ? "text-indigo-500" : "text-amber-500"}`} />
                <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                  All {typeNoun(type)}
                </h2>
              </div>
            }
          />
        </>
      )}
    </div>
  );
});

export default CatalogStorefront;
