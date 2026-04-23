"use client";
import { Page, Sheet } from "konsta/react";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
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
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";
import PhotoGallary, { PhotoGalleryRef } from "../components/photo-gallery";
import { useProviderDetails } from "@/hooks/useProvider";
import { useIsSaved, useToggleSaved } from "@/hooks/useSavedItems";
import { useCreateConversation } from "@/hooks/useChat";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { openChat } from "@/store/slices/chatSlice";
import { useAppContext } from "../context/AppContext";
import { openDirections } from "@/utils/sharing";

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
  if (day < 365) return `${Math.floor(day / 30)} month${day >= 60 ? "s" : ""} ago`;
  return `${Math.floor(day / 365)} year${day >= 730 ? "s" : ""} ago`;
}

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-[1px]">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill={s <= rating ? "#FBBF24" : "#E5E7EB"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({ starCount, count, total }: { starCount: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-gray-500 font-medium">{starCount}</span>
      <svg width={10} height={10} viewBox="0 0 20 20" fill="#FBBF24">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
      </svg>
      <div className="flex-1 h-[6px] bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-gray-400">{count}</span>
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
        <IonIcon icon={icon} className="w-[18px] h-[18px] text-amber-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
        <p className="text-[13px] font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

// -- Main Page --

export default function ProviderDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const { data, isLoading, isError } = useProviderDetails(id);

  const photoGalleryRef = useRef<PhotoGalleryRef>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [sheetOpened, setSheetOpened] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { setUserMode } = useAppContext();
  const { data: savedData } = useIsSaved(id, "provider");
  const toggleSaved = useToggleSaved();
  const liked = savedData?.saved ?? false;
  const { mutate: createConversation, isPending: isCreatingChat } = useCreateConversation();

  const handleToggleSaved = () => {
    if (!user) return; // Only allow for logged-in users
    toggleSaved.mutate({ itemId: id, itemType: "provider" });
  };

  const provider = data?.provider ?? null;
  const isOwnProvider = Boolean(user && provider && user.id === provider.userId);
  const stats = data?.stats ?? (provider ? EMPTY_STATS : null);
  const photos = (data?.photos?.length ?? 0) > 0 ? data!.photos : [];
  const products = (data?.products?.length ?? 0) > 0 ? data!.products : [];
  const reviews = (data?.reviews?.length ?? 0) > 0 ? data!.reviews : [];
  const categories = data?.categories ?? [];
  const badges = data?.badges ?? [];
  const activeOffers = data?.activeOffers ?? [];

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
    if (names.length === 0) return provider?.description?.split(".")[0] || "Services";
    if (names.length <= 2) return names.join(" · ");
    return `${names.slice(0, 2).join(" · ")} +${names.length - 2}`;
  }, [categories, provider?.description]);

  const hours = provider
    ? `${provider.openTime?.slice(0, 5) || "09:00"} – ${provider.closeTime?.slice(0, 5) || "21:00"}`
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
    const shareData = {
      title: provider.brandName,
      text: `Check out ${provider.brandName} – ${categoryLabel}\n⭐ ${stats?.rating ?? 0}\n${provider.description || ""}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    } catch {}
  };

  // -- Loading --
  if (isLoading) {
    return (
      <Page className="bg-gray-50">
        <div className="animate-pulse">
          <div className="h-72 bg-gray-200" />
          <div className="p-5 space-y-4">
            <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
            <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
            <div className="flex gap-3 mt-4">
              <div className="h-20 flex-1 bg-gray-200 rounded-2xl" />
              <div className="h-20 flex-1 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // -- Error --
  if (isError || !provider) {
    return (
      <Page className="flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Something went wrong</h3>
        <p className="text-sm text-gray-500 mb-6 text-center">We couldn&apos;t load this provider. Please try again.</p>
        <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition-transform">
          <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-700" />
        </button>
      </Page>
    );
  }

  const rating = stats?.rating ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;
  const ratingDist = stats?.ratingDist ?? [0, 0, 0, 0, 0];
  const owner = (provider as any)?.user;

  return (
    <Page className="!bg-gray-50/80">
      {/* Hero */}
      <div className="relative" style={{ display: isLightboxOpen ? "none" : "block" }}>
        <div className="relative h-72 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-100">
          {heroImage ? (
            <img src={heroImage} alt={provider.brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-bold text-slate-300">{provider.brandName?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Top Actions */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
            <button onClick={() => router.back()} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
              <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              {!isOwnProvider && (
                <button onClick={handleToggleSaved} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                  <IonIcon icon={liked ? heart : heartOutline} className={`w-5 h-5 ${liked ? "text-red-400" : "text-white"}`} />
                </button>
              )}
              <button onClick={handleShare} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                <IonIcon icon={shareSocial} className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Photo Count */}
          {galleryImages.length > 0 && (
            <button onClick={() => setActiveTab("Photos")} className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full active:scale-95 transition-transform">
              <IonIcon icon={imagesOutline} className="w-3.5 h-3.5" />
              {galleryImages.length} Photos
            </button>
          )}

          {/* Provider Name */}
          <div className="absolute bottom-4 left-4 right-20">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white leading-tight truncate">{provider.brandName}</h1>
              {provider.status === "active" && <IonIcon icon={checkmarkCircle} className="w-5 h-5 text-blue-400 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-white/80 text-sm truncate">{categoryLabel}</p>
              {badges.length > 0 && badges.slice(0, 3).map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white">
                  {b.type === "gold_seller" ? "🥇" : b.type === "top_rated" ? "⭐" : b.type === "trusted" ? "🛡️" : b.type === "express_service" ? "⚡" : "🌟"}
                  {b.type.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between bg-white px-5 py-3 border-b border-gray-100/80">
          <div className="flex items-center gap-1.5">
            {reviewCount > 0 ? (
              <>
                <svg width={16} height={16} viewBox="0 0 20 20" fill="#FBBF24">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
                <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({reviewCount})</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-indigo-600">New</span>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <span className="text-sm font-semibold text-amber-600">{priceLabel || "Contact for price"}</span>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1 text-gray-500">
            <IonIcon icon={locationOutline} className="w-3.5 h-3.5" />
            <span className="text-xs truncate max-w-[100px]">{provider.city}{provider.area ? `, ${provider.area}` : ""}</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="bg-white border-b border-gray-100/80 overflow-x-auto no-scrollbar">
          <div className="flex px-1">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`relative flex-1 min-w-0 px-3 py-3 text-[13px] font-semibold text-center whitespace-nowrap transition-colors duration-200 ${activeTab === tab ? "text-amber-600" : "text-gray-400"}`}>
                {tab}
                {activeTab === tab && <span className="absolute bottom-0 left-1/4 right-1/4 h-[2.5px] bg-amber-500 rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === OVERVIEW === */}
      {activeTab === "Overview" && (
        <div className="px-5 pt-5 pb-28 space-y-5">
          {/* Gallery Preview */}
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
              {galleryImages.slice(0, 3).map((img, i) => (
                <button key={i} onClick={() => setActiveTab("Photos")} className={`relative aspect-square overflow-hidden active:opacity-80 transition-opacity ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {i === 2 && galleryImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">+{galleryImages.length - 3}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Info Chips */}
          <div className="grid grid-cols-2 gap-2.5">
            <InfoChip icon={ribbonOutline} label="Products" value={`${stats?.productCount ?? 0}`} />
            <InfoChip icon={time} label="Hours" value={hours} />
            <InfoChip icon={storefrontOutline} label="Status" value={provider.isAvailable ? "Open Now" : "Closed"} />
            <InfoChip icon={shieldCheckmark} label="Verified" value={provider.status === "active" ? "Verified" : "Pending"} />
          </div>

          {/* Active Offers */}
          {activeOffers.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100/80">
              <div className="flex items-center gap-2 mb-3">
                <IonIcon icon={pricetag} className="w-4 h-4 text-amber-600" />
                <h3 className="text-[15px] font-bold text-gray-900">Active Deals</h3>
              </div>
              <div className="space-y-2.5">
                {activeOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                    {offer.discountValue && (
                      <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {offer.discountType === "percentage" ? `${Number(offer.discountValue)}%` : `₹${Number(offer.discountValue)}`}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{offer.title}</p>
                      <p className="text-[11px] text-gray-500 truncate">{offer.description}</p>
                    </div>
                    <span className="text-[10px] text-amber-600 font-semibold whitespace-nowrap">
                      Ends {new Date(offer.endsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">About</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">{provider.description || "No description provided yet."}</p>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Services ({categories.length})</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c.id} className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[12px] font-medium">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Address */}
          {provider.address && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Location</h3>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IonIcon icon={locationOutline} className="w-[18px] h-[18px] text-gray-500" />
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed flex-1">{provider.address}{provider.city ? `, ${provider.city}` : ""}{provider.pincode ? ` - ${provider.pincode}` : ""}</p>
              </div>
              {provider.latitude && provider.longitude && (
                <button
                  onClick={() => openDirections(Number(provider.latitude), Number(provider.longitude), provider.brandName)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[13px] font-semibold active:bg-blue-100 transition-colors"
                >
                  <IonIcon icon={navigateOutline} className="w-4 h-4" />
                  Get Directions
                </button>
              )}
            </div>
          )}

          {/* Invite Friends */}
          <button
            onClick={() => router.push("/invite")}
            className="w-full flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100/80 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-200">
              <IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-bold text-gray-900">Know someone who&apos;d love this?</p>
              <p className="text-[11px] text-gray-500">Invite friends to discover local businesses</p>
            </div>
            <IonIcon icon={shareSocial} className="w-4 h-4 text-amber-500" />
          </button>

          {/* Business Owner */}
          {owner && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Business Owner</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {initialsOf(owner.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{owner.name}</h4>
                  <p className="text-xs text-gray-500">{owner.mobileNumber}</p>
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
          <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex gap-5">
              <div className="flex flex-col items-center justify-center pr-5 border-r border-gray-100">
                <span className="text-4xl font-extrabold text-gray-900 leading-none">{rating.toFixed(1)}</span>
                <StarRow rating={Math.round(rating)} size={13} />
                <span className="text-[11px] text-gray-400 mt-1.5 font-medium">{reviewCount} reviews</span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 justify-center">
                {[5, 4, 3, 2, 1].map((s) => (
                  <RatingBar key={s} starCount={s} count={ratingDist[s - 1] ?? 0} total={reviewCount} />
                ))}
              </div>
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-gray-100/80 text-center">
              <p className="text-lg font-bold text-indigo-600 mb-1">New Provider</p>
              <p className="text-xs text-gray-400">No ratings yet — be the first to review!</p>
            </div>
          )}

          {/* Review Cards */}
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100/80 text-center">
              <p className="text-sm text-gray-500">No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">{initialsOf(review.reviewer?.name)}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-gray-900">{review.reviewer?.name || "Anonymous"}</span>
                        <IonIcon icon={checkmarkCircle} className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <span className="text-[11px] text-gray-400">{formatRelative(review.postedAt)}</span>
                    </div>
                  </div>
                  <StarRow rating={review.starRating} size={12} />
                </div>
                {review.reviewText && (
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{review.reviewText}</p>
                )}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-1.5 mb-3">
                    {review.photos.slice(0, 3).map((p: any) => (
                      <img key={p.id} src={p.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Write Review — hidden for own provider */}
          {!isOwnProvider && (
            <button onClick={() => setSheetOpened(true)} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-dashed border-amber-300 text-amber-600 rounded-2xl text-sm font-semibold active:bg-amber-50 transition-colors">
              <IonIcon icon={star} className="w-4 h-4" />
              Write a Review
            </button>
          )}
        </div>
      )}

      {/* === PRODUCTS === */}
      {activeTab === "Products" && (
        <div className="px-5 pt-5 pb-28">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-gray-900">{products.length} Products</h3>
          </div>
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100/80 text-center">
              <p className="text-sm text-gray-500">This provider hasn&apos;t added any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => {
                const currencySymbol = product.currency === "INR" ? "₹" : product.currency + " ";
                return (
                  <Link key={product.id} href={`${ROUTE_PATH.PRODUCT_DETAILS}?id=${product.id}`}>
                    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        {product.photoUrl ? (
                          <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <IonIcon icon={imagesOutline} className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-[13px] font-semibold text-gray-900 mb-0.5 line-clamp-1">{product.name}</h4>
                        <p className="text-[11px] text-gray-400 mb-2 line-clamp-1">{product.description || ""}</p>
                        <span className="text-[15px] font-bold text-amber-600">
                          {product.price !== null ? `${currencySymbol}${Number(product.price).toLocaleString()}` : "Enquire"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === PHOTOS === */}
      {activeTab === "Photos" && (
        <div className="pt-2 pb-28">
          {galleryImages.length === 0 ? (
            <div className="bg-white mx-5 rounded-2xl p-8 border border-gray-100/80 text-center mt-4">
              <p className="text-sm text-gray-500">No photos uploaded yet.</p>
            </div>
          ) : (
            <PhotoGallary ref={photoGalleryRef} images={galleryItems} />
          )}
        </div>
      )}

      {/* Floating CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 px-5" style={{ background: "linear-gradient(to top, rgba(249,250,251,1) 60%, rgba(249,250,251,0))", display: isLightboxOpen ? "none" : "block" }}>
        {isOwnProvider ? (
          /* Owner mode — manage business banner */
          <div className="rounded-2xl overflow-hidden border border-violet-200 bg-violet-50 shadow-md shadow-violet-100">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-violet-100">
              <div className="w-7 h-7 rounded-full bg-violet-600 grid place-content-center shrink-0">
                <IonIcon icon={storefrontOutline} className="text-white text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wide">Your Business</p>
                <p className="text-[10px] text-violet-500 truncate">You&apos;re viewing your own provider profile</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-100 px-2 py-0.5 rounded-full">
                <IonIcon icon={eyeOutline} className="text-xs" />
                Preview mode
              </span>
            </div>
            <div className="flex gap-2.5 px-4 py-3">
              <button
                onClick={() => { setUserMode('provider'); router.push('/'); }}
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
            <button disabled={isCreatingChat} onClick={() => {
              const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
              if (!token) { router.push('/auth/login'); return; }
              if (!provider?.id) return;
              createConversation({ providerId: provider.id, contextType: 'provider', contextId: provider.id }, {
                onSuccess: (conv) => {
                  dispatch(openChat(conv.id));
                  router.push('/');
                },
                onError: (err: any) => {
                  const msg = err?.response?.data?.message || err?.message || 'Could not start conversation';
                  alert(Array.isArray(msg) ? msg.join(', ') : msg);
                },
              });
            }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50">
              <IonIcon icon={chatbubbleOutline} className="w-[18px] h-[18px]" />
              {isCreatingChat ? 'Opening...' : 'Message'}
            </button>
            <button onClick={() => window.open(`tel:${provider.contactNumber}`)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 rounded-2xl text-sm font-semibold text-white shadow-sm shadow-amber-200 active:scale-[0.98] transition-transform">
              <IonIcon icon={callOutline} className="w-[18px] h-[18px]" />
              Call Now
            </button>
          </div>
        )}
      </div>

      {/* Review Sheet */}
      <Sheet opened={sheetOpened} onBackdropClick={() => setSheetOpened(false)} className="pb-safe !rounded-t-3xl">
        <div className="px-5 pt-5 pb-8">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <h3 className="text-lg font-bold text-gray-900 mb-5">Write a Review</h3>
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setReviewRating(s)} className="active:scale-110 transition-transform">
                <svg width={36} height={36} viewBox="0 0 20 20" fill={s <= reviewRating ? "#FBBF24" : "#E5E7EB"}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea className="w-full h-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" placeholder="Share your experience with this provider..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
          <div className="flex gap-3 mt-5">
            <button onClick={() => setSheetOpened(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-semibold active:bg-gray-200 transition-colors">Cancel</button>
            <button disabled={!reviewComment.trim()} onClick={() => { console.log("Submitting review:", { rating: reviewRating, comment: reviewComment }); setSheetOpened(false); setReviewRating(5); setReviewComment(""); }} className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-sm shadow-amber-200">Submit Review</button>
          </div>
        </div>
      </Sheet>
    </Page>
  );
}
