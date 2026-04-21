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
import { useProviderById } from "@/hooks/useProvider";

// -- Types --

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  helpful: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  photo_url: string;
  badge?: string;
}

// -- Mock Data --

const MOCK_REVIEWS: Review[] = [
  { id: 1, name: "Sarah Johnson", avatar: "SJ", rating: 5, date: "2 days ago", comment: "Excellent work! The fit was perfect and quality exceeded expectations. Highly recommended for anyone looking for premium tailoring.", verified: true, helpful: 12 },
  { id: 2, name: "Mohammed Ali", avatar: "MA", rating: 4, date: "1 week ago", comment: "Good service and reasonable prices. Got my traditional kurta stitched here and it turned out well. Slight delay but overall satisfied.", verified: true, helpful: 8 },
  { id: 3, name: "Fatima Khan", avatar: "FK", rating: 5, date: "2 weeks ago", comment: "A master at the craft! Recreated a vintage design exactly as I wanted. Incredible attention to detail. Will definitely come back.", verified: false, helpful: 15 },
  { id: 4, name: "Raj Patel", avatar: "RP", rating: 4, date: "3 weeks ago", comment: "Professional work and timely delivery. The alterations on my suit were done perfectly. Worth the quality.", verified: true, helpful: 6 },
  { id: 5, name: "Aisha Begum", avatar: "AB", rating: 5, date: "1 month ago", comment: "Been coming here for years and never disappointed. Understands cultural preferences perfectly. Exceptional traditional wear.", verified: true, helpful: 20 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: "123e4567-e89b-12d3-a456-426614174000", name: "Premium Suit", description: "Custom tailored with high-quality fabric", price: 5000, currency: "\u20B9", photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", badge: "Bestseller" },
  { id: "223e4567-e89b-12d3-a456-426614174001", name: "Business Shirt", description: "Professional fabric, tailored fit", price: 1200, currency: "\u20B9", photo_url: "https://images.unsplash.com/photo-1596755098206-66d6dc2b2876?w=400" },
  { id: "323e4567-e89b-12d3-a456-426614174002", name: "Traditional Kurta", description: "Modern design with traditional essence", price: 1800, currency: "\u20B9", photo_url: "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=400", badge: "New" },
  { id: "424e4567-e89b-12d3-a456-426614174003", name: "Formal Trousers", description: "Well-fitted for office wear", price: 1500, currency: "\u20B9", photo_url: "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=400" },
  { id: "525e4567-e89b-12d3-a456-426614174004", name: "Casual Shirt", description: "Comfortable everyday wear", price: 800, currency: "\u20B9", photo_url: "https://images.unsplash.com/photo-1521572163474-6864f9a17a77?w=400" },
  { id: "626e4567-e89b-12d3-a456-426614174005", name: "Designer Blazer", description: "Stylish for special occasions", price: 3500, currency: "\u20B9", photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", badge: "Premium" },
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600",
  "https://images.unsplash.com/photo-1560749614-612495a177a5?w=600",
];

const TABS = ["Overview", "Reviews", "Products", "Photos"] as const;
type Tab = (typeof TABS)[number];

// -- Helpers --

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

  const { data: fetchedProvider, isLoading, isError } = useProviderById(id);

  const photoGalleryRef = useRef<PhotoGalleryRef>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [sheetOpened, setSheetOpened] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [liked, setLiked] = useState(false);

  const provider = useMemo(() => {
    if (!fetchedProvider) return null;
    return {
      ...fetchedProvider,
      name: fetchedProvider.brandName,
      service: fetchedProvider.description?.split(",")[0] || "Services",
      rating: 4.8,
      reviewCount: 127,
      price: "\u20B9500 \u2013 \u20B92,000",
      image: fetchedProvider.profilePhotoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
      experience: "10+ Years",
      availability: `${fetchedProvider.openTime?.slice(0, 5) || "09:00"} \u2013 ${fetchedProvider.closeTime?.slice(0, 5) || "21:00"}`,
      phone: fetchedProvider.contactNumber,
    };
  }, [fetchedProvider]);

  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    MOCK_REVIEWS.forEach((r) => dist[r.rating - 1]++);
    return dist;
  }, []);

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
    const shareData = {
      title: provider?.name || "",
      text: `Check out ${provider?.name} \u2013 ${provider?.service}\n\u2B50 ${provider?.rating}\n${provider?.description || ""}`,
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

  return (
    <Page className="!bg-gray-50/80">
      {/* Hero */}
      <div className="relative" style={{ display: isLightboxOpen ? "none" : "block" }}>
        <div className="relative h-72 overflow-hidden">
          <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Top Actions */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
            <button onClick={() => router.back()} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
              <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              <button onClick={() => setLiked((l) => !l)} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                <IonIcon icon={liked ? heart : heartOutline} className={`w-5 h-5 ${liked ? "text-red-400" : "text-white"}`} />
              </button>
              <button onClick={handleShare} className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                <IonIcon icon={shareSocial} className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Photo Count */}
          <button onClick={() => setActiveTab("Photos")} className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full active:scale-95 transition-transform">
            <IonIcon icon={imagesOutline} className="w-3.5 h-3.5" />
            {GALLERY_IMAGES.length} Photos
          </button>

          {/* Provider Name */}
          <div className="absolute bottom-4 left-4 right-20">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white leading-tight truncate">{provider.name}</h1>
              {provider.status === "active" && <IonIcon icon={checkmarkCircle} className="w-5 h-5 text-blue-400 flex-shrink-0" />}
            </div>
            <p className="text-white/80 text-sm truncate">{provider.service}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between bg-white px-5 py-3 border-b border-gray-100/80">
          <div className="flex items-center gap-1.5">
            <svg width={16} height={16} viewBox="0 0 20 20" fill="#FBBF24">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">{provider.rating}</span>
            <span className="text-xs text-gray-400">({provider.reviewCount})</span>
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <span className="text-sm font-semibold text-amber-600">{provider.price}</span>
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
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
            {GALLERY_IMAGES.slice(0, 3).map((img, i) => (
              <button key={i} onClick={() => setActiveTab("Photos")} className={`relative aspect-square overflow-hidden active:opacity-80 transition-opacity ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === 2 && GALLERY_IMAGES.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">+{GALLERY_IMAGES.length - 3}</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Info Chips */}
          <div className="grid grid-cols-2 gap-2.5">
            <InfoChip icon={ribbonOutline} label="Experience" value={provider.experience} />
            <InfoChip icon={time} label="Hours" value={provider.availability} />
            <InfoChip icon={storefrontOutline} label="Status" value={provider.isAvailable ? "Open Now" : "Closed"} />
            <InfoChip icon={shieldCheckmark} label="Verified" value={provider.status === "active" ? "Verified" : "Pending"} />
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">About</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">{provider.description || "No description provided yet."}</p>
          </div>

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
          {fetchedProvider?.user && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Business Owner</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {fetchedProvider.user.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{fetchedProvider.user.name}</h4>
                  <p className="text-xs text-gray-500">{fetchedProvider.user.mobileNumber}</p>
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
                <span className="text-4xl font-extrabold text-gray-900 leading-none">{provider.rating}</span>
                <StarRow rating={Math.round(provider.rating)} size={13} />
                <span className="text-[11px] text-gray-400 mt-1.5 font-medium">{provider.reviewCount} reviews</span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 justify-center">
                {[5, 4, 3, 2, 1].map((s) => (
                  <RatingBar key={s} starCount={s} count={ratingDist[s - 1]} total={MOCK_REVIEWS.length} />
                ))}
              </div>
            </div>
          </div>

          {/* Review Cards */}
          {MOCK_REVIEWS.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">{review.avatar}</div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-gray-900">{review.name}</span>
                      {review.verified && <IonIcon icon={checkmarkCircle} className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <span className="text-[11px] text-gray-400">{review.date}</span>
                  </div>
                </div>
                <StarRow rating={review.rating} size={12} />
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{review.comment}</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <button className="flex items-center gap-1 text-[11px] text-gray-400 active:text-gray-600 transition-colors">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  Helpful ({review.helpful})
                </button>
              </div>
            </div>
          ))}

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
            <h3 className="text-[15px] font-bold text-gray-900">{MOCK_PRODUCTS.length} Products</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_PRODUCTS.map((product) => (
              <Link key={product.id} href={`${ROUTE_PATH.PRODUCT_DETAILS}?id=${product.id}`}>
                <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
                    {product.badge && (
                      <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${product.badge === "Bestseller" ? "bg-amber-500 text-white" : product.badge === "New" ? "bg-emerald-500 text-white" : "bg-gray-900 text-white"}`}>{product.badge}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-[13px] font-semibold text-gray-900 mb-0.5 line-clamp-1">{product.name}</h4>
                    <p className="text-[11px] text-gray-400 mb-2 line-clamp-1">{product.description}</p>
                    <span className="text-[15px] font-bold text-amber-600">{product.currency}{product.price.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* === PHOTOS === */}
      {activeTab === "Photos" && (
        <div className="pt-2 pb-28">
          <PhotoGallary ref={photoGalleryRef} />
        </div>
      )}

      {/* Floating CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 px-5" style={{ background: "linear-gradient(to top, rgba(249,250,251,1) 60%, rgba(249,250,251,0))", display: isLightboxOpen ? "none" : "block" }}>
        <div className="flex gap-3">
          <button onClick={() => console.log("Message provider")} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 shadow-sm active:scale-[0.98] transition-transform">
            <IonIcon icon={chatbubbleOutline} className="w-[18px] h-[18px]" />
            Message
          </button>
          <button onClick={() => window.open(`tel:${provider.phone}`)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 rounded-2xl text-sm font-semibold text-white shadow-sm shadow-amber-200 active:scale-[0.98] transition-transform">
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
