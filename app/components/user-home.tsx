"use client";
import { Sheet } from "konsta/react";
import { ROUTE_PATH } from "@/utils/contants";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import AllServicesContent from "./all-services-content";
import HeroSearchBar from "./home/hero-search-bar";
import QuickCategories from "./home/quick-categories";
import PromoBannerCarousel from "./home/promo-banner-carousel";
import ProviderCardSlider from "./home/provider-card-slider";
import FeaturedProviderGrid from "./home/featured-provider-grid";
import ReorderRibbon from "./home/reorder-ribbon";
import GreetingCard from "./home/greeting-card";
import LiveActivityPulse from "./home/live-activity-pulse";
import TrendingServices from "./home/trending-services";
import CommunityReviews from "./home/community-reviews";
import ReferEarnCard from "./home/refer-earn-card";
import BecomeProviderCTA from "./home/become-provider-cta";

const MOCK_PROVIDERS = [
  {
    id: 1,
    name: "Ahmed's Tailoring",
    service: "Tailoring & Stitching",
    rating: 4.8,
    reviews: 127,
    price: "1000-5000",
    location: "Downtown, 2.5 km",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    verified: true,
  },
  {
    id: 2,
    name: "Fashion House",
    service: "Designer Wear",
    rating: 4.5,
    reviews: 89,
    price: "1500-3000",
    location: "City Center, 3.2 km",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400",
    verified: true,
    womenLed: true,
  },
  {
    id: 3,
    name: "Stitch Perfect",
    service: "Alterations",
    rating: 4.6,
    reviews: 203,
    price: "1000-2000",
    location: "West End, 1.8 km",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    verified: false,
  },
  {
    id: 4,
    name: "Royal Tailors",
    service: "Traditional Wear",
    rating: 4.9,
    reviews: 156,
    price: "500-5000",
    location: "Old Town, 4.1 km",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
    verified: true,
    womenLed: true,
  },
  {
    id: 5,
    name: "Zara Boutique",
    service: "Women's Fashion",
    rating: 4.7,
    reviews: 312,
    price: "2000-8000",
    location: "MG Road, 1.2 km",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400",
    verified: true,
    womenLed: true,
  },
  {
    id: 6,
    name: "Classic Cuts",
    service: "Everyday Alterations",
    rating: 4.3,
    reviews: 74,
    price: "800-2500",
    location: "Suburbs, 5.0 km",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    verified: false,
  },
];

const BEAUTY_PROVIDERS = [
  {
    id: 10,
    name: "Glow Studio",
    service: "Salon & Makeup",
    rating: 4.9,
    reviews: 245,
    price: "500-3000",
    location: "MG Road, 1.5 km",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
    verified: true,
    womenLed: true,
  },
  {
    id: 11,
    name: "Radiance Spa",
    service: "Spa & Wellness",
    rating: 4.7,
    reviews: 178,
    price: "1000-5000",
    location: "Koregaon Park, 3 km",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400",
    verified: true,
  },
  {
    id: 12,
    name: "Mehandi Arts",
    service: "Mehandi Artist",
    rating: 4.8,
    reviews: 89,
    price: "300-2000",
    location: "Camp, 2 km",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400",
    verified: true,
    womenLed: true,
  },
  {
    id: 13,
    name: "Style Studio",
    service: "Hair & Beauty",
    rating: 4.5,
    reviews: 134,
    price: "400-2500",
    location: "Baner, 4 km",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
    verified: false,
  },
];

const UserHome = () => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSearchTap = () => {
    setIsSheetOpen(true);
  };

  return (
    <>
      <div ref={scrollRef} className="flex flex-col pb-4 overflow-x-hidden">
        {/* === HERO SECTION — dark gradient continuation from header === */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #0f3460 0%, #1a1a2e 40%, #1a1a2e 100%)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full bg-amber-400/[0.06] blur-[80px] pointer-events-none" />

          {/* Search Bar */}
          <HeroSearchBar onTap={handleSearchTap} />

          {/* Category Scroll */}
          <QuickCategories />

          {/* Curved bottom transition */}
          <div className="h-6 bg-[#FAFAFA] rounded-t-[28px] -mb-px" />
        </div>

        {/* Personalized Greeting */}
        <GreetingCard />

        {/* Live Activity Pulse — social proof */}
        <LiveActivityPulse />

        {/* Promo Banner Carousel */}
        <PromoBannerCarousel />

        {/* Reorder / Your last booking */}
        <ReorderRibbon />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* 🔥 Trending Now */}
        <TrendingServices />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* Near You - Horizontal Scroll */}
        <ProviderCardSlider
          title="Near You"
          subtitle="Top-rated providers nearby"
          providers={MOCK_PROVIDERS}
          viewAllLink={ROUTE_PATH.ALL_SERVICES}
          accentColor="#F8CB45"
        />

        {/* Refer & Earn */}
        <ReferEarnCard />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0 mt-2" />

        {/* Featured Grid */}
        <FeaturedProviderGrid
          title="Beauty & Wellness"
          subtitle="Pamper yourself today"
          providers={BEAUTY_PROVIDERS}
          viewAllLink={ROUTE_PATH.ALL_SERVICES}
        />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* Community Reviews */}
        <CommunityReviews />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* Popular in Tailoring */}
        <ProviderCardSlider
          title="Popular in Tailoring"
          subtitle="Most booked this week"
          providers={MOCK_PROVIDERS.slice(0, 4)}
          viewAllLink={ROUTE_PATH.ALL_SERVICES}
          accentColor="#9C27B0"
        />

        {/* Become a Provider CTA */}
        <BecomeProviderCTA />

        {/* Trust Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-4 mt-3 mb-2 p-5 rounded-2xl border border-slate-100"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
          }}
        >
          <p className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Trusted by thousands
          </p>
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-xl font-extrabold text-slate-800">500+</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Verified Providers</p>
            </div>
            <div className="w-px h-10 bg-slate-200/80" />
            <div>
              <p className="text-xl font-extrabold text-slate-800">10K+</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Happy Customers</p>
            </div>
            <div className="w-px h-10 bg-slate-200/80" />
            <div>
              <p className="text-xl font-extrabold text-amber-500">4.8★</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Average Rating</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Sheet */}
      <Sheet
        className="pb-safe h-[90%]"
        opened={isSheetOpen}
        onBackdropClick={() => setIsSheetOpen(false)}
      >
        <div className="flex flex-col h-full bg-slate-50">
          <SheetToolbar
            title="Search Services"
            onClick={() => setIsSheetOpen(false)}
          />
          <div className="flex-1 overflow-y-auto">
            <AllServicesContent isSheet />
          </div>
        </div>
      </Sheet>
    </>
  );
};

const SheetToolbar = ({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) => (
  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
    <div className="text-lg font-bold text-slate-800">{title}</div>
    <button
      onClick={onClick}
      className="text-blue-500 font-semibold active:opacity-50 transition-opacity"
    >
      Done
    </button>
  </div>
);

export default UserHome;
