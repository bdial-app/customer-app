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
  listingCount: number;
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
  listingCount: number;
  recentBookings: number;
}

export interface CommunityReview {
  id: string;
  name: string;
  service: string;
  providerName: string;
  text: string;
  rating: number;
  timeAgo: string;
}

export interface PlatformStats {
  verifiedProviders: number;
  totalReviews: number;
  avgRating: number;
  totalBookings: number;
}

export interface LastBooking {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string | null;
  listingId: string;
  listingName: string;
  categories: string | null;
  location: string;
  completedAt: string;
}

export interface LiveActivity {
  count: number;
  text: string;
}

export interface HomeFeedResponse {
  nearbyProviders: HomeProvider[];
  beautyProviders: HomeProvider[];
  promoBanners: PromoBanner[];
  trendingCategories: TrendingCategory[];
  communityReviews: CommunityReview[];
  platformStats: PlatformStats;
  lastBooking: LastBooking | null;
}

// ─── API Functions ──────────────────────────────────────────────────

export const getHomeFeed = async (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<HomeFeedResponse> => {
  const { data } = await apiClient.get(HOME_URLS.FEED, { params });
  return data;
};

export const getLiveActivity = async (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<LiveActivity[]> => {
  const { data } = await apiClient.get(HOME_URLS.LIVE_ACTIVITY, { params });
  return data;
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
