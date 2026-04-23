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
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { useAppSelector } from "@/hooks/useAppStore";

const UserHome = () => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((state) => state.auth.user);

  const { data: feed, isLoading } = useHomeFeed({
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
  });

  const handleSearchTap = () => {
    setIsSheetOpen(true);
  };

  // Map API providers to the shape expected by slider/grid components
  const mapProvider = (p: any) => ({
    id: p.id,
    name: p.name,
    image: p.image || p.bannerImage || p.profilePhotoUrl || "",
    service: p.services || undefined,
    rating: p.rating || 0,
    reviews: p.reviewCount || 0,
    price: undefined,
    location: p.location || undefined,
    verified: p.verified || false,
    womenLed: p.isWomenLed || p.womenLed || false,
    distance: p.distance,
  });

  const nearbyProviders = (feed?.nearbyProviders || []).map(mapProvider);
  const beautyProviders = (feed?.beautyProviders || []).map(mapProvider);
  const stats = feed?.platformStats;

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
        <LiveActivityPulse
          lat={user?.latitude ?? undefined}
          lng={user?.longitude ?? undefined}
          city={user?.city ?? undefined}
        />

        {/* Promo Banner Carousel */}
        <PromoBannerCarousel banners={feed?.promoBanners} isLoading={isLoading} />

        {/* Reorder / Your last booking */}
        <ReorderRibbon lastBooking={feed?.lastBooking ?? null} />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* 🔥 Trending Now */}
        <TrendingServices categories={feed?.trendingCategories} isLoading={isLoading} />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* Near You - Horizontal Scroll */}
        <ProviderCardSlider
          title="Near You"
          subtitle="Top-rated providers nearby"
          providers={nearbyProviders}
          viewAllLink={ROUTE_PATH.ALL_SERVICES}
          accentColor="#F8CB45"
          isLoading={isLoading}
        />

        {/* Refer & Earn */}
        <ReferEarnCard />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0 mt-2" />

        {/* Featured Grid */}
        <FeaturedProviderGrid
          title="Beauty & Wellness"
          subtitle="Pamper yourself today"
          providers={beautyProviders}
          viewAllLink={ROUTE_PATH.ALL_SERVICES}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* Community Reviews */}
        <CommunityReviews reviews={feed?.communityReviews} isLoading={isLoading} />

        {/* Divider */}
        <div className="h-2 bg-slate-50 mx-0" />

        {/* Popular in Tailoring */}
        <ProviderCardSlider
          title="Popular in Tailoring"
          subtitle="Most booked this week"
          providers={nearbyProviders.slice(0, 4)}
          viewAllLink={ROUTE_PATH.ALL_SERVICES}
          accentColor="#9C27B0"
          isLoading={isLoading}
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
              <p className="text-xl font-extrabold text-slate-800">{stats?.verifiedProviders ?? 0}+</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Verified Providers</p>
            </div>
            <div className="w-px h-10 bg-slate-200/80" />
            <div>
              <p className="text-xl font-extrabold text-slate-800">{stats?.totalBookings ?? 0}+</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Happy Customers</p>
            </div>
            <div className="w-px h-10 bg-slate-200/80" />
            <div>
              <p className="text-xl font-extrabold text-amber-500">{stats?.avgRating ? `${stats.avgRating}★` : '—'}</p>
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
