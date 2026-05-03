"use client";
import { ROUTE_PATH } from "@/utils/contants";
import { useRouter } from "next/navigation";
import { useRef, useMemo, lazy, Suspense, useCallback, memo } from "react";
import HeroSearchBar from "./home/hero-search-bar";
import QuickCategories from "./home/quick-categories";
import PromoBannerCarousel from "./home/promo-banner-carousel";
import DealsCarousel from "./home/deals-carousel";
import SponsoredCarousel from "./home/sponsored-carousel";
import ProviderCardSlider from "./home/provider-card-slider";
import GreetingCard from "./home/greeting-card";
import LiveActivityPulse from "./home/live-activity-pulse";
import TrendingServices from "./home/trending-services";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { useAppSelector } from "@/hooks/useAppStore";
import { useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "./pull-to-refresh";
import { inflateIfLow } from "@/utils/inflate-stats";

// Lazy load below-fold sections — they are not visible on initial viewport
const CommunityReviews = lazy(() => import("./home/community-reviews"));
const ReferEarnCard = lazy(() => import("./home/refer-earn-card"));
const BecomeProviderCTA = lazy(() => import("./home/become-provider-cta"));
const CitySpotlight = lazy(() => import("./home/city-spotlight"));
const RecentlyAdded = lazy(() => import("./home/recently-added"));

const LazyFallback = () => (
  <div className="h-[200px] mx-4 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
);

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

const UserHome = memo(() => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const { data: feed, isLoading } = useHomeFeed({
    lat: user?.latitude ?? undefined,
    lng: user?.longitude ?? undefined,
    city: user?.city ?? undefined,
  });

  // Pull-to-refresh handler — invalidates home feed queries
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
  }, [queryClient]);

  // Memoize mapped providers to avoid re-creating on every render
  const nearbyProviders = useMemo(
    () => (feed?.nearbyProviders || []).map(mapProvider),
    [feed?.nearbyProviders],
  );
  const featuredCategory = feed?.featuredCategory;
  const featuredProviders = useMemo(
    () => (featuredCategory?.providers || []).map(mapProvider),
    [featuredCategory?.providers],
  );
  const topRatedProviders = useMemo(
    () => (feed?.topRatedProviders || []).map(mapProvider),
    [feed?.topRatedProviders],
  );
  const cityData = feed?.cityProviders;
  const cityProviders = useMemo(
    () => (cityData?.providers || []).map(mapProvider),
    [cityData?.providers],
  );
  const newArrivals = useMemo(
    () => (feed?.newArrivals || []).map(mapProvider),
    [feed?.newArrivals],
  );
  const dealsAroundYou = feed?.dealsAroundYou || [];
  const sponsoredProviders = feed?.sponsoredProviders || [];
  const stats = feed?.platformStats;
  const forYouProviders = useMemo(
    () => (feed?.forYouProviders || []).map(mapProvider),
    [feed?.forYouProviders],
  );
  const personalizedCategories = feed?.personalizedCategories || null;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div ref={scrollRef} className="flex flex-col pb-20 overflow-x-hidden">
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

          {/* Category Scroll — personalized order when available */}
          <QuickCategories personalizedCategories={personalizedCategories} />

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

        {/* ⭐ Featured Businesses — gold themed sponsored carousel */}
        <SponsoredCarousel providers={sponsoredProviders} isLoading={isLoading} />

        {/* 🏷️ Deals Around You — red themed carousel */}
        <DealsCarousel deals={dealsAroundYou} isLoading={isLoading} />

        {/* For You — personalized providers based on interests */}
        {forYouProviders.length > 0 && (
          <>
            <ProviderCardSlider
              title="For You"
              subtitle="Based on your interests"
              providers={forYouProviders}
              viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=relevance`}
              accentColor="#8B5CF6"
              isLoading={isLoading}
            />
          </>
        )}

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
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 200px" }}>
          <Suspense fallback={<LazyFallback />}>
            <ReferEarnCard />
          </Suspense>
        </div>

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700 mt-2" />

        {/* Featured Category — dynamic random category as slider */}
        {featuredCategory && featuredProviders.length > 0 && (
          <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 280px" }}>
            <ProviderCardSlider
              title={featuredCategory.name}
              subtitle={`Explore ${featuredCategory.name.toLowerCase()} services`}
              providers={featuredProviders}
              viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?search=${encodeURIComponent(featuredCategory.name)}`}
              accentColor="#E91E63"
              isLoading={isLoading}
            />
            <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />
          </div>
        )}

        {/* City Spotlight */}
        {cityData && cityProviders.length > 0 && (
          <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 250px" }}>
            <Suspense fallback={<LazyFallback />}>
              <CitySpotlight
                city={cityData.city}
                providers={cityProviders}
                isLoading={isLoading}
                viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=rating`}
              />
              <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />
            </Suspense>
          </div>
        )}

        {/* Community Reviews */}
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 220px" }}>
          <Suspense fallback={<LazyFallback />}>
            <CommunityReviews
              reviews={feed?.communityReviews}
              isLoading={isLoading}
            />
          </Suspense>
        </div>

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />

        {/* Top Rated Providers */}
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 280px" }}>
          <ProviderCardSlider
            title="Top Rated"
            subtitle="Highest rated by our community"
            providers={topRatedProviders}
            viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=rating&minRating=4`}
            accentColor="#9C27B0"
            isLoading={isLoading}
          />
        </div>

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />

        {/* Recently Added — new arrivals */}
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 280px" }}>
          <Suspense fallback={<LazyFallback />}>
            <RecentlyAdded
              providers={newArrivals}
              isLoading={isLoading}
              viewAllLink={`${ROUTE_PATH.ALL_SERVICES}?sort=relevance`}
            />
          </Suspense>
        </div>

        {/* Divider */}
        <div className="mx-0 py-1 border-b border-slate-100 dark:border-slate-700" />

        {/* Become a Provider CTA */}
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "auto 200px" }}>
          <Suspense fallback={<LazyFallback />}>
            <BecomeProviderCTA />
          </Suspense>
        </div>

        {/* Trust Banner */}
        <div
          className="mx-4 mt-3 mb-2 p-5 rounded-2xl border border-slate-100 dark:border-slate-800"
          style={{
            background:
              "var(--trust-bg, linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%))",
          }}
        >
          <p className="text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Trusted by thousands
          </p>
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div>
              <p className="text-lg font-extrabold text-slate-800 dark:text-white">
                {inflateIfLow(dealsAroundYou.length, "deals_today", 8, 18)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Deals Today
              </p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 dark:text-white">
                {inflateIfLow(nearbyProviders.length, "businesses_nearby", 20, 40)}+
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Businesses Near You
              </p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 dark:text-white">
                {inflateIfLow(stats?.verifiedProviders ?? 0, "verified_providers", 25, 50)}+
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Verified Providers
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-extrabold text-amber-500">
                {stats?.avgRating ? `${stats.avgRating}★` : "—"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Average Rating
              </p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 dark:text-white">
                {inflateIfLow(stats?.totalReviews ?? 0, "total_reviews", 30, 60)}+
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Total Reviews
              </p>
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
});

UserHome.displayName = "UserHome";

export default UserHome;
