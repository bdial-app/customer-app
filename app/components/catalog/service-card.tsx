"use client";
import { memo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  heart,
  heartOutline,
  star,
  checkmarkCircle,
  navigateOutline,
  locationOutline,
  chatbubbleEllipsesOutline,
  constructOutline,
} from "ionicons/icons";
import OptimizedImage from "@/app/components/ui/optimized-image";
import type { CatalogItem } from "@/services/catalog.service";
import { formatPrice, itemDistance, itemLocation, productHref } from "./catalog-utils";

interface ServiceCardProps {
  item: CatalogItem;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onEnquire: (item: CatalogItem) => void;
  /** True while this card's enquiry chat is opening. */
  enquiring?: boolean;
  /** Hide "Enquire" on the viewer's own listing. */
  isOwn?: boolean;
  priority?: boolean;
}

const ServicePhoto = ({ item, size, priority }: { item: CatalogItem; size: number; priority?: boolean }) =>
  item.photoUrl ? (
    <OptimizedImage src={item.photoUrl} alt={item.name} className="w-full h-full" width={size} height={size} priority={priority} preset="product" />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-sky-100 dark:from-slate-700 dark:to-slate-800">
      <IonIcon icon={constructOutline} className="text-2xl text-indigo-300 dark:text-slate-500" />
    </div>
  );

const PriceLine = ({ item }: { item: CatalogItem }) => {
  const price = formatPrice(item.price, item.currency);
  return price ? (
    <span className="text-[11px] text-slate-500 dark:text-slate-400">
      Starts at <span className="text-[14px] font-extrabold text-slate-900 dark:text-white">{price}</span>
    </span>
  ) : (
    <span className="text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400">Get a quote</span>
  );
};

const SellerLine = ({ item }: { item: CatalogItem }) => (
  <div className="flex items-center gap-1 min-w-0">
    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{item.providerName}</span>
    {item.verified && <IonIcon icon={checkmarkCircle} className="text-[12px] text-emerald-500 shrink-0" />}
    {item.rating > 0 && (
      <span className="flex items-center gap-0.5 shrink-0 ml-1 text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
        <IonIcon icon={star} className="text-[10px] text-amber-500" />
        {item.rating.toFixed(1)}
        {item.reviewCount > 0 && <span className="font-medium text-slate-400">({item.reviewCount})</span>}
      </span>
    )}
  </div>
);

const SaveButton = ({ item, isSaved, onToggleSave, className }: Pick<ServiceCardProps, "item" | "isSaved" | "onToggleSave"> & { className: string }) => (
  <button
    type="button"
    aria-label={isSaved ? "Remove from saved" : "Save"}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleSave(item.id);
    }}
    className={`rounded-full flex items-center justify-center active:scale-[0.8] transition-transform ${className}`}
  >
    <IonIcon icon={isSaved ? heart : heartOutline} className={`text-sm ${isSaved ? "text-rose-500" : "text-slate-500 dark:text-slate-300"}`} />
  </button>
);

const EnquireButton = ({ item, onEnquire, enquiring }: Pick<ServiceCardProps, "item" | "onEnquire" | "enquiring">) => (
  <button
    type="button"
    disabled={enquiring}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onEnquire(item);
    }}
    className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-full shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform disabled:opacity-60"
  >
    <IonIcon icon={chatbubbleEllipsesOutline} className="text-[12px]" />
    {enquiring ? "Opening…" : "Enquire"}
  </button>
);

/** Full-width row for service listings: photo left, details and actions right. */
export const ServiceListCard = memo(function ServiceListCard(props: ServiceCardProps) {
  const { item, priority, isOwn } = props;
  const distance = itemDistance(item, false);
  const location = itemLocation(item);

  return (
    <Link
      href={productHref(item.id)}
      className="flex gap-3 bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-700/80 shadow-[0_1px_3px_rgba(15,23,42,0.05)] dark:shadow-none active:scale-[0.99] transition-transform"
    >
      <div className="relative w-[92px] h-[92px] shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
        <ServicePhoto item={item} size={92} priority={priority} />
        {item.isHero && (
          <span className="absolute bottom-1 left-1 bg-violet-600/90 text-white text-[8px] font-bold px-1 py-0.5 rounded">✦ Featured</span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start gap-2">
          <h4 className="flex-1 text-[13px] font-semibold text-slate-800 dark:text-white leading-snug line-clamp-2">{item.name}</h4>
          <SaveButton {...props} className="w-7 h-7 -mt-0.5 -mr-0.5 bg-slate-50 dark:bg-slate-700" />
        </div>
        <div className="mt-0.5">
          <SellerLine item={item} />
        </div>
        {(distance || location) && (
          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-slate-400 dark:text-slate-500 min-w-0">
            <IonIcon icon={item.distance != null ? navigateOutline : locationOutline} className="text-[10px] shrink-0" />
            <span className="truncate">{[item.distance != null ? distance : null, location].filter(Boolean).join(" · ")}</span>
          </p>
        )}
        <div className="mt-auto pt-1.5 flex items-center justify-between gap-2">
          <PriceLine item={item} />
          {!isOwn && <EnquireButton {...props} />}
        </div>
      </div>
    </Link>
  );
});

/** Wider card for horizontal service shelves. */
export const ServiceRailCard = memo(function ServiceRailCard(props: ServiceCardProps) {
  const { item, priority, isOwn } = props;
  const distance = itemDistance(item);

  return (
    <Link
      href={productHref(item.id)}
      className="shrink-0 w-[232px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/80 shadow-[0_1px_3px_rgba(15,23,42,0.05)] dark:shadow-none active:scale-[0.98] transition-transform"
    >
      <div className="relative h-[124px] bg-slate-100 dark:bg-slate-700">
        <ServicePhoto item={item} size={232} priority={priority} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
        <SaveButton {...props} className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm" />
        {distance && (
          <span className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/75 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
            <IonIcon icon={item.approximateLocation ? locationOutline : navigateOutline} className="text-[9px] text-indigo-500" />
            {distance}
          </span>
        )}
        {item.categoryName && (
          <span className="absolute bottom-2 right-2 max-w-[60%] truncate bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
            {item.categoryName}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <h4 className="text-[13px] font-semibold text-slate-800 dark:text-white leading-snug line-clamp-1">{item.name}</h4>
        <div className="mt-0.5">
          <SellerLine item={item} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <PriceLine item={item} />
          {!isOwn && <EnquireButton {...props} />}
        </div>
      </div>
    </Link>
  );
});

export const ServiceListSkeleton = () => (
  <div className="flex gap-3 bg-white dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-700">
    <div className="w-[92px] h-[92px] rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse shrink-0" />
    <div className="flex-1 space-y-2 py-1">
      <div className="h-3 w-4/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
      <div className="h-2.5 w-3/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
      <div className="h-2.5 w-2/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
      <div className="h-6 w-full rounded-full bg-slate-50 dark:bg-slate-700/60 animate-pulse" />
    </div>
  </div>
);

export const ServiceRailSkeleton = () => (
  <div className="shrink-0 w-[232px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
    <div className="h-[124px] bg-slate-100 dark:bg-slate-700 animate-pulse" />
    <div className="p-2.5 space-y-2">
      <div className="h-3 w-4/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
      <div className="h-2.5 w-3/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
      <div className="h-6 w-full rounded-full bg-slate-50 dark:bg-slate-700/60 animate-pulse" />
    </div>
  </div>
);
