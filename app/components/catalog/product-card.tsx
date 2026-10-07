"use client";
import { memo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { heart, heartOutline, star, checkmarkCircle, navigateOutline, locationOutline, flame } from "ionicons/icons";
import OptimizedImage from "@/app/components/ui/optimized-image";
import type { CatalogItem } from "@/services/catalog.service";
import { formatPrice, itemDistance, productHref } from "./catalog-utils";

interface ProductCardProps {
  item: CatalogItem;
  /** rail: fixed width for horizontal shelves · grid: fills its column */
  variant?: "rail" | "grid";
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  priority?: boolean;
  /** Show a "Trending" ribbon (the trending shelf passes this). */
  showTrending?: boolean;
}

/** The storefront's product tile: photo first, price, then who sells it. */
const ProductCard = memo(function ProductCard({
  item,
  variant = "grid",
  isSaved,
  onToggleSave,
  priority = false,
  showTrending = false,
}: ProductCardProps) {
  const price = formatPrice(item.price, item.currency);
  const distance = itemDistance(item);

  return (
    <Link
      href={productHref(item.id)}
      className={`group block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/80 shadow-[0_1px_3px_rgba(15,23,42,0.05)] dark:shadow-none active:scale-[0.97] transition-transform ${
        variant === "rail" ? "shrink-0 w-[152px]" : "w-full"
      }`}
    >
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-700">
        {item.photoUrl ? (
          <OptimizedImage
            src={item.photoUrl}
            alt={item.name}
            className="w-full h-full"
            width={variant === "rail" ? 152 : 200}
            height={variant === "rail" ? 152 : 200}
            priority={priority}
            preset="product"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-700 dark:to-slate-800">
            <span className="text-3xl font-extrabold text-amber-300/80 dark:text-slate-500">
              {item.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Top-left: one badge, the most useful one */}
        {showTrending && item.views > 0 ? (
          <span className="absolute top-2 left-2 flex items-center gap-0.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            <IonIcon icon={flame} className="text-[10px]" />
            Trending
          </span>
        ) : item.isHero ? (
          <span className="absolute top-2 left-2 bg-violet-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            ✦ Featured
          </span>
        ) : null}

        <button
          type="button"
          aria-label={isSaved ? "Remove from saved" : "Save"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(item.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm flex items-center justify-center active:scale-[0.8] transition-transform"
        >
          <IonIcon icon={isSaved ? heart : heartOutline} className={`text-sm ${isSaved ? "text-rose-500" : "text-slate-600 dark:text-slate-200"}`} />
        </button>

        {distance && (
          <span className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/75 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
            <IonIcon icon={item.approximateLocation ? locationOutline : navigateOutline} className="text-[9px] text-amber-500" />
            {distance}
          </span>
        )}
      </div>

      <div className="p-2.5">
        <h4 className="text-[12.5px] font-semibold text-slate-800 dark:text-white leading-snug line-clamp-2 min-h-[2.1em]">
          {item.name}
        </h4>

        <div className="mt-1 flex items-baseline gap-1.5">
          {price ? (
            <span className="text-[14px] font-extrabold text-slate-900 dark:text-white">{price}</span>
          ) : (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Ask for price</span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-1 min-w-0">
          <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">{item.providerName}</span>
          {item.verified && <IonIcon icon={checkmarkCircle} className="text-[11px] text-emerald-500 shrink-0" />}
          {item.rating > 0 && (
            <span className="ml-auto flex items-center gap-0.5 shrink-0 text-[10px] font-bold text-slate-700 dark:text-slate-200">
              <IonIcon icon={star} className="text-[9px] text-amber-500" />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;

export const ProductCardSkeleton = ({ variant = "grid" }: { variant?: "rail" | "grid" }) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 ${
      variant === "rail" ? "shrink-0 w-[152px]" : "w-full"
    }`}
  >
    <div className="aspect-square bg-slate-100 dark:bg-slate-700 animate-pulse" />
    <div className="p-2.5 space-y-2">
      <div className="h-3 w-4/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
      <div className="h-3.5 w-2/5 rounded-full bg-slate-200 dark:bg-slate-600 animate-pulse" />
      <div className="h-2.5 w-3/5 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
    </div>
  </div>
);
