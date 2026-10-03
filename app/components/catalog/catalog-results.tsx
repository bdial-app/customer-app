"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { optionsOutline, refreshOutline, searchOutline } from "ionicons/icons";
import type { CatalogItem, CatalogType } from "@/services/catalog.service";
import { useCatalogBrowse, useCatalogLocation, useSavedProducts } from "@/hooks/useCatalog";
import { useProductEnquiry } from "@/hooks/useProductEnquiry";
import { useAppSelector } from "@/hooks/useAppStore";
import ProductCard, { ProductCardSkeleton } from "./product-card";
import { ServiceListCard, ServiceListSkeleton } from "./service-card";
import CatalogFilterSheet from "./catalog-filter-sheet";
import { activeFilterCount, DEFAULT_FILTERS, SORT_OPTIONS, typeNoun, type CatalogFilters } from "./catalog-utils";

/** Saved hearts and one-tap enquiry, shared by every catalog card. */
export const useCatalogCardActions = () => {
  const { isSaved, toggle } = useSavedProducts();
  const { enquire, pendingProductId } = useProductEnquiry();
  const userId = useAppSelector((state) => state.auth.user?.id);

  return useMemo(
    () => ({
      isSaved,
      toggle,
      isOwn: (item: CatalogItem) => !!userId && item.providerUserId === userId,
      isEnquiring: (item: CatalogItem) => pendingProductId === item.id,
      enquire: (item: CatalogItem) =>
        enquire({
          providerId: item.providerId,
          providerUserId: item.providerUserId,
          productId: item.id,
          productName: item.name,
          productType: item.productType,
          photoUrl: item.photoUrl,
          price: item.price,
          currency: item.currency,
        }),
    }),
    [isSaved, toggle, userId, pendingProductId, enquire],
  );
};

// Short labels for the chip row; the sheet shows the full ones.
const QUICK_SORTS: { value: NonNullable<CatalogFilters["sort"]>; label: string; needsLocation?: boolean }[] = [
  { value: "recommended", label: "For you" },
  { value: "popular", label: "Popular" },
  { value: "nearest", label: "Nearest", needsLocation: true },
  { value: "price_low", label: "Price ↑" },
  { value: "price_high", label: "Price ↓" },
];

interface Props {
  type: CatalogType;
  filters: CatalogFilters;
  onFiltersChange: (next: CatalogFilters) => void;
  /** Rendered above the toolbar (e.g. a section title on the storefront). */
  heading?: ReactNode;
  /** Classes for the toolbar wrapper, e.g. to make it sticky on the full page. */
  toolbarClassName?: string;
  toolbarStyle?: CSSProperties;
}

export default function CatalogResults({ type, filters, onFiltersChange, heading, toolbarClassName = "", toolbarStyle }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useCatalogLocation();
  const hasLocation = location.lat != null && location.lng != null;
  const accent = type === "service" ? "indigo" : "amber";

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useCatalogBrowse({
    type,
    ...filters,
  });
  const items = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;
  const actions = useCatalogCardActions();

  // Load the next page a little before the end comes into view.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filterCount = activeFilterCount(filters);
  const sort = filters.sort ?? "recommended";
  const sortIsQuick = QUICK_SORTS.some((s) => s.value === sort);
  const chipOn = accent === "amber" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-indigo-600 text-white";

  return (
    <div>
      {heading}

      <div className={toolbarClassName} style={toolbarStyle} data-tour="store-toolbar">
        <div className="flex items-center gap-2 px-4 py-2">
          <button
            onClick={() => setSheetOpen(true)}
            className={`relative shrink-0 flex items-center gap-1 h-8 pl-2.5 pr-3 rounded-full border text-[12px] font-semibold active:scale-95 transition-transform ${
              filterCount > 0
                ? accent === "amber"
                  ? "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300"
                  : "border-indigo-400 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-300"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
            }`}
          >
            <IonIcon icon={optionsOutline} className="text-[14px]" />
            Filters
            {filterCount > 0 && (
              <span className={`ml-0.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${accent === "amber" ? "bg-amber-500" : "bg-indigo-600"}`}>
                {filterCount}
              </span>
            )}
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mr-4 pr-4">
            {!sortIsQuick && (
              <span className={`shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold flex items-center ${chipOn}`}>
                {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              </span>
            )}
            {QUICK_SORTS.filter((s) => !s.needsLocation || hasLocation).map((s) => (
              <button
                key={s.value}
                onClick={() => onFiltersChange({ ...filters, sort: s.value })}
                className={`shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold transition-colors active:scale-95 ${
                  sort === s.value ? chipOn : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {!isLoading && !isError && total > 0 && (
          <p className="px-4 pb-1 text-[11px] text-slate-400 dark:text-slate-500">
            {total} {typeNoun(type, total !== 1)}
          </p>
        )}
      </div>

      <div className="px-4 pt-1">
        {isLoading ? (
          type === "service" ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => <ServiceListSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )
        ) : isError ? (
          <div className="flex flex-col items-center text-center py-12">
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Couldn&apos;t load {typeNoun(type)}</p>
            <button onClick={() => refetch()} className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
              <IonIcon icon={refreshOutline} /> Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <IonIcon icon={searchOutline} className="text-2xl text-slate-400" />
            </div>
            <p className="text-[14px] font-bold text-slate-800 dark:text-white">No {typeNoun(type)} match these filters</p>
            <p className="text-[12px] text-slate-400 mt-1">Try a wider area or fewer filters.</p>
            {filterCount > 0 && (
              <button
                onClick={() => onFiltersChange({ ...DEFAULT_FILTERS, categoryId: filters.categoryId })}
                className={`mt-4 text-[12px] font-bold text-white px-5 py-2 rounded-full ${accent === "amber" ? "bg-amber-500" : "bg-indigo-600"}`}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : type === "service" ? (
          <div className="space-y-2.5">
            {items.map((item, i) => (
              <ServiceListCard
                key={item.id}
                item={item}
                priority={i < 3}
                isSaved={actions.isSaved(item.id)}
                onToggleSave={actions.toggle}
                onEnquire={actions.enquire}
                enquiring={actions.isEnquiring(item)}
                isOwn={actions.isOwn(item)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, i) => (
              <ProductCard key={item.id} item={item} priority={i < 4} isSaved={actions.isSaved(item.id)} onToggleSave={actions.toggle} />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-12 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${accent === "amber" ? "border-amber-500" : "border-indigo-600"}`} />
          )}
          {!hasNextPage && items.length > 6 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">You&apos;ve seen all {total} {typeNoun(type, total !== 1)}</p>
          )}
        </div>
      </div>

      <CatalogFilterSheet
        opened={sheetOpen}
        onClose={() => setSheetOpen(false)}
        type={type}
        value={filters}
        onApply={onFiltersChange}
        accent={accent}
      />
    </div>
  );
}
