"use client";
import { ROUTE_PATH } from "@/utils/contants";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { motion } from "framer-motion";
import HeroSearchBar from "./home/hero-search-bar";
import QuickCategories from "./home/quick-categories";
import PromoBannerCarousel from "./home/promo-banner-carousel";
import ProviderCardSlider from "./home/provider-card-slider";
import GreetingCard from "./home/greeting-card";
import LiveActivityPulse from "./home/live-activity-pulse";
import TrendingServices from "./home/trending-services";
import CommunityReviews from "./home/community-reviews";
import ReferEarnCard from "./home/refer-earn-card";
import BecomeProviderCTA from "./home/become-provider-cta";
import CitySpotlight from "./home/city-spotlight";
import RecentlyAdded from "./home/recently-added";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { useAppSelector } from "@/hooks/useAppStore";
import { useFlags } from "../context/FeatureFlagContext";

const UserHome = () => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((state) => state.auth.user);
  const flags = useFlags();

  const { data: feed, isLoading } = useHomeFeed({
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
  });

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
  const featuredCategory = feed?.featuredCategory;
  const featuredProviders = (featuredCategory?.providers || []).map(
    mapProvider,
  );
  const topRatedProviders = (feed?.topRatedProviders || []).map(mapProvider);
  const cityData = feed?.cityProviders;
  const cityProviders = (cityData?.providers || []).map(mapProvider);
  const newArrivals = (feed?.newArrivals || []).map(mapProvider);
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
          <HeroSearchBar prompts={feed?.searchPrompts} />

          {/* Category Scroll */}
          <QuickCategories />

          {/* Curved bottom transition */}
          <div className="h-6 bg-[#efeff4] dark:bg-slate-900 rounded-t-[28px] -mb-px" />
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
        <PromoBannerCarousel
          banners={feed?.promoBanners}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />

        {/* 🔥 Trending Now */}
        <TrendingServices
          categories={feed?.trendingCategories}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />

        {/* Near You - Horizontal Scroll */}
        <ProviderCardSlider
          title="Near You"
          subtitle="Top-rated providers nearby"
          providers={nearbyProviders}
          viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=distance&maxDistance=5`}
          accentColor="#F8CB45"
          isLoading={isLoading}
        />

        {/* Refer & Earn */}
        <ReferEarnCard />

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700 mt-2" />

        {/* Featured Category — dynamic random category as slider */}
        {featuredCategory && featuredProviders.length > 0 && (
          <>
            <ProviderCardSlider
              title={featuredCategory.name}
              subtitle={`Explore ${featuredCategory.name.toLowerCase()} services`}
              providers={featuredProviders}
              viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?search=${encodeURIComponent(featuredCategory.name)}`}
              accentColor="#E91E63"
              isLoading={isLoading}
            />
            <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />
          </>
        )}

        {/* City Spotlight */}
        {cityData && cityProviders.length > 0 && (
          <>
            <CitySpotlight
              city={cityData.city}
              providers={cityProviders}
              isLoading={isLoading}
              viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=rating`}
            />
            <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />
          </>
        )}

        {/* Community Reviews */}
        {flags.reviews_enabled && (
        <CommunityReviews
          reviews={feed?.communityReviews}
          isLoading={isLoading}
        />
        )}

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />

        {/* Top Rated Providers */}
        <ProviderCardSlider
          title="Top Rated"
          subtitle="Highest rated by our community"
          providers={topRatedProviders}
          viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=rating&minRating=4`}
          accentColor="#9C27B0"
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />

        {/* Recently Added — new arrivals */}
        <RecentlyAdded
          providers={newArrivals}
          isLoading={isLoading}
          viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=relevance`}
        />

        {/* Become a Provider CTA */}
        <BecomeProviderCTA />

        {/* Trust Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-4 mt-3 mb-2 p-5 rounded-2xl border border-slate-100 dark:border-slate-800"
          style={{
            background:
              "var(--trust-bg, linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%))",
          }}
        >
          <p className="text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Trusted by thousands
          </p>
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">
                {stats?.verifiedProviders ?? 0}+
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Verified Providers
              </p>
            </div>
            <div className="w-px h-10 bg-slate-200/80 dark:bg-slate-700" />
            <div>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">
                {stats?.totalCategories ?? 0}+
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Service Categories
              </p>
            </div>
            <div className="w-px h-10 bg-slate-200/80 dark:bg-slate-700" />
            <div>
              <p className="text-xl font-extrabold text-amber-500">
                {stats?.avgRating ? `${stats.avgRating}★` : "—"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Average Rating
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default UserHome;
