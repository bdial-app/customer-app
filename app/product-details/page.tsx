"use client";
import { Page } from "konsta/react";
import { useState } from "react";
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
} from "ionicons/icons";
import { useRouter, useSearchParams } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  photo_url: string;
  photos: string[];
  inStock: boolean;
  badge?: string;
  specs: { label: string; value: string }[];
}

const PRODUCT: Product = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Premium Suit \u2013 Custom Tailored",
  description:
    "Expertly crafted premium suit with high-quality fabric. Perfect for special occasions and business meetings. Custom measurements included for perfect fit. Available in various colors and sizes.\n\nEach suit is hand-stitched with precision and care, using only the finest materials sourced from trusted suppliers.",
  price: 5000,
  originalPrice: 6500,
  currency: "\u20B9",
  photo_url:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
  photos: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    "https://images.unsplash.com/photo-1596755098206-66d6dc2b2876?w=800",
    "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=800",
  ],
  inStock: true,
  badge: "Bestseller",
  specs: [
    { label: "Fabric", value: "Premium Wool Blend" },
    { label: "Fit", value: "Custom Tailored" },
    { label: "Delivery", value: "7\u201310 Days" },
    { label: "Care", value: "Dry Clean Only" },
  ],
};

const RELATED = [
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    name: "Business Shirt",
    price: 1200,
    currency: "\u20B9",
    photo_url:
      "https://images.unsplash.com/photo-1596755098206-66d6dc2b2876?w=400",
  },
  {
    id: "323e4567-e89b-12d3-a456-426614174002",
    name: "Traditional Kurta",
    price: 1800,
    currency: "\u20B9",
    photo_url:
      "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=400",
    badge: "New",
  },
  {
    id: "424e4567-e89b-12d3-a456-426614174003",
    name: "Formal Trousers",
    price: 1500,
    currency: "\u20B9",
    photo_url:
      "https://images.unsplash.com/photo-1594637879035-79c445bc5d0c?w=400",
  },
];

export default function ProductDetailsPage() {
  const router = useRouter();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [liked, setLiked] = useState(false);

  const product = PRODUCT;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Page className="!bg-gray-50/80">
      {/* Hero Carousel */}
      <div className="relative">
        <div className="relative h-80 overflow-hidden bg-white">
          <img
            src={product.photos[currentPhoto]}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Top Actions */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              <IonIcon icon={arrowBack} className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setLiked((l) => !l)}
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

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-[calc(env(safe-area-inset-top)+56px)] left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-white">
              {product.badge}
            </span>
          )}

          {/* Photo Dots */}
          {product.photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {product.photos.map((_, i) => (
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

        {/* Thumbnail Strip */}
        {product.photos.length > 1 && (
          <div className="flex gap-2 px-5 py-3 bg-white border-b border-gray-100/80">
            {product.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhoto(i)}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
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

      {/* Content */}
      <div className="px-5 pt-5 pb-28 space-y-4">
        {/* Title + Price */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-amber-600">
              {product.currency}{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-base text-gray-400 line-through">
                  {product.currency}{product.originalPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                product.inStock
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              <IonIcon icon={checkmarkCircle} className="w-3 h-3" />
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {product.specs.map((spec, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 ${
                i < product.specs.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <span className="text-[13px] text-gray-500">{spec.label}</span>
              <span className="text-[13px] font-semibold text-gray-800">
                {spec.value}
              </span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-[15px] font-bold text-gray-900 mb-2">
            Description
          </h3>
          <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Related Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              You May Also Like
            </h3>
            <button className="flex items-center text-xs font-semibold text-amber-600">
              See All
              <IonIcon icon={chevronForward} className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
            {RELATED.map((item) => (
              <Link
                key={item.id}
                href={`${ROUTE_PATH.PRODUCT_DETAILS}?id=${item.id}`}
                className="flex-shrink-0 w-36"
              >
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.badge && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-[12px] font-semibold text-gray-900 mb-0.5 line-clamp-1">
                      {item.name}
                    </h4>
                    <span className="text-[13px] font-bold text-amber-600">
                      {item.currency}{item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 px-5"
        style={{
          background:
            "linear-gradient(to top, rgba(249,250,251,1) 60%, rgba(249,250,251,0))",
        }}
      >
        <button
          onClick={() => console.log("Send enquiry:", product.id)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 rounded-2xl text-sm font-semibold text-white shadow-sm shadow-amber-200 active:scale-[0.98] transition-transform"
        >
          <IonIcon icon={chatbubbleOutline} className="w-[18px] h-[18px]" />
          Send Enquiry
        </button>
      </div>
    </Page>
  );
}
