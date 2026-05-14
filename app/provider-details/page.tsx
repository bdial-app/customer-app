"use client";
import { Page } from "konsta/react";
import { BottomSheet } from "../components/bottom-sheet";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), {
  ssr: false,
});
import {
  arrowBack,
  star,
  locationOutline,
  shareSocial,
  time,
  checkmarkCircle,
  imagesOutline,
  heartOutline,
  heart,
  shieldCheckmark,
  storefrontOutline,
  ribbonOutline,
  callOutline,
  chatbubbleOutline,
  createOutline,
  eyeOutline,
  navigateOutline,
  pricetag,
  peopleOutline,
  flagOutline,
  lockClosedOutline,
  logInOutline,
  bookmark,
  bookmarkOutline,
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import PhotoGallary, { PhotoGalleryRef } from "../components/photo-gallery";
import { useProviderDetails, useSubmitReview } from "@/hooks/useProvider";
import { shareProvider } from "@/utils/sharing";
import { useIsSaved, useToggleSaved } from "@/hooks/useSavedItems";
import { useCreateConversation } from "@/hooks/useChat";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { useAuthGate } from "@/hooks/useAuthGate";
import { openChat } from "@/store/slices/chatSlice";
import { store } from "@/store";
import { useAppContext } from "../context/AppContext";
import { openDirections } from "@/utils/sharing";
import {
  useTrackProviderView,
  useTrackAction,
} from "@/hooks/useAnalyticsTrack";
import ReportSheet from "../components/report-sheet";
import { checkContent } from "@/utils/content-sanitizer";
import { motion, AnimatePresence } from "framer-motion";

const TABS = ["Overview", "Reviews", "Products", "Photos"] as const;
type Tab = (typeof TABS)[number];

// -- Empty state defaults (no fake data) --
const EMPTY_STATS = {
  rating: 0,
  reviewCount: 0,
  ratingDist: [0, 0, 0, 0, 0],
  photoCount: 0,
  productCount: 0,
  priceRange: null as { min: number; max: number; currency: string } | null,
};

// -- Helpers --

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "1 day ago";
  if (day < 7) return `${day} days ago`;
  if (day < 30) return `${Math.floor(day / 7)} week${day >= 14 ? "s" : ""} ago`;
  if (day < 365)
    return `${Math.floor(day / 30)} month${day >= 60 ? "s" : ""} ago`;
  return `${Math.floor(day / 365)} year${day >= 730 ? "s" : ""} ago`;
}

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-[1px]">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={s <= rating ? "#FBBF24" : "#E5E7EB"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({
  starCount,
  count,
  total,
}: {
  starCount: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-gray-500 dark:text-slate-400 font-medium">
        {starCount}
      </span>
      <svg width={10} height={10} viewBox="0 0 20 20" fill="#FBBF24">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
      </svg>
      <div className="flex-1 h-[6px] bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-gray-400 dark:text-slate-500">
        {count}
      </span>
    </div>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
        <IonIcon icon={icon} className="w-[18px] h-[18px] text-amber-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-semibold">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-gray-800 dark:text-white wrap-break-word">
          {value}
        </p>
      </div>
    </div>
  );
}

// -- Main Page --

export default function ProviderDetailsPage() {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const { data, isLoading, isError } = useProviderDetails(id);

  const photoGalleryRef = useRef<PhotoGalleryRef>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [headerVisible, setHeaderVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setHeaderVisible(el.scrollTop > 220);
  }, []);
  const [sheetOpened, setSheetOpened] = useState(false);
  const [callSheetOpened, setCallSheetOpened] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { requireAuth } = useAuthGate();
  const { setUserMode } = useAppContext();
  const { data: savedData } = useIsSaved(id, "provider");
  const toggleSaved = useToggleSaved();
  const liked = savedData?.saved ?? false;
  const { mutate: createConversation, isPending: isCreatingChat } =
    useCreateConversation();
  const { mutate: submitReviewMutation, isPending: isSubmittingReview } =
    useSubmitReview();

  const handleToggleSaved = () => {
    requireAuth(() => {
      if (!liked) trackSave();
      toggleSaved.mutate({ itemId: id, itemType: "provider" });
    });
  };

  const provider = data?.provider ?? null;
  const isOwnProvider = Boolean(
    user && provider && user.id === provider.userId,
  );

  // Close call sheet if user logs in as this provider (guest → own-provider transition)
  useEffect(() => {
    if (isOwnProvider) setCallSheetOpened(false);
  }, [isOwnProvider]);

  // ─── Analytics Tracking ─────────────────────────────────────────
  const source = (searchParams.get("src") as any) || "direct";
  useTrackProviderView(isOwnProvider ? undefined : id, source);
  const {
    trackChat,
    trackCall,
    trackDirection,
    trackShare,
    trackSave,
    trackTabSwitch,
  } = useTrackAction(isOwnProvider ? undefined : id);
  const stats = data?.stats ?? (provider ? EMPTY_STATS : null);
  const photos = (data?.photos?.length ?? 0) > 0 ? data!.photos : [];
  const products = (data?.products?.length ?? 0) > 0 ? data!.products : [];
  const reviews = (data?.reviews?.length ?? 0) > 0 ? data!.reviews : [];
  const categories = data?.categories ?? [];
  const badges = data?.badges ?? [];
  const activeOffers = data?.activeOffers ?? [];
  const isSponsored = data?.isSponsored ?? false;
  const sponsorEndsAt = data?.sponsorEndsAt ?? null;

  // Check if current user already reviewed this provider
  const hasAlreadyReviewed = useMemo(() => {
    if (!user || !reviews.length) return false;
    return reviews.some((r: any) => r.reviewerId === user.id);
  }, [user, reviews]);

  const galleryImages = useMemo(() => {
    const urls: string[] = [];
    if (provider?.bannerImageUrl) urls.push(provider.bannerImageUrl);
    if (provider?.profilePhotoUrl) urls.push(provider.profilePhotoUrl);
    photos.forEach((p) => {
      if (p.imageUrl && !urls.includes(p.imageUrl)) urls.push(p.imageUrl);
    });
    return urls;
  }, [provider?.bannerImageUrl, provider?.profilePhotoUrl, photos]);

  const galleryItems = useMemo(
    () =>
      galleryImages.map((src, i) => ({
        src,
        thumb: src,
        label: `Photo ${i + 1}`,
        alt: `Photo ${i + 1}`,
      })),
    [galleryImages],
  );

  const heroImage =
    provider?.bannerImageUrl ||
    provider?.profilePhotoUrl ||
    galleryImages[0] ||
    "";

  const priceLabel = useMemo(() => {
    if (!stats?.priceRange) return null;
    const { min, max, currency } = stats.priceRange;
    const symbol = currency === "INR" ? "₹" : currency + " ";
    if (min === max) return `${symbol}${min.toLocaleString()}`;
    return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}`;
  }, [stats]);

  const categoryLabel = useMemo(() => {
    const names = categories.map((c) => c.name).filter(Boolean);
    if (names.length === 0)
      return provider?.description?.split(".")[0] || "Services";
    if (names.length <= 2) return names.join(" · ");
    return `${names.slice(0, 2).join(" · ")} +${names.length - 2}`;
  }, [categories, provider?.description]);

  const hours = provider
    ? `${provider.openTime?.slice(0, 5) || "09:00"} – ${
        provider.closeTime?.slice(0, 5) || "21:00"
      }`
    : "";

  useEffect(() => {
    const interval = setInterval(() => {
      if (photoGalleryRef.current) {
        const isOpen = photoGalleryRef.current.isLightboxOpen();
        if (isOpen !== isLightboxOpen) setIsLightboxOpen(isOpen);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isLightboxOpen]);

  const handleShare = async () => {
    if (!provider) return;
    trackShare();
    await shareProvider({
      id: provider.id,
      brandName: provider.brandName,
      description: provider.description,
      categoryLabel,
      rating: stats?.rating ?? 0,
    });
  };

  // -- Loading --
  if (isLoading) {
    return (
      <Page className="bg-white dark:bg-slate-900">
        <div className="animate-pulse">
          <div className="h-72 bg-slate-200 dark:bg-slate-700" />
          <div className="p-5 space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-150 dark:bg-slate-700 rounded-lg w-1/2" />
            <div className="flex gap-3 mt-4">
              <div className="h-20 flex-1 bg-slate-150 dark:bg-slate-700 rounded-2xl" />
              <div className="h-20 flex-1 bg-slate-150 dark:bg-slate-700 rounded-2xl" />
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // -- Error --
  if (isError || !provider) {
    return (
      <Page className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-400 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 text-center">
          We couldn&apos;t load this provider. Please try again.
        </p>
        <button
          onClick={() => goBack("/")}
          className="w-9 h-9 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <IonIcon
            icon={arrowBack}
            className="w-5 h-5 text-gray-700 dark:text-gray-300"
          />
        </button>
      </Page>
    );
  }

  const rating = stats?.rating ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;
  const ratingDist = stats?.ratingDist ?? [0, 0, 0, 0, 0];
  const owner = (provider as any)?.user;

  return (
    <Page
      className={`!bg-white dark:!bg-slate-900 ${
        isSponsored ? "sponsored-provider" : ""
      }`}
    >
      {/* Scroll-aware app bar */}
      <AnimatePresence>
        {headerVisible && (
          <motion.div
            key="scroll-header"
            initial={{ opacity: 0, y: -52 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -52 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-0 inset-x-0 z-50 bg-white/92 dark:bg-slate-900/92 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60"
            style={{ paddingTop: "var(--sat, 0px)" }}
          >
            <div className="flex items-center gap-3 px-4 h-14">
              <button
                onClick={() => goBack("/search")}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
              >
                <IonIcon
                  icon={arrowBack}
                  className="w-5 h-5 text-slate-800 dark:text-white"
                />
              </button>
              <p className="flex-1 text-[15px] font-bold text-slate-900 dark:text-white truncate">
                {provider.brandName}
              </p>
              <div className="flex gap-2 shrink-0">
                {!isOwnProvider && (
                  <button
                    onClick={handleToggleSaved}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                  >
                    <IonIcon
                      icon={liked ? bookmark : bookmarkOutline}
                      className={`w-5 h-5 ${
                        liked
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    />
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                >
                  <IonIcon
                    icon={shareSocial}
                    className="w-5 h-5 text-slate-600 dark:text-slate-300"
                  />
                </button>
                {!isOwnProvider && (
                  <button
                    onClick={() => requireAuth(() => setReportSheetOpen(true))}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                  >
                    <IonIcon
                      icon={flagOutline}
                      className="w-5 h-5 text-slate-600 dark:text-slate-300"
                    />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain"
      >
        {/* Hero */}
        <div
          className="relative"
          style={{ display: isLightboxOpen ? "none" : "block" }}
        >
          <div
            className={`relative h-72 overflow-hidden ${
              isSponsored ? "h-80" : ""
            } bg-gradient-to-br from-slate-200 to-slate-100`}
          >
            {heroImage ? (
              <img
                src={heroImage}
                alt={provider.brandName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl font-bold text-slate-300">
                  {provider.brandName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div
              className={`absolute inset-0 ${
                isSponsored
                  ? "bg-gradient-to-t from-black/70 via-black/20 to-amber-900/10"
                  : "bg-gradient-to-t from-black/60 via-black/10 to-transparent"
              }`}
            />

            {/* Sponsored Premium Banner — inside hero, clears status bar */}
            {isSponsored && (
              <div
                className="absolute top-0 inset-x-0 flex items-center justify-center gap-2 z-20 bg-gradient-to-r from-amber-500/90 via-amber-400/90 to-yellow-400/90 backdrop-blur-sm"
                style={{
                  paddingTop: "calc(var(--sat,0px) + 6px)",
                  paddingBottom: "6px",
                }}
              >
                <IonIcon
                  icon={shieldCheckmark}
                  className="w-4 h-4 text-white"
                />
                <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                  Featured Business
                </span>
                <span className="text-[9px] text-white/80 font-medium">
                  • Premium Partner
                </span>
              </div>
            )}

            {/* Top Actions */}
            <div
              className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pb-3"
              style={{
                paddingTop: isSponsored
                  ? "calc(var(--sat,0px) + 46px)"
                  : "calc(var(--sat,0px) + 12px)",
              }}
            >
              <button
                onClick={() => goBack("/search")}
                className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
              </button>
              <div className="flex gap-2">
                {!isOwnProvider && (
                  <button
                    onClick={handleToggleSaved}
                    className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <IonIcon
                      icon={liked ? bookmark : bookmarkOutline}
                      className={`w-5 h-5 ${
                        liked ? "text-yellow-500" : "text-white"
                      }`}
                    />
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
                >
                  <IonIcon icon={shareSocial} className="w-5 h-5 text-white" />
                </button>
                {!isOwnProvider && (
                  <button
                    onClick={() => requireAuth(() => setReportSheetOpen(true))}
                    className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <IonIcon
                      icon={flagOutline}
                      className="w-5 h-5 text-white"
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Photo Count */}
            {galleryImages.length > 0 && (
              <button
                onClick={() => setActiveTab("Photos")}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                <IonIcon icon={imagesOutline} className="w-3.5 h-3.5" />
                {galleryImages.length} Photos
              </button>
            )}

            {/* Provider Name */}
            <div className="absolute bottom-4 left-4 right-20">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white leading-tight wrap-break-word min-w-0">
                  {provider.brandName}
                </h1>
                {provider.status === "active" && (
                  <IonIcon
                    icon={checkmarkCircle}
                    className="w-5 h-5 text-blue-400 shrink-0"
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white/80 text-sm truncate">
                  {categoryLabel}
                </p>
                {isSponsored && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-linear-to-r from-amber-400 to-yellow-300 text-amber-900 shadow-sm shrink-0">
                    ⭐ Premium
                  </span>
                )}
                {badges.length > 0 &&
                  badges.slice(0, 3).map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white"
                    >
                      {b.type === "gold_seller"
                        ? "🥇"
                        : b.type === "top_rated"
                        ? "⭐"
                        : b.type === "trusted"
                        ? "🛡️"
                        : b.type === "express_service"
                        ? "⚡"
                        : "🌟"}
                      {b.type.replace(/_/g, " ")}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div
            className={`flex items-center justify-between px-5 py-3 border-b ${
              isSponsored
                ? "bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-800 border-amber-100/80 dark:border-amber-900/40"
                : "bg-white dark:bg-slate-800 border-gray-100/80 dark:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {reviewCount > 0 ? (
                <>
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 20 20"
                    fill="#FBBF24"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    ({reviewCount})
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-indigo-600">
                  New
                </span>
              )}
            </div>
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
            <span className="text-sm font-semibold text-amber-600">
              {priceLabel || "Contact for price"}
            </span>
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
              <IonIcon icon={locationOutline} className="w-3.5 h-3.5" />
              <span className="text-xs truncate max-w-[100px]">
                {provider.city}
                {provider.area ? `, ${provider.area}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Bar — direct child of scroll container so sticky works across full scroll height */}
        <div
          className={`sticky z-40 border-b overflow-x-auto no-scrollbar backdrop-blur-md transition-[top] duration-200 shadow-sm ${
            headerVisible ? "top-14" : "top-0"
          } ${
            isSponsored
              ? "bg-amber-50/95 dark:bg-slate-900/95 border-amber-100/60 dark:border-slate-700/80"
              : "bg-white/95 dark:bg-slate-900/95 border-gray-100/80 dark:border-slate-700/80"
          }`}
        >
          <div className="flex px-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  trackTabSwitch(tab);
                }}
                className={`relative flex-1 min-w-0 px-3 py-3 text-[13px] font-semibold text-center whitespace-nowrap transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-amber-600"
                    : "text-gray-400 dark:text-slate-500"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span
                    className={`absolute bottom-0 left-1/4 right-1/4 h-[2.5px] rounded-full ${
                      isSponsored
                        ? "bg-linear-to-r from-amber-500 to-yellow-400"
                        : "bg-amber-500"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* === OVERVIEW === */}
        {activeTab === "Overview" && (
          <div className="px-5 pt-5 pb-28 space-y-5">
            {/* Premium Trust Banner — Sponsored Only */}
            {isSponsored && (
              <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-amber-950/30 dark:via-slate-800 dark:to-yellow-950/20 p-4 shadow-[0_2px_12px_rgba(245,158,11,0.1)]">
                {/* Decorative sparkle */}
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-400/10 rounded-full blur-xl" />
                <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-yellow-400/10 rounded-full blur-lg" />

                <div className="flex items-start gap-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md">
                    <IonIcon
                      icon={shieldCheckmark}
                      className="w-5 h-5 text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">
                      Premium Verified Business
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      This business has been verified and is a featured partner
                      on our platform. Premium businesses go through additional
                      quality checks.
                    </p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Identity Verified
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Quality Assured
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery Preview */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
                {galleryImages.slice(0, 3).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab("Photos")}
                    className={`relative aspect-square overflow-hidden active:opacity-80 transition-opacity ${
                      i === 0 ? "col-span-2 row-span-2" : ""
                    }`}
                  >
                    {img && (
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {i === 2 && galleryImages.length > 3 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          +{galleryImages.length - 3}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Info Chips */}
            <div className="grid grid-cols-2 gap-2.5">
              <InfoChip
                icon={ribbonOutline}
                label="Products"
                value={`${stats?.productCount ?? 0}`}
              />
              <InfoChip icon={time} label="Hours" value={hours} />
              <InfoChip
                icon={storefrontOutline}
                label="Status"
                value={provider.isAvailable ? "Open Now" : "Closed"}
              />
              <InfoChip
                icon={shieldCheckmark}
                label="Verified"
                value={provider.status === "active" ? "Verified" : "Pending"}
              />
            </div>

            {/* Active Offers */}
            {activeOffers.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-100/80 dark:border-amber-800/40">
                <div className="flex items-center gap-2 mb-3">
                  <IonIcon icon={pricetag} className="w-4 h-4 text-amber-600" />
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                    Active Deals
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {activeOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm dark:shadow-none"
                    >
                      {offer.discountValue && (
                        <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {offer.discountType === "percentage"
                              ? `${Number(offer.discountValue)}%`
                              : `₹${Number(offer.discountValue)}`}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                          {offer.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {offer.description}
                        </p>
                      </div>
                      <span className="text-[10px] text-amber-600 font-semibold whitespace-nowrap">
                        Ends{" "}
                        {new Date(offer.endsAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">
                About
              </h3>
              <p className="text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed">
                {provider.description || "No description provided yet."}
              </p>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-3">
                  Services ({categories.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span
                      key={c.id}
                      className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[12px] font-medium"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Address */}
            {provider.address && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">
                  Location
                </h3>

                {user ? (
                  /* Logged-in: show full address + directions */
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <IonIcon
                          icon={locationOutline}
                          className="w-[18px] h-[18px] text-gray-500 dark:text-slate-400"
                        />
                      </div>
                      <p className="text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed flex-1">
                        {provider.address}
                        {provider.city ? `, ${provider.city}` : ""}
                        {provider.pincode ? ` - ${provider.pincode}` : ""}
                      </p>
                    </div>
                    {provider.latitude && provider.longitude && (
                      <button
                        onClick={() => {
                          trackDirection();
                          openDirections(
                            Number(provider.latitude),
                            Number(provider.longitude),
                            provider.brandName,
                          );
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[13px] font-semibold active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
                      >
                        <IonIcon icon={navigateOutline} className="w-4 h-4" />
                        Get Directions
                      </button>
                    )}
                  </>
                ) : (
                  /* Guest: blurred lock overlay */
                  <button
                    onClick={() => requireAuth()}
                    className="w-full relative rounded-xl overflow-hidden"
                  >
                    {/* Blurred address text behind */}
                    <div
                      className="flex items-start gap-3 select-none pointer-events-none"
                      aria-hidden
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <IonIcon
                          icon={locationOutline}
                          className="w-[18px] h-[18px] text-gray-400 dark:text-slate-500"
                        />
                      </div>
                      <p className="text-[13px] text-gray-400 dark:text-slate-500 leading-relaxed flex-1 blur-[5px]">
                        {provider.address}
                        {provider.city ? `, ${provider.city}` : ""}
                        {provider.pincode ? ` - ${provider.pincode}` : ""}
                      </p>
                    </div>
                    {/* Frosted overlay */}
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/80 backdrop-blur-[2px] rounded-xl flex items-center justify-center gap-2.5">
                      <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-full shadow-lg">
                        <IonIcon icon={lockClosedOutline} className="text-sm" />
                        <span className="text-[12px] font-bold">
                          Sign in to see location
                        </span>
                        <IonIcon
                          icon={logInOutline}
                          className="text-sm text-amber-400"
                        />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Invite Friends */}
            <button
              onClick={() => router.push("/invite")}
              className="w-full flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-100/80 dark:border-amber-800/40 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
                <IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                  Know someone who&apos;d love this?
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Invite friends to discover local businesses
                </p>
              </div>
              <IonIcon icon={shareSocial} className="w-4 h-4 text-amber-500" />
            </button>

            {/* Business Owner */}
            {owner && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-3">
                  Business Contact
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {initialsOf(owner.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {owner.name}
                    </h4>
                    {user ? (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {owner.mobileNumber}
                      </p>
                    ) : (
                      <button
                        onClick={() => requireAuth(() => {})}
                        className="flex items-center gap-1 mt-0.5"
                      >
                        <p className="text-xs text-gray-400 blur-[4px] select-none pointer-events-none">
                          +91 98765 43210
                        </p>
                        <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5 ml-1">
                          <IonIcon icon={logInOutline} className="text-xs" />
                          Sign in
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === REVIEWS === */}
        {activeTab === "Reviews" && (
          <div className="px-5 pt-5 pb-28 space-y-4">
            {/* Rating Summary */}
            {reviewCount > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
                <div className="flex gap-5">
                  <div className="flex flex-col items-center justify-center pr-5 border-r border-gray-100 dark:border-slate-700">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white leading-none">
                      {rating.toFixed(1)}
                    </span>
                    <StarRow rating={Math.round(rating)} size={13} />
                    <span className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 font-medium">
                      {reviewCount} reviews
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5 justify-center">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <RatingBar
                        key={s}
                        starCount={s}
                        count={ratingDist[s - 1] ?? 0}
                        total={reviewCount}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100/80 dark:border-slate-700 text-center">
                <p className="text-lg font-bold text-indigo-600 mb-1">
                  New Provider
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  No ratings yet — be the first to review!
                </p>
              </div>
            )}

            {/* Write Review — before the list */}
            {!isOwnProvider && !hasAlreadyReviewed && (
              <button
                onClick={() =>
                  requireAuth(() => {
                    setReviewError("");
                    setReviewSuccess(false);
                    setSheetOpened(true);
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-slate-800 border-2 border-dashed border-amber-300 dark:border-amber-700 text-amber-600 rounded-2xl text-sm font-semibold active:bg-amber-50 dark:active:bg-amber-900/20 transition-colors"
              >
                <IonIcon icon={star} className="w-4 h-4" />
                Write a Review
              </button>
            )}
            {!isOwnProvider && hasAlreadyReviewed && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 border border-green-100 dark:border-green-800/40 text-center">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  You&apos;ve reviewed this provider
                </p>
              </div>
            )}

            {/* Review Cards */}
            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100/80 dark:border-slate-700 text-center">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No reviews yet. Be the first to share your experience!
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                        {initialsOf(review.reviewer?.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                            {review.reviewer?.name || "Anonymous"}
                          </span>
                          <IonIcon
                            icon={checkmarkCircle}
                            className="w-3.5 h-3.5 text-blue-500"
                          />
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {formatRelative(review.postedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRow rating={review.starRating} size={12} />
                      {user && user.id !== review.reviewerId && (
                        <button
                          onClick={() => requireAuth(() => setReportSheetOpen(true))}
                          className="w-7 h-7 rounded-full flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                        >
                          <IonIcon icon={flagOutline} className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  {review.reviewText && (
                    <p className="text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed mb-3">
                      {review.reviewText}
                    </p>
                  )}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex gap-1.5 mb-3">
                      {review.photos
                        .slice(0, 3)
                        .map((p: any) =>
                          p.imageUrl ? (
                            <img
                              key={p.id}
                              src={p.imageUrl}
                              alt=""
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                          ) : null,
                        )}
                    </div>
                  )}
                </div>
              ))
            )}

            {!isOwnProvider && hasAlreadyReviewed && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-800/40 text-center">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  You&apos;ve reviewed this provider
                </p>
              </div>
            )}
          </div>
        )}

        {/* === PRODUCTS === */}
        {activeTab === "Products" && (
          <div className="px-5 pt-5 pb-28">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </h3>
            </div>
            {products.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100/80 dark:border-slate-700 text-center">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  This provider hasn&apos;t added any products yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hero products — featured full-width cards */}
                {[...products].filter(p => p.isHero).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">✦ Featured</p>
                    {[...products].filter(p => p.isHero).map((product) => {
                      const currencySymbol = product.currency === "INR" ? "₹" : product.currency + " ";
                      return (
                        <Link key={product.id} href={`${ROUTE_PATH.PRODUCT_DETAILS}?id=${product.id}`}>
                          <div className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-violet-200/80 dark:border-violet-800/40 shadow-[0_2px_16px_rgba(139,92,246,0.08)] dark:shadow-none active:scale-[0.98] transition-transform mb-3">
                            <div className="flex">
                              <div className="relative w-[120px] h-[120px] shrink-0 overflow-hidden bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20">
                                {product.photoUrl ? (
                                  <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <IonIcon icon={imagesOutline} className="w-8 h-8 text-violet-300 dark:text-violet-600" />
                                  </div>
                                )}
                                <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[8px] font-bold">
                                  ✦ PICK
                                </span>
                              </div>
                              <div className="flex-1 p-3.5 flex flex-col justify-center min-w-0">
                                <h4 className="text-[14px] font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                  {product.name}
                                </h4>
                                {product.description && (
                                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2 line-clamp-2">
                                    {product.description}
                                  </p>
                                )}
                                <span className="text-[16px] font-extrabold text-violet-600 dark:text-violet-400">
                                  {product.price !== null
                                    ? `${currencySymbol}${Number(product.price).toLocaleString()}`
                                    : "Enquire"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Regular products — 2-col grid */}
                {[...products].filter(p => !p.isHero).length > 0 && (
                  <div>
                    {[...products].filter(p => p.isHero).length > 0 && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">All Products</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {[...products].filter(p => !p.isHero).map((product) => {
                        const currencySymbol = product.currency === "INR" ? "₹" : product.currency + " ";
                        return (
                          <Link key={product.id} href={`${ROUTE_PATH.PRODUCT_DETAILS}?id=${product.id}`}>
                            <div className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none active:scale-[0.98] transition-transform">
                              <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-slate-700">
                                {product.photoUrl ? (
                                  <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <IonIcon icon={imagesOutline} className="w-7 h-7 text-gray-200 dark:text-slate-600" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2.5">
                                <h4 className="text-[12px] font-semibold text-gray-900 dark:text-white mb-0.5 line-clamp-1">
                                  {product.name}
                                </h4>
                                <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                                  {product.price !== null
                                    ? `${currencySymbol}${Number(product.price).toLocaleString()}`
                                    : "Enquire"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === PHOTOS === */}
        {activeTab === "Photos" && (
          <div className="pt-2 pb-28">
            {galleryImages.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 mx-5 rounded-2xl p-8 border border-gray-100/80 dark:border-slate-700 text-center mt-4">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No photos uploaded yet.
                </p>
              </div>
            ) : (
              <PhotoGallary ref={photoGalleryRef} images={galleryItems} />
            )}
          </div>
        )}

        {/* Floating CTA */}
        <div
          className="fixed bottom-0 inset-x-0 z-30 pt-3 px-5"
          style={{
            paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 12px)",
            background:
              "linear-gradient(to top, var(--cta-bg-from, rgba(249,250,251,1)) 60%, var(--cta-bg-to, rgba(249,250,251,0)))",
            display: isLightboxOpen ? "none" : "block",
          }}
        >
          {isOwnProvider ? (
            /* Owner mode — manage business banner */
            <div className="rounded-2xl overflow-hidden border border-violet-200 bg-violet-50 shadow-md shadow-violet-100">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-violet-100">
                <div className="w-7 h-7 rounded-full bg-violet-600 grid place-content-center shrink-0">
                  <IonIcon
                    icon={storefrontOutline}
                    className="text-white text-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wide">
                    Your Business
                  </p>
                  <p className="text-[10px] text-violet-500 truncate">
                    You&apos;re viewing your own provider profile
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-100 px-2 py-0.5 rounded-full">
                  <IonIcon icon={eyeOutline} className="text-xs" />
                  Preview mode
                </span>
              </div>
              <div className="flex gap-2.5 px-4 py-3">
                <button
                  onClick={() => {
                    setUserMode("provider");
                    router.push("/");
                  }}
                  className="flex flex-1 items-center justify-center gap-2 h-11 rounded-xl bg-violet-600 text-white font-bold text-sm active:scale-[0.97] transition-all shadow-sm shadow-violet-300"
                >
                  <IonIcon icon={createOutline} className="text-base" />
                  Manage Business
                </button>
              </div>
            </div>
          ) : (
            /* Customer mode — message & call */
            <div className="flex gap-3">
              <button
                disabled={isCreatingChat}
                onClick={() => {
                  requireAuth(() => {
                    if (!provider?.id) return;
                    // Re-check after auth — user may have logged in as this provider
                    const currentUser = store.getState().auth.user;
                    if (currentUser && currentUser.id === provider.userId) return;
                    trackChat();
                    createConversation(
                      {
                        providerId: provider.id,
                        contextType: "provider",
                        contextId: provider.id,
                      },
                      {
                        onSuccess: (conv) => {
                          dispatch(openChat(conv.id));
                          router.push("/");
                        },
                        onError: (err: any) => {
                          const msg =
                            err?.response?.data?.message ||
                            err?.message ||
                            "Could not start conversation";
                          alert(Array.isArray(msg) ? msg.join(", ") : msg);
                        },
                      },
                    );
                  });
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50 ${
                  isSponsored
                    ? "bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 shadow-amber-100 dark:shadow-none"
                    : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200"
                }`}
              >
                <IonIcon
                  icon={chatbubbleOutline}
                  className="w-[18px] h-[18px]"
                />
                {isCreatingChat ? "Opening..." : "Message"}
              </button>

              {/* Call button — always visible, sheet handles auth for guests */}
              <button
                onClick={() => setCallSheetOpened(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white shadow-sm active:scale-[0.98] transition-transform ${
                  isSponsored
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 shadow-amber-200"
                    : "bg-amber-500 shadow-amber-200"
                }`}
              >
                <IonIcon icon={callOutline} className="w-[18px] h-[18px]" />
                Call Now
              </button>
            </div>
          )}
        </div>

        {/* Call Sheet */}
        <BottomSheet
          opened={callSheetOpened}
          onClose={() => setCallSheetOpened(false)}
        >
          <div className="relative px-5 pt-4 pb-8">
            {/* Gradient covering full sheet including the handle bar above */}
            <div className="absolute -top-16 inset-x-0 bottom-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pointer-events-none" />
            <div className="absolute -top-16 inset-x-0 bottom-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative">

              <div className="flex flex-col items-center gap-4">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <IonIcon icon={callOutline} className="text-3xl text-white" />
                </div>

                <div className="text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80 mb-1">
                    Call
                  </p>
                  <h3 className="text-xl font-bold text-white">
                    {provider?.brandName}
                  </h3>
                </div>

                {user ? (
                  /* Logged-in: real number */
                  <a
                    href={`tel:${provider?.contactNumber}`}
                    onClick={() => trackCall()}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/[0.07] border border-white/10 rounded-2xl active:bg-white/10 transition-colors"
                  >
                    <IonIcon icon={callOutline} className="text-base text-amber-400" />
                    <span className="text-base font-semibold text-white tracking-wide">
                      {provider?.contactNumber || "Not available"}
                    </span>
                  </a>
                ) : (
                  /* Guest: blurred number + sign-in prompt */
                  <div className="w-full relative">
                    <div
                      className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/[0.07] border border-white/10 rounded-2xl select-none pointer-events-none"
                      aria-hidden
                    >
                      <IonIcon icon={callOutline} className="text-base text-amber-400/50" />
                      <span className="text-base font-semibold text-white/40 tracking-[0.2em] blur-[6px]">
                        +91 98765 43210
                      </span>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-white/10 border border-white/15 text-white px-4 py-2 rounded-full">
                        <IonIcon icon={lockClosedOutline} className="text-sm text-amber-400" />
                        <span className="text-[12px] font-bold">Sign in to see number</span>
                        <IonIcon icon={logInOutline} className="text-sm text-amber-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCallSheetOpened(false)}
                  className="flex-1 py-3 bg-white/[0.07] border border-white/10 text-white/70 rounded-2xl text-sm font-semibold active:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                {user ? (
                  <a
                    href={`tel:${provider?.contactNumber}`}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-2xl text-sm font-semibold text-center shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-all"
                  >
                    Call Now
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setCallSheetOpened(false);
                      requireAuth();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <IonIcon icon={logInOutline} className="text-base" />
                    Sign in to Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </BottomSheet>

        {/* Review Sheet */}
        <BottomSheet opened={sheetOpened} onClose={() => setSheetOpened(false)}>
          <div className="px-5 pt-5 pb-8">
            <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              Write a Review
            </h3>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className="active:scale-110 transition-transform"
                >
                  <svg
                    width={36}
                    height={36}
                    viewBox="0 0 20 20"
                    fill={s <= reviewRating ? "#FBBF24" : "#E5E7EB"}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              className="w-full h-28 px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              placeholder="Share your experience with this provider..."
              value={reviewComment}
              onChange={(e) => {
                setReviewComment(e.target.value);
                setReviewError("");
              }}
            />
            {reviewError && (
              <p className="text-xs text-red-500 mt-2 px-1">{reviewError}</p>
            )}
            {reviewSuccess && (
              <p className="text-xs text-green-600 mt-2 px-1">
                Review submitted successfully!
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setSheetOpened(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-2xl text-sm font-semibold active:bg-gray-200 dark:active:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!reviewComment.trim() || isSubmittingReview}
                onClick={() => {
                  setReviewError("");
                  // Frontend profanity check
                  const contentCheck = checkContent(reviewComment);
                  if (contentCheck.flagged) {
                    setReviewError(
                      "Your review contains inappropriate language. Please revise and try again.",
                    );
                    return;
                  }
                  submitReviewMutation(
                    {
                      providerId: id,
                      starRating: reviewRating,
                      reviewText: reviewComment.trim(),
                    },
                    {
                      onSuccess: () => {
                        setReviewComment("");
                        setReviewRating(5);
                        setSheetOpened(false);
                      },
                      onError: (err: any) => {
                        const msg =
                          err?.response?.data?.message ||
                          err?.message ||
                          "Failed to submit review";
                        setReviewError(
                          Array.isArray(msg) ? msg.join(", ") : msg,
                        );
                      },
                    },
                  );
                }}
                className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-sm shadow-amber-200"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Report Sheet */}
      </div>
      {/* end scroll wrapper */}
      {id && (
        <ReportSheet
          entityType="provider"
          entityId={id}
          isOpen={reportSheetOpen}
          onClose={() => setReportSheetOpen(false)}
        />
      )}
    </Page>
  );
}
