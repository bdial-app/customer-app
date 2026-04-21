"use client";
import { Page } from "konsta/react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  arrowBack,
  heartOutline,
  heart,
  shareSocial,
  chatbubbleOutline,
  checkmarkCircle,
  chevronForward,
  star,
  storefront,
  locationOutline,
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useProduct } from "@/hooks/useProduct";
import { useIsSaved, useToggleSaved } from "@/hooks/useSavedItems";
import { useAppSelector } from "@/hooks/useAppStore";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";

export default function ProductDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const { data, isLoading, isError } = useProduct(id);

  const [currentPhoto, setCurrentPhoto] = useState(0);

  const user = useAppSelector((state) => state.auth.user);
  const { data: savedData } = useIsSaved(id, "product");
  const toggleSaved = useToggleSaved();
  const liked = savedData?.saved ?? false;

  const handleToggleSaved = () => {
    if (!user) return;
    toggleSaved.mutate({ itemId: id, itemType: "product" });
  };

  const product = data?.product;
  const listing = data?.listing ?? null;
  const provider = data?.provider ?? null;
  const stats = data?.stats;
  const related = data?.related ?? [];

  const photos = useMemo(() => {
    const p: string[] = [];
    if (product?.photoUrl) p.push(product.photoUrl);
    (listing?.photos ?? []).forEach((ph) => {
      if (ph.imageUrl && !p.includes(ph.imageUrl)) p.push(ph.imageUrl);
    });
    return p.length > 0 ? p : [FALLBACK_IMAGE];
  }, [product?.photoUrl, listing?.photos]);

  if (!id) {
    return (
      <Page className="!bg-gray-50/80">
        <div className="p-10 text-center text-sm text-gray-500">
          Product not found.
        </div>
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page className="!bg-gray-50/80">
        <div className="h-80 bg-gray-200 animate-pulse" />
        <div className="px-5 pt-5 space-y-4">
          <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-1/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </Page>
    );
  }

  if (isError || !product) {
    return (
      <Page className="!bg-gray-50/80">
        <div className="p-10 text-center text-sm text-gray-500">
          Could not load this product.
        </div>
      </Page>
    );
  }

  const price = product.price !== null ? Number(product.price) : null;
  const currency = product.currency === "INR" ? "₹" : product.currency;

  return (
    <Page className="!bg-gray-50/80">
      <div className="relative">
        <div className="relative h-80 overflow-hidden bg-white">
          <img
            src={photos[currentPhoto]}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleToggleSaved}
                className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon
                  icon={liked ? heart : heartOutline}
                  className={`w-5 h-5 ${liked ? "text-red-400" : "text-white"}`}
                />
              </button>
              <button className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                <IonIcon icon={shareSocial} className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {listing?.communityVerified && (
            <span className="absolute top-[calc(env(safe-area-inset-top)+56px)] left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-white">
              Community Verified
            </span>
          )}

          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentPhoto
                      ? "w-5 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 px-5 py-3 bg-white border-b border-gray-100/80 overflow-x-auto no-scrollbar">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhoto(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === currentPhoto
                    ? "border-amber-500 shadow-sm"
                    : "border-transparent opacity-60"
                }`}
              >
                <img
                  src={photo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pt-5 pb-28 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-3">
            {price !== null ? (
              <span className="text-2xl font-extrabold text-amber-600">
                {currency}
                {price.toLocaleString()}
              </span>
            ) : (
              <span className="text-sm font-semibold text-gray-500">
                Price on request
              </span>
            )}
            {stats && stats.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <IonIcon icon={star} className="w-3 h-3 text-amber-500" />
                {stats.rating.toFixed(1)} ({stats.reviewCount})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                product.isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              <IonIcon icon={checkmarkCircle} className="w-3 h-3" />
              {product.isActive ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        {provider && (
          <Link
            href={`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`}
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {provider.profilePhotoUrl ? (
                <img
                  src={provider.profilePhotoUrl}
                  alt={provider.brandName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <IonIcon
                  icon={storefront}
                  className="w-5 h-5 text-amber-600"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[13px] font-bold text-gray-900 truncate">
                  {provider.brandName}
                </h4>
                {listing?.communityVerified && (
                  <IonIcon
                    icon={checkmarkCircle}
                    className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"
                  />
                )}
              </div>
              {(provider.area || provider.city) && (
                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                  <IonIcon icon={locationOutline} className="w-3 h-3" />
                  {[provider.area, provider.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <IonIcon
              icon={chevronForward}
              className="w-4 h-4 text-gray-400 flex-shrink-0"
            />
          </Link>
        )}

        {listing?.categories && listing.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {product.description && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                You May Also Like
              </h3>
              {provider && (
                <Link
                  href={`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`}
                  className="flex items-center text-xs font-semibold text-amber-600"
                >
                  See All
                  <IonIcon icon={chevronForward} className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {related.map((item) => {
                const itemCurrency =
                  item.currency === "INR" ? "₹" : item.currency;
                const itemPrice =
                  item.price !== null ? Number(item.price) : null;
                return (
                  <Link
                    key={item.id}
                    href={`${ROUTE_PATH.PRODUCT_DETAILS}?id=${item.id}`}
                    className="flex-shrink-0 w-36"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={item.photoUrl ?? FALLBACK_IMAGE}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-[12px] font-semibold text-gray-900 mb-0.5 line-clamp-1">
                          {item.name}
                        </h4>
                        {itemPrice !== null ? (
                          <span className="text-[13px] font-bold text-amber-600">
                            {itemCurrency}
                            {itemPrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-500">
                            On request
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div
        className="fixed bottom-0 inset-x-0 z-30 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 px-5"
        style={{
          background:
            "linear-gradient(to top, rgba(249,250,251,1) 60%, rgba(249,250,251,0))",
        }}
      >
        <button
          onClick={() => {
            if (provider?.contactNumber) {
              window.location.href = `tel:${provider.contactNumber}`;
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 rounded-2xl text-sm font-semibold text-white shadow-sm shadow-amber-200 active:scale-[0.98] transition-transform"
        >
          <IonIcon icon={chatbubbleOutline} className="w-[18px] h-[18px]" />
          Send Enquiry
        </button>
      </div>
    </Page>
  );
}
