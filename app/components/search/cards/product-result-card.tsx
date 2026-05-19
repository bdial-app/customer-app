"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { locationOutline, navigateOutline, storefrontOutline } from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import type { ProductSearchResult } from "@/services/search.service";

interface Props {
  product: ProductSearchResult;
  index: number;
}

const ProductResultCard = ({ product, index }: Props) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() =>
        router.push(`${ROUTE_PATH.PRODUCT_DETAILS}?id=${product.id}`)
      }
      className="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none active:scale-[0.97] transition-transform duration-150"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-700">
        {product.photoUrl ? (
          <img
            src={product.photoUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800">
            <span className="text-3xl opacity-20">{product.productType === "service" ? "🛠️" : "📦"}</span>
          </div>
        )}

        {/* Service badge */}
        {product.productType === "service" && (
          <div className="absolute top-2 left-2 bg-teal-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            🛠️ Service
          </div>
        )}

        {/* Price tag */}
        {product.price != null && (
          <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-gray-900 dark:text-white text-[12px] font-bold px-2 py-1 rounded-lg shadow-sm">
            {product.currency === "INR" ? "₹" : product.currency}{" "}
            {product.price.toLocaleString()}
          </div>
        )}

        {/* Distance */}
        {product.distance != null && (
          <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-gray-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <IonIcon icon={navigateOutline} className="w-3 h-3 text-amber-500" />
            {product.distance < 1
              ? `${Math.round(product.distance * 1000)}m`
              : `${product.distance.toFixed(1)} km`}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
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
              {[product.providerArea, product.providerCity]
                .filter(Boolean)
                .join(", ")}
            </span>
            {product.distance != null && (
              <span className="ml-auto flex-shrink-0 text-amber-600 font-semibold">
                ~{product.distance < 1
                  ? `${Math.round(product.distance * 1000)}m`
                  : `${product.distance.toFixed(1)} km`}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductResultCard;
