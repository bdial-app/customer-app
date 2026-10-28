"use client";

import { fallbackToOriginal, sizedImageUrl } from "@/utils/image-optimization";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { locationOutline, navigateOutline, storefrontOutline, pricetag } from "ionicons/icons";
import { reportSponsored, type ProductSearchResult } from "@/services/search.service";
import { distanceLabel, isApproximate } from "@/utils/distance-label";
import { productHref } from "@/utils/share-links";
import { discountValueLabel } from "@/app/components/offers/offer-ui";

interface Props {
  product: ProductSearchResult;
  index: number;
}

const ProductResultCard = ({ product, index }: Props) => {
  const router = useRouter();
  const isService = product.productType === "service";
  const sponsored = !!product.isSponsored;
  const distance = distanceLabel(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      onClick={() => {
        reportSponsored("click", product.sponsoredListingId, "search_result");
        router.push(productHref(product));
      }}
      className={`h-full flex flex-col cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform duration-150 ${
        sponsored
          ? "border-2 border-amber-200/80 dark:border-amber-700/50 shadow-[0_2px_12px_rgba(245,158,11,0.12)] dark:shadow-none"
          : "border border-gray-100 dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-700">
        {product.photoUrl ? (
          <img
            src={sizedImageUrl(product.photoUrl, 360)}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={fallbackToOriginal(product.photoUrl)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800">
            <span className="text-3xl opacity-20">{isService ? "🛠️" : "📦"}</span>
          </div>
        )}

        {/* What it is */}
        <div
          className={`absolute top-2 left-2 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm ${
            isService ? "bg-indigo-500/90" : "bg-amber-500/90"
          }`}
        >
          {isService ? "🛠️ Service" : "📦 Product"}
        </div>

        {/* Price tag */}
        {product.price != null && (
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-gray-900 dark:text-white text-[12px] font-bold px-2 py-1 rounded-lg shadow-sm">
            {product.currency === "INR" ? "₹" : product.currency}{" "}
            {product.price.toLocaleString()}
          </div>
        )}

        {/* Distance */}
        {distance && (
          <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-gray-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <IonIcon icon={isApproximate(product) ? locationOutline : navigateOutline} className="w-3 h-3 text-amber-500" />
            {distance}
          </div>
        )}

        {sponsored && (
          <div className="absolute bottom-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shadow-sm flex items-center gap-0.5">
            <span className="text-[8px]">⚡</span> Sponsored
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
          {product.name}
        </h4>

        <div className="flex items-center gap-1 mt-1.5">
          <IonIcon icon={storefrontOutline} className="w-3 h-3 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1 font-medium">
            {product.providerName}
          </p>
        </div>

        {(product.providerArea || product.providerCity) && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 dark:text-slate-500">
            <IonIcon icon={locationOutline} className="w-3 h-3 flex-shrink-0" />
            <span className="truncate font-medium">
              {[product.providerArea, product.providerCity].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* The seller's live deal applies here too */}
        {product.hasActiveOffer && product.discountValue != null && (
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-900/25 px-2 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-300">
              <IonIcon icon={pricetag} className="w-3 h-3 shrink-0" />
              <span className="truncate">{`${discountValueLabel(product.discountType, product.discountValue)} OFF at this shop`}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductResultCard;
