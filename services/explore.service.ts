import apiClient from "@/utils/axios";
import { EXPLORE_URLS } from "@/utils/urls";

// ─── Types ──────────────────────────────────────────────────────────

export interface ProviderBadge {
  type: 'gold_seller' | 'top_rated' | 'express_service' | 'trusted' | 'rising_star';
  source: 'paid' | 'earned';
}

export interface ExploreProvider {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  location: string;
  rating: number;
  reviewCount: number;
  services: string | null;
  verified: boolean;
  isWomenLed: boolean;
  isFeatured?: boolean;
  distance: number | null;
  badges: ProviderBadge[];
}

export interface SponsoredProvider extends ExploreProvider {
  sponsoredListingId: string;
  isSponsored: true;
}

export interface ProviderWithOffer extends ExploreProvider {
  offerId: string;
  offerTitle: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  offerEndsAt: string;
  hasActiveOffer: true;
  providerDealCount?: number;
}

export interface ExploreCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  iconColor?: string | null;
  providerCount: number;
}

export interface CategorySpotlight {
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    iconColor?: string | null;
  };
  providers: ExploreProvider[];
}

export interface ExploreBanner {
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

export interface ExplorePlatformStats {
  verifiedProviders: number;
  totalReviews: number;
  avgRating: number;
  totalBookings: number;
}

export interface ExploreCommunityReview {
  id: string;
  name: string;
  providerName: string;
  text: string;
  rating: number;
  timeAgo: string;
}

export interface ExploreFeedResponse {
  sponsoredCarousel: SponsoredProvider[];
  activeOffers: ProviderWithOffer[];
  quickCategories: ExploreCategory[];
  popularNearby: ExploreProvider[];
  bannerAds: ExploreBanner[];
  topRated: ExploreProvider[];
  categorySpotlight: CategorySpotlight | null;
  newArrivals: ExploreProvider[];
  communityReviews: ExploreCommunityReview[];
  womenLedProviders: ExploreProvider[];
  platformStats: ExplorePlatformStats;
}

export interface TrackAdEventPayload {
  eventType: 'impression' | 'click';
  entityType: 'sponsored_listing' | 'promo_banner' | 'provider_offer';
  entityId: string;
  position?: string;
}

// ─── API Functions ──────────────────────────────────────────────────

export const getExploreFeed = async (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<ExploreFeedResponse> => {
  const { data } = await apiClient.get(EXPLORE_URLS.FEED, { params });
  return data;
};

export const trackAdEvent = async (payload: TrackAdEventPayload): Promise<void> => {
  await apiClient.post(EXPLORE_URLS.TRACK, payload);
};

export interface DealsParams {
  lat?: number;
  lng?: number;
  radius?: number;
  city?: string;
  category?: string;
  discountType?: 'percentage' | 'flat';
  minDiscount?: number;
  verified?: boolean;
  minRating?: number;
  endingSoon?: boolean;
  womenLed?: boolean;
  page?: number;
  limit?: number;
  sort?: 'discount' | 'ending_soon' | 'distance' | 'newest';
}

export interface DealsResponse {
  data: ProviderWithOffer[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const getDeals = async (params?: DealsParams): Promise<DealsResponse> => {
  const { data } = await apiClient.get(EXPLORE_URLS.DEALS, { params });
  return data;
};
