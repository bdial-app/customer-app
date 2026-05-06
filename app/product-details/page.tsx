"use client";
import { Page } from "konsta/react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
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
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useCreateConversation } from "@/hooks/useChat";
import { openChat } from "@/store/slices/chatSlice";
import { useAppContext } from "@/app/context/AppContext";
import { useTheme } from "@/app/context/ThemeContext";
import { storefrontOutline, createOutline, eyeOutline } from "ionicons/icons";
import { shareContent, openDirections } from "@/utils/sharing";
import { useTrackProductView, useTrackAction } from "@/hooks/useAnalyticsTrack";
import ReportSheet from "../components/report-sheet";

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

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { requireAuth } = useAuthGate();
  const { setUserMode } = useAppContext();
  const { data: savedData } = useIsSaved(id, "product");
  const toggleSaved = useToggleSaved();
  const liked = savedData?.saved ?? false;
  const { isDark } = useTheme();
  const { mutate: createConversation, isPending: isCreatingChat } =
    useCreateConversation();

  const handleToggleSaved = () => {
    requireAuth(() => {
      toggleSaved.mutate({ itemId: id, itemType: "product" });
    });
  };

  const product = data?.product;
  const provider = data?.provider ?? null;
  const isOwnProduct = Boolean(user && provider && user.id === provider.userId);
  const stats = data?.stats;
  const related = data?.related ?? [];

  // ─── Analytics Tracking ─────────────────────────────────────────
  const source = (searchParams.get("src") as any) || "direct";
  useTrackProductView(
    isOwnProduct ? undefined : provider?.id,
    isOwnProduct ? undefined : id,
    source,
  );
  const { trackShare, trackSave, trackChat, trackCall } = useTrackAction(
    isOwnProduct ? undefined : provider?.id,
  );

  const photos = useMemo(() => {
    if (product?.photoUrls?.length) {
      const valid = product.photoUrls.filter((u: string) => !!u);
      if (valid.length) return valid;
    }
    if (product?.photoUrl) return [product.photoUrl];
    return [FALLBACK_IMAGE];
  }, [product?.photoUrls, product?.photoUrl]);

  if (!id) {
    return (
      <Page className="!bg-gray-50/80 dark:!bg-slate-900">
        <div className="p-10 text-center text-sm text-gray-500">
          Product not found.
        </div>
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page className="!bg-gray-50/80 dark:!bg-slate-900">
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
        <div className="p-10 text-center text-sm text-gray-500">
          Could not load this product.
        </div>
      </Page>
    );
  }

  const price = product.price !== null ? Number(product.price) : null;
  const currency = product.currency === "INR" ? "₹" : product.currency;

  return (
    <Page className="!bg-gray-50/80 dark:!bg-slate-900">
      <div className="h-full overflow-y-auto overscroll-contain">
      <div className="relative">
        <div className="relative h-80 overflow-hidden bg-white dark:bg-slate-800">
          <img
            src={photos[currentPhoto]}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(var(--sat,0px)+12px)] pb-3">
            <button
              onClick={() => goBack("/")}
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
              <button
                onClick={async () => {
                  if (!product) return;
                  await shareContent({
                    title: product.name,
                    text: `Check out ${product.name}${price !== null ? ` - ${currency}${price.toLocaleString()}` : ""}\n${product.description || ""}`,
                    url: window.location.href,
                  });
                }}
                className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon icon={shareSocial} className="w-5 h-5 text-white" />
              </button>
              {!isOwnProduct && (
                <button
                  onClick={() => requireAuth(() => setReportSheetOpen(true))}
                  className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
                >
                  <IonIcon icon={flagOutline} className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
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
                    onClick={() => setCurrentPhoto(i)}
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-3">
            {price !== null ? (
              <span className="text-2xl font-extrabold text-amber-600">
                {currency}
                {price.toLocaleString()}
              </span>
            ) : (
              <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                Price on request
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
          </div>
        </div>

        {provider && (
          <Link
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
          (provider as any)?.latitude &&
          (provider as any)?.longitude && (
            <button
              onClick={() =>
                openDirections(
                  Number((provider as any).latitude),
                  Number((provider as any).longitude),
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
            {provider.categories.map((cat: any) => (
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none active:scale-[0.98] transition-transform">
                      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-700">
                        <img
                          src={item.photoUrl ?? FALLBACK_IMAGE}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-[12px] font-semibold text-gray-900 dark:text-white mb-0.5 line-clamp-1">
                          {item.name}
                        </h4>
                        {itemPrice !== null ? (
                          <span className="text-[13px] font-bold text-amber-600">
                            {itemCurrency}
                            {itemPrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
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
          <button
            onClick={() => {
              requireAuth(() => {
                if (!provider?.id) return;
                createConversation({
                  providerId: provider.id,
                  contextType: 'product',
                  contextId: product?.id,
                  initialMessage: `Hi! I'm interested in ${product?.name || 'this product'}. Could you share more details?`,
                  initialMessageMetadata: {
                    productId: product?.id,
                    productName: product?.name,
                    productImage: product?.photoUrl,
                    productPrice: product?.price,
                    currency: product?.currency,
                  },
                }, {
                  onSuccess: (conv) => {
                    dispatch(openChat(conv.id));
                    router.push('/');
                  },
                  onError: (err: any) => {
                    const msg = err?.response?.data?.message || err?.message || 'Could not start conversation';
                    alert(Array.isArray(msg) ? msg.join(', ') : msg);
                  },
              });
              });
            }}
            disabled={isCreatingChat}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 rounded-2xl text-sm font-semibold text-white shadow-sm shadow-amber-200 active:scale-[0.98] transition-transform"
          >
            <IonIcon icon={chatbubbleOutline} className="w-[18px] h-[18px]" />
            {isCreatingChat ? "Opening Chat..." : "Send Enquiry"}
          </button>
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
