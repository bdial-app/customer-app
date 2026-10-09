"use client";
import { Page } from "konsta/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import { getPendingDeepLinkTarget, endDeepLinkLoading } from "@/utils/deep-link";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), {
  ssr: false,
});
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
  navigateOutline,
  flagOutline,
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useProduct } from "@/hooks/useProduct";
import { useIsSaved, useToggleSaved } from "@/hooks/useSavedItems";
import { useAppSelector } from "@/hooks/useAppStore";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useProductEnquiry } from "@/hooks/useProductEnquiry";
import { useAppContext } from "@/app/context/AppContext";
import { useTheme } from "@/app/context/ThemeContext";
import { storefrontOutline, createOutline, eyeOutline } from "ionicons/icons";
import { openDirections } from "@/utils/sharing";
import { useShareProduct } from "@/hooks/useShare";
import { triggerHaptic } from "@/utils/haptics";
import { useTrackProductView, useTrackAction } from "@/hooks/useAnalyticsTrack";
import ReportSheet from "../components/report-sheet";
import SwipeBackGesture from "../components/swipe-back-gesture";
import type { ProductDetail, ProductProviderSummary } from "@/services/product.service";
import { MoreFromSeller, SimilarItems } from "../components/catalog/product-related-sections";
import { catalogHref } from "../components/catalog/catalog-utils";

// Fields the product API returns that the shared service types don't declare.
type ProviderWithCoords = ProductProviderSummary & {
  latitude?: number | string | null;
  longitude?: number | string | null;
};
type ViewSource = NonNullable<Parameters<typeof useTrackProductView>[2]>;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";

export default function ProductDetailsPage() {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const { data, isLoading, isError } = useProduct(id);

  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const showPhoto = useCallback((i: number) => {
    const el = galleryRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setCurrentPhoto(i);
  }, []);

  // Reset local UI state when navigating to a different product (during
  // render, so the new product never paints on the old one's photo index)
  const [shownId, setShownId] = useState(id);
  if (id !== shownId) {
    setShownId(id);
    setCurrentPhoto(0);
    setReportSheetOpen(false);
    setScrolled(false);
  }

  // Hand the cold-start deep-link loader off to real content once this page has
  // loaded (success or error), so the branded loader fades straight to the
  // product instead of flashing its own skeleton first.
  useEffect(() => {
    if (!isLoading && getPendingDeepLinkTarget()) endDeepLinkLoading();
  }, [isLoading]);

  const user = useAppSelector((state) => state.auth.user);
  const { requireAuth } = useAuthGate();
  const { setUserMode } = useAppContext();
  const { data: savedData } = useIsSaved(id, "product");
  const toggleSaved = useToggleSaved();
  const liked = savedData?.saved ?? false;
  const { isDark } = useTheme();
  const { enquire, isPending: isCreatingChat } = useProductEnquiry();

  const handleToggleSaved = () => {
    requireAuth(() => {
      triggerHaptic(liked ? "light" : "medium");
      toggleSaved.mutate({ itemId: id, itemType: "product" });
    });
  };

  const product: ProductDetail | undefined = data?.product;
  const provider: ProviderWithCoords | null = data?.provider ?? null;
  const isOwnProduct = Boolean(user && provider && user.id === provider.userId);
  const stats = data?.stats;
  const related = data?.related ?? [];

  // ─── Analytics Tracking ─────────────────────────────────────────
  const source = (searchParams.get("src") as ViewSource | null) || "direct";
  // The guided tour opens a real product as an example — that isn't a real view, so don't count it.
  const inTour = searchParams.get("tour") === "1";
  useTrackProductView(
    isOwnProduct || inTour ? undefined : provider?.id,
    isOwnProduct || inTour ? undefined : id,
    source,
  );
  const { trackShare, trackSave, trackChat, trackCall } = useTrackAction(
    isOwnProduct ? undefined : provider?.id,
  );
  // Built in the background once the page has data, so the tap shares at once.
  const { share: shareProduct, busy: sharing } = useShareProduct(id, { asOwner: isOwnProduct });

  // Read into locals so the memo's inputs are exactly what it depends on.
  const photoUrls = product?.photoUrls;
  const photoUrl = product?.photoUrl;
  const photos = useMemo(() => {
    if (photoUrls?.length) {
      const valid = photoUrls.filter((u: string) => !!u);
      if (valid.length) return valid;
    }
    if (photoUrl) return [photoUrl];
    return [FALLBACK_IMAGE];
  }, [photoUrls, photoUrl]);

  if (!id) {
    return (
      <Page className="!bg-gray-50/80 dark:!bg-slate-900">
        <SwipeBackGesture onBack={() => goBack("/")} />
        <button
          onClick={() => goBack("/")}
          aria-label="Back"
          className="absolute z-40 left-4 top-[calc(var(--sat,0px)+12px)] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        >
          <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
        </button>
        <div className="p-10 pt-24 text-center text-sm text-gray-500">
          Product not found.
        </div>
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page className="!bg-gray-50/80 dark:!bg-slate-900">
        <SwipeBackGesture onBack={() => goBack("/")} />
        <button
          onClick={() => goBack("/")}
          aria-label="Back"
          className="absolute z-40 left-4 top-[calc(var(--sat,0px)+12px)] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        >
          <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
        </button>
        <div className="h-80 bg-gray-200 dark:bg-slate-700 animate-pulse" />
        <div className="px-5 pt-5 space-y-4">
          <div className="h-5 w-2/3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-7 w-1/3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        </div>
      </Page>
    );
  }

  if (isError || !product) {
    return (
      <Page className="!bg-gray-50/80 dark:!bg-slate-900">
        <SwipeBackGesture onBack={() => goBack("/")} />
        <button
          onClick={() => goBack("/")}
          aria-label="Back"
          className="absolute z-40 left-4 top-[calc(var(--sat,0px)+12px)] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        >
          <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
        </button>
        <div className="p-10 pt-24 text-center text-sm text-gray-500">
          Could not load this product.
        </div>
      </Page>
    );
  }

  const price = product.price !== null ? Number(product.price) : null;
  const isService = product.productType === "service";
  // The most specific category the seller tagged, for the chip and "See all".
  const productCategory = product.subcategory ?? product.category ?? null;
  const currency = product.currency === "INR" ? "₹" : product.currency;
  const iconBtn = `w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
    scrolled ? "bg-gray-100 dark:bg-slate-800" : "bg-black/30 backdrop-blur-md"
  }`;
  const iconColor = scrolled ? "text-gray-800 dark:text-white" : "text-white";

  return (
    <Page className="!bg-gray-50/80 dark:!bg-slate-900">
      <SwipeBackGesture onBack={() => goBack("/")} />

      {/* Top bar stays put while the page scrolls: see-through over the photo,
          solid with the product name once the photo has scrolled away. */}
      <div data-tour="product-topbar"
        className={`absolute top-0 inset-x-0 z-40 transition-colors duration-200 ${
          scrolled ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)]" : ""
        }`}
      >
        <div className="flex items-center gap-2 px-4 pt-[calc(var(--sat,0px)+12px)] pb-3">
          <button
            onClick={() => goBack("/")}
            aria-label="Back"
            className={`${iconBtn} shrink-0`}
          >
            <IonIcon icon={arrowBack} className={`w-5 h-5 ${iconColor}`} />
          </button>
          <p
            className={`flex-1 min-w-0 truncate text-[15px] font-bold text-gray-900 dark:text-white transition-opacity duration-200 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          >
            {product.name}
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleToggleSaved} aria-label={liked ? "Remove from saved" : "Save"} className={iconBtn}>
              <IonIcon icon={liked ? heart : heartOutline} className={`w-5 h-5 ${liked ? "text-red-400" : iconColor}`} />
            </button>
            <button
              onClick={async () => {
                if (!product) return;
                trackShare();
                await shareProduct();
              }}
              disabled={sharing}
              aria-busy={sharing}
              aria-label="Share this product"
              className={`${iconBtn} ${sharing ? "opacity-60 animate-pulse" : ""}`}
            >
              <IonIcon icon={shareSocial} className={`w-5 h-5 ${iconColor}`} />
            </button>
            {!isOwnProduct && (
              <button onClick={() => requireAuth(() => setReportSheetOpen(true))} aria-label="Report" className={iconBtn}>
                <IonIcon icon={flagOutline} className={`w-5 h-5 ${iconColor}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyed by product so opening another product starts at the top */}
      <div
        key={id}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 250)}
        className="h-full overflow-y-auto overscroll-contain"
      >
      <div className="relative">
        <div data-tour="product-gallery" className="relative h-80 overflow-hidden bg-white dark:bg-slate-800">
          {/* Swipeable gallery; keyed by product so a new product starts at photo 1 */}
          <div
            key={id}
            ref={galleryRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
              if (idx !== currentPhoto && idx >= 0 && idx < photos.length) setCurrentPhoto(idx);
            }}
            className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt={i === 0 ? product.name : `${product.name} — photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="w-full h-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>

          {provider?.communityVerified && (
            <span className="absolute top-[calc(var(--sat,0px)+56px)] left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-white">
              Community Verified
            </span>
          )}

          {photos.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-between px-4">
              <div className="flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Photo ${i + 1}`}
                    onClick={() => showPhoto(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === currentPhoto
                        ? "w-5 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
              <div className="bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentPhoto + 1}/{photos.length}
              </div>
            </div>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 px-5 py-3 bg-white dark:bg-slate-800 border-b border-gray-100/80 dark:border-slate-700 overflow-x-auto no-scrollbar">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => showPhoto(i)}
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
        <div data-tour="product-summary">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {product.name}
          </h1>
          {product.isHero && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-200/60 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 text-xs font-bold mb-2">
              ✦ Featured Product
            </span>
          )}
          {product.productType === "service" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2 ml-1">
              🛠️ Service
            </span>
          )}
          <div className="flex items-center gap-3">
            {price !== null ? (
              <span className="flex items-baseline gap-1.5">
                {isService && (
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Starts at</span>
                )}
                <span className="text-2xl font-extrabold text-amber-600">
                  {currency}
                  {price.toLocaleString("en-IN")}
                </span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                {isService ? "Ask for a quote" : "Price on request"}
              </span>
            )}
            {stats && stats.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                <IonIcon icon={star} className="w-3 h-3 text-amber-500" />
                {stats.rating.toFixed(1)} ({stats.reviewCount})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                product.isActive
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400"
              }`}
            >
              <IonIcon icon={checkmarkCircle} className="w-3 h-3" />
              {product.isActive ? "Available" : "Unavailable"}
            </span>
            {productCategory && (
              <Link
                href={catalogHref(isService ? "service" : "product", {
                  title: productCategory.name,
                  filters: { categoryId: productCategory.id },
                })}
                className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
              >
                {productCategory.name}
                <IonIcon icon={chevronForward} className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {provider && (
          <Link data-tour="product-seller"
            href={`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100/80 dark:border-slate-700 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none active:scale-[0.99] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {provider.profilePhotoUrl ? (
                <img
                  src={provider.profilePhotoUrl}
                  alt={provider.brandName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <IonIcon icon={storefront} className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                  {provider.brandName}
                </h4>
                {provider?.communityVerified && (
                  <IonIcon
                    icon={checkmarkCircle}
                    className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"
                  />
                )}
              </div>
              {(provider.area || provider.city) && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
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

        {/* Get Directions */}
        {provider &&
          provider?.latitude &&
          provider?.longitude && (
            <button
              onClick={() =>
                openDirections(
                  Number(provider.latitude),
                  Number(provider.longitude),
                  provider.brandName,
                )
              }
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[13px] font-semibold active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
            >
              <IonIcon icon={navigateOutline} className="w-4 h-4" />
              Get Directions
            </button>
          )}

        {provider?.categories && provider.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {provider.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {product.description && (
          <div data-tour="product-about" className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">
              About this {isService ? "service" : "product"}
            </h3>
            <p className="text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {provider && related.length > 0 && (
          <div data-tour="product-more-from-seller" className="pt-2">
            <MoreFromSeller
              related={related}
              provider={provider}
              rating={stats?.rating ?? 0}
              reviewCount={stats?.reviewCount ?? 0}
            />
          </div>
        )}

        <div data-tour="product-similar" className="pt-2">
          <SimilarItems
            productId={product.id}
            type={isService ? "service" : "product"}
            categoryId={productCategory?.id}
            categoryName={productCategory?.name}
          />
        </div>
      </div>

      <div data-tour="product-cta"
        className="fixed bottom-0 inset-x-0 z-30 pt-3 px-5"
        style={{
          paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 12px)",
          background: isDark
            ? "linear-gradient(to top, rgba(15,23,42,1) 60%, rgba(15,23,42,0))"
            : "linear-gradient(to top, rgba(249,250,251,1) 60%, rgba(249,250,251,0))",
        }}
      >
        {isOwnProduct ? (
          <div className="rounded-2xl overflow-hidden border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 shadow-md shadow-violet-100 dark:shadow-violet-900/20">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-violet-100 dark:border-violet-800">
              <div className="w-7 h-7 rounded-full bg-violet-600 grid place-content-center shrink-0">
                <IonIcon
                  icon={storefrontOutline}
                  className="text-white text-sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                  Your Product
                </p>
                <p className="text-[10px] text-violet-500 dark:text-violet-400 truncate">
                  You&apos;re viewing your own listing
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 dark:text-violet-300 bg-violet-100 dark:bg-violet-800/50 px-2 py-0.5 rounded-full">
                <IonIcon icon={eyeOutline} className="text-xs" />
                Preview mode
              </span>
            </div>
            <div className="px-4 py-3">
              <button
                onClick={() => {
                  setUserMode("provider");
                  router.push("/");
                }}
                className="flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-violet-600 text-white font-bold text-sm active:scale-[0.97] transition-all shadow-sm shadow-violet-300 dark:shadow-violet-900"
              >
                <IonIcon icon={createOutline} className="text-base" />
                Manage Business
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5">
          <button
            onClick={handleToggleSaved}
            aria-label={liked ? "Remove from saved" : "Save"}
            className="shrink-0 w-[52px] flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 active:scale-95 transition-transform"
          >
            <IonIcon icon={liked ? heart : heartOutline} className={`w-[22px] h-[22px] ${liked ? "text-red-500" : "text-gray-600 dark:text-slate-300"}`} />
          </button>
          <button
            onClick={() => {
              if (!provider?.id || !product) return;
              enquire({
                providerId: provider.id,
                providerUserId: provider.userId,
                productId: product.id,
                productName: product.name,
                productType: isService ? "service" : "product",
                photoUrl: product.photoUrl,
                price: product.price,
                currency: product.currency,
              });
            }}
            disabled={isCreatingChat}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-amber-500 rounded-2xl text-sm font-semibold text-white shadow-sm shadow-amber-200 dark:shadow-none active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            <IonIcon icon={chatbubbleOutline} className="w-[18px] h-[18px]" />
            {isCreatingChat ? "Opening Chat..." : isService ? "Enquire About Service" : "Send Enquiry"}
          </button>
          </div>
        )}
      </div>

      {/* Report Sheet */}
      </div>{/* end scroll wrapper */}
      {id && (
        <ReportSheet
          entityType="product"
          entityId={id}
          isOpen={reportSheetOpen}
          onClose={() => setReportSheetOpen(false)}
        />
      )}
    </Page>
  );
}
