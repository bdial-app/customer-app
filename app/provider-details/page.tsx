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
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";
import PhotoGallary, { PhotoGalleryRef } from "../components/photo-gallery";
import { useProviderDetails } from "@/hooks/useProvider";
import { useIsSaved, useToggleSaved } from "@/hooks/useSavedItems";
import { useAppSelector } from "@/hooks/useAppStore";

const TABS = ["Overview", "Reviews", "Products", "Photos"] as const;
type Tab = (typeof TABS)[number];

// -- Static Fallback Data --
const STATIC_REVIEWS = [
  { id: "sr1", listingId: "", reviewerId: "", starRating: 5, reviewText: "Absolutely amazing service! The quality of work exceeded my expectations. Highly recommended for anyone looking for professional service.", status: "active", postedAt: new Date(Date.now() - 2 * 86400000).toISOString(), reviewer: { id: "u1", name: "Fatima Bohra" }, photos: [] },
  { id: "sr2", listingId: "", reviewerId: "", starRating: 4, reviewText: "Very good experience overall. Prompt delivery and great attention to detail. Will definitely come back again.", status: "active", postedAt: new Date(Date.now() - 5 * 86400000).toISOString(), reviewer: { id: "u2", name: "Ahmed Hussain" }, photos: [] },
  { id: "sr3", listingId: "", reviewerId: "", starRating: 5, reviewText: "Best in the area! Fair pricing and excellent craftsmanship. The owner is very friendly and accommodating.", status: "active", postedAt: new Date(Date.now() - 12 * 86400000).toISOString(), reviewer: { id: "u3", name: "Sakina Merchant" }, photos: [] },
  { id: "sr4", listingId: "", reviewerId: "", starRating: 4, reviewText: "Good quality work. Slightly delayed but the end result was worth the wait.", status: "active", postedAt: new Date(Date.now() - 20 * 86400000).toISOString(), reviewer: { id: "u4", name: "Murtaza Ali" }, photos: [] },
  { id: "sr5", listingId: "", reviewerId: "", starRating: 5, reviewText: "Outstanding! This is my go-to place now. Professional, reliable, and affordable.", status: "active", postedAt: new Date(Date.now() - 30 * 86400000).toISOString(), reviewer: { id: "u5", name: "Zahra Bhai" }, photos: [] },
];

const STATIC_PRODUCTS = [
  { id: "sp1", listingId: "", name: "Premium Package", description: "Our best-selling premium service package with full coverage", price: 1999, currency: "INR", photoUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", isActive: true, displayOrder: 1 },
  { id: "sp2", listingId: "", name: "Standard Service", description: "Quality service at an affordable price point", price: 999, currency: "INR", photoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", isActive: true, displayOrder: 2 },
  { id: "sp3", listingId: "", name: "Express Package", description: "Quick turnaround for urgent requirements", price: 1499, currency: "INR", photoUrl: "https://images.unsplash.com/photo-1556740758-90de940de450?w=400", isActive: true, displayOrder: 3 },
  { id: "sp4", listingId: "", name: "Economy Option", description: "Budget-friendly option without compromising quality", price: 499, currency: "INR", photoUrl: "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400", isActive: true, displayOrder: 4 },
];

const STATIC_PHOTOS = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
  "https://images.unsplash.com/photo-1556740758-90de940de450?w=600",
  "https://images.unsplash.com/photo-1555244162-803834f70033?w=600",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600",
];

const STATIC_STATS = {
  rating: 4.6,
  reviewCount: 47,
  ratingDist: [2, 3, 5, 12, 25],
  listingCount: 2,
  photoCount: 6,
  productCount: 4,
  priceRange: { min: 499, max: 1999, currency: "INR" },
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
  const { data: savedData } = useIsSaved(id, "provider");
  const toggleSaved = useToggleSaved();
  const liked = savedData?.saved ?? false;

  const handleToggleSaved = () => {
    if (!user) return; // Only allow for logged-in users
    toggleSaved.mutate({ itemId: id, itemType: "provider" });
  };

  const provider = data?.provider ?? null;
  const stats = data?.stats ?? (provider ? STATIC_STATS : null);
  const photos = (data?.photos?.length ?? 0) > 0 ? data!.photos : [];
  const products = (data?.products?.length ?? 0) > 0 ? data!.products : (provider ? STATIC_PRODUCTS as any[] : []);
  const reviews = (data?.reviews?.length ?? 0) > 0 ? data!.reviews : (provider ? STATIC_REVIEWS as any[] : []);
  const listings = data?.listings ?? [];

  const galleryImages = useMemo(() => {
    const urls: string[] = [];
    if (provider?.profilePhotoUrl) urls.push(provider.profilePhotoUrl);
    photos.forEach((p) => {
      if (p.imageUrl && !urls.includes(p.imageUrl)) urls.push(p.imageUrl);
    });
    // If no real photos, use static gallery
    if (urls.length === 0 && provider) {
      return STATIC_PHOTOS;
    }
    return urls;
  }, [provider?.profilePhotoUrl, photos, provider]);

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
    provider?.profilePhotoUrl ||
    galleryImages[0] ||
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800";

  const priceLabel = useMemo(() => {
    if (!stats?.priceRange) return null;
    const { min, max, currency } = stats.priceRange;
    const symbol = currency === "INR" ? "₹" : currency + " ";
    if (min === max) return `${symbol}${min.toLocaleString()}`;
    return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}`;
  }, [stats]);

  const categoryLabel = useMemo(() => {
    const names = Array.from(
      new Set(
        listings
          .flatMap((l) => l.categories?.map((c) => c.name) ?? [])
          .filter(Boolean) as string[],
      ),
    );
    if (names.length === 0) return provider?.description?.split(".")[0] || "Services";
    if (names.length <= 2) return names.join(" · ");
    return `${names.slice(0, 2).join(" · ")} +${names.length - 2}`;
  }, [listings, provider?.description]);

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
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-amber-500 text-white rounded-full text-sm font-semibold active:scale-95 transition-transform">Go Back</button>
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
        <div className="relative h-72 overflow-hidden">
          <img src={heroImage} alt={provider.brandName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Top Actions */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
            <button onClick={() => router.back()} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
              <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              <button onClick={handleToggleSaved} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                <IonIcon icon={liked ? heart : heartOutline} className={`w-5 h-5 ${liked ? "text-red-400" : "text-white"}`} />
              </button>
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
            <p className="text-white/80 text-sm truncate">{categoryLabel}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between bg-white px-5 py-3 border-b border-gray-100/80">
          <div className="flex items-center gap-1.5">
            <svg width={16} height={16} viewBox="0 0 20 20" fill="#FBBF24">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({reviewCount})</span>
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
            <InfoChip icon={ribbonOutline} label="Listings" value={`${stats?.listingCount ?? 0}`} />
            <InfoChip icon={time} label="Hours" value={hours} />
            <InfoChip icon={storefrontOutline} label="Status" value={provider.isAvailable ? "Open Now" : "Closed"} />
            <InfoChip icon={shieldCheckmark} label="Verified" value={provider.status === "active" ? "Verified" : "Pending"} />
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">About</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">{provider.description || "No description provided yet."}</p>
          </div>

          {/* Services / Listings */}
          {listings.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Services ({listings.length})</h3>
              <div className="space-y-2.5">
                {listings.map((l) => (
                  <div key={l.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50/80">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <IonIcon icon={storefrontOutline} className="w-[18px] h-[18px] text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-semibold text-gray-900 truncate">{l.businessName}</h4>
                      {l.description && <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{l.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-medium">
                        <span>{l.productCount} products</span>
                        <span>{l.reviewCount} reviews</span>
                        <span>{l.photoCount} photos</span>
                      </div>
                    </div>
                  </div>
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
                <p className="text-[13px] text-gray-600 leading-relaxed">{provider.address}{provider.city ? `, ${provider.city}` : ""}{provider.pincode ? ` - ${provider.pincode}` : ""}</p>
              </div>
            </div>
          )}

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
                      <span className="text-[11px] text-gray-400">{formatRelative(review.postedAt)}{review.businessName ? ` · ${review.businessName}` : ""}</span>
                    </div>
                  </div>
                  <StarRow rating={review.starRating} size={12} />
                </div>
                {review.reviewText && (
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{review.reviewText}</p>
                )}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-1.5 mb-3">
                    {review.photos.slice(0, 3).map((p) => (
                      <img key={p.id} src={p.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Write Review */}
          <button onClick={() => setSheetOpened(true)} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-dashed border-amber-300 text-amber-600 rounded-2xl text-sm font-semibold active:bg-amber-50 transition-colors">
            <IonIcon icon={star} className="w-4 h-4" />
            Write a Review
          </button>
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
                        <p className="text-[11px] text-gray-400 mb-2 line-clamp-1">{product.description || product.businessName}</p>
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
        <div className="flex gap-3">
          <button onClick={() => console.log("Message provider")} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 shadow-sm active:scale-[0.98] transition-transform">
            <IonIcon icon={chatbubbleOutline} className="w-[18px] h-[18px]" />
            Message
          </button>
          <button onClick={() => window.open(`tel:${provider.contactNumber}`)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 rounded-2xl text-sm font-semibold text-white shadow-sm shadow-amber-200 active:scale-[0.98] transition-transform">
            <IonIcon icon={callOutline} className="w-[18px] h-[18px]" />
            Call Now
          </button>
        </div>
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
