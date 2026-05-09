import apiClient from "@/utils/axios";
import { HOME_URLS } from "@/utils/urls";

// ─── Types ──────────────────────────────────────────────────────────

export interface HomeProvider {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  city: string;
  area: string | null;
  location: string;
  rating: number;
  reviewCount: number;
  services: string | null;
  verified: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  distance: number | null;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  gradient: string | null;
  emoji: string | null;
  cta: string | null;
  tag: string | null;
  linkUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface TrendingCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  providerCount: number;
  recentBookings: number;
}

export interface CommunityReview {
  id: string;
  name: string;
  providerName: string;
  text: string;
  rating: number;
  timeAgo: string;
}

export interface PlatformStats {
  verifiedProviders: number;
  totalReviews: number;
  avgRating: number;
  totalCategories: number;
}

export interface FeaturedCategory {
  name: string;
  slug: string;
  icon: string | null;
  providerCount: number;
  providers: HomeProvider[];
}

export interface CityProviders {
  city: string;
  providers: HomeProvider[];
}

export interface LiveActivity {
  count: number;
  text: string;
}

export interface HomeProviderWithOffer {
  id: string;
  name: string;
  image: string | null;
  location: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  distance: number | null;
  offerId: string;
  offerTitle: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  offerEndsAt: string;
  hasActiveOffer: true;
  totalOffers: number;
}

export interface HomeSponsoredProvider {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  location: string;
  rating: number;
  reviewCount: number;
  services: string | null;
  primaryCategory: string | null;
  verified: boolean;
  distance: number | null;
  sponsorType: 'carousel' | 'inline' | 'top_result';
  hasActiveOffer: boolean;
  sponsoredListingId: string;
  endsAt: string;
}

export interface PersonalizedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  weight: number;
  source: 'behavioral' | 'default' | 'explicit';
}

export interface HomeFeedResponse {
  nearbyProviders: HomeProvider[];
  featuredCategory: FeaturedCategory | null;
  topRatedProviders: HomeProvider[];
  cityProviders: CityProviders | null;
  newArrivals: HomeProvider[];
  promoBanners: PromoBanner[];
  trendingCategories: TrendingCategory[];
  personalizedCategories: PersonalizedCategory[] | null;
  forYouProviders: HomeProvider[] | null;
  womenLedProviders: HomeProvider[] | null;
  communityReviews: CommunityReview[];
  platformStats: PlatformStats;
  searchPrompts: string[];
  dealsAroundYou: HomeProviderWithOffer[];
  sponsoredProviders: HomeSponsoredProvider[];
}

// ─── API Functions ──────────────────────────────────────────────────

export const getHomeFeed = async (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<HomeFeedResponse> => {
  const { data } = await apiClient.get(HOME_URLS.FEED, { params });
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {} as HomeFeedResponse;
  }
  return data;
};

export const getLiveActivity = async (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<LiveActivity[]> => {
  const { data } = await apiClient.get(HOME_URLS.LIVE_ACTIVITY, { params });
  return Array.isArray(data) ? data : [];
};

export const getCategoryProviders = async (params: {
  slug: string;
  lat?: number;
  lng?: number;
  city?: string;
  limit?: number;
}): Promise<HomeProvider[]> => {
  const { data } = await apiClient.get(HOME_URLS.CATEGORY_PROVIDERS, {
    params,
  });
  return data;
};
