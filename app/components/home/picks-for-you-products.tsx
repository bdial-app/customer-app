"use client";
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { sparklesOutline, arrowForward, storefront } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { HomeFeedProduct, PersonalizedCategory } from "@/services/home.service";
import OptimizedImage from "@/app/components/ui/optimized-image";

const FALLBACK_REASONS = [
  "Hand-picked for you",
  "Matches your taste",
  "You might love this",
];

const formatPrice = (price: number | null, currency: string) => {
  if (price == null) return null;
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${Number(price).toLocaleString()}`;
};

const PicksForYouProducts = ({
  products,
  personalizedCategories,
  isLoading = false,
}: {
  products?: HomeFeedProduct[] | null;
  personalizedCategories?: PersonalizedCategory[] | null;
  isLoading?: boolean;
}) => {
  const router = useRouter();

  const topReason = useMemo(() => {
    const firstCat = (personalizedCategories || []).find((c) => c && c.name);
    return firstCat ? `Because you love ${firstCat.name}` : FALLBACK_REASONS[0];
  }, [personalizedCategories]);

  const list = Array.isArray(products) ? products : [];
  if (!isLoading && list.length === 0) return null;

  const [hero, ...rest] = list;
  const supporting = rest.slice(0, 3);

  const handleOpen = (id: string) =>
    router.push(`${ROUTE_PATH.PRODUCT_DETAILS}?id=${id}`);

  if (isLoading) {
    return (
      <div className="px-4 pt-4 pb-3">
        <div className="h-10 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse mb-3" />
        <div className="h-[220px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse mb-2" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[110px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-end justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #EC4899, #8B5CF6)",
              boxShadow: "0 4px 14px rgba(236,72,153,0.30)",
            }}
          >
            <IonIcon icon={sparklesOutline} className="text-white text-base" />
          </div>
          <div>
            <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
              Just for you
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hand-picked from categories you love
            </p>
          </div>
        </div>
      </div>

      {/* Magazine grid: hero on top, 3 supporting cards below */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileTap={{ scale: 0.985 }}
        onClick={() => handleOpen(hero.id)}
        className="relative w-full h-[240px] rounded-3xl overflow-hidden cursor-pointer shadow-xl shadow-slate-900/[0.10] dark:shadow-black/40 border border-slate-100/80 dark:border-slate-800 mb-2"
      >
        {hero.photoUrl ? (
          <OptimizedImage
            src={hero.photoUrl}
            alt={hero.name}
            className="w-full h-full"
            width={600}
            height={240}
            priority
            preset="card"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-200 via-pink-200 to-amber-100 dark:from-violet-900/40 dark:to-pink-900/40">
            <span className="text-6xl font-extrabold text-white/80">
              {hero.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Layered scrim — top dark for chip, bottom dark for content */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Price pill — top right */}
        {hero.price != null && (
          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[13px] font-extrabold text-slate-900"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            }}
          >
            {formatPrice(hero.price, hero.currency)}
          </div>
        )}

        {/* Content — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-[18px] font-extrabold leading-tight drop-shadow-md line-clamp-2 mb-2">
            {hero.name}
          </h3>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {hero.providerImage ? (
                <img
                  src={hero.providerImage}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover ring-1.5 ring-white/40 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-[10px] text-white font-bold ring-1.5 ring-white/40 shrink-0">
                  {hero.providerName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className="text-[12px] text-white/90 font-semibold truncate">
                {hero.providerName}
              </span>
            </div>
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-900 shrink-0"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              View
              <IonIcon icon={arrowForward} className="text-[12px]" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Supporting cards — 3-col grid */}
      {supporting.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {supporting.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.1 + idx * 0.06,
                ease: "easeOut",
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleOpen(product.id)}
              className="relative h-[130px] rounded-2xl overflow-hidden cursor-pointer shadow-md shadow-slate-900/[0.06] dark:shadow-black/30 border border-slate-100/80 dark:border-slate-800"
            >
              {product.photoUrl ? (
                <OptimizedImage
                  src={product.photoUrl}
                  alt={product.name}
                  className="w-full h-full"
                  width={200}
                  height={130}
                  preset="card"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-pink-100 dark:from-slate-700 dark:to-slate-800">
                  <span className="text-2xl font-bold text-white/80">
                    {product.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Bottom scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

              {/* Price chip — top */}
              {product.price != null && (
                <div
                  className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold text-slate-900"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }}
                >
                  {formatPrice(product.price, product.currency)}
                </div>
              )}

              {/* Service badge */}
              {product.productType === "service" && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white bg-teal-500/90 backdrop-blur-sm">
                  Service
                </div>
              )}

              {/* Bottom content */}
              <div className="absolute bottom-0 inset-x-0 p-2">
                <p className="text-white text-[11px] font-bold leading-tight line-clamp-1 mb-0.5 drop-shadow">
                  {product.name}
                </p>
                <div className="flex items-center gap-1">
                  <IonIcon
                    icon={storefront}
                    className="text-[9px] text-white/70 shrink-0"
                  />
                  <span className="text-[9px] text-white/80 font-medium truncate">
                    {product.providerName}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(PicksForYouProducts);
