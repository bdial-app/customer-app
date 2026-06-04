import apiClient from "@/utils/axios";
import { HOME_URLS } from "@/utils/urls";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { getTokenSync } from "@/utils/storage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// On native (iOS/Android with CapacitorHttp.enabled), axios's adapter is
// patched and occasionally hands back the raw response body as a string,
// causing the home feed to silently fall back to {}. Going through
// CapacitorHttp.request directly with responseType: 'json' guarantees the
// native plugin parses the body before returning it to JS.
async function nativeGet(path: string, params?: Record<string, any>): Promise<any> {
  const token = getTokenSync();
  const res = await CapacitorHttp.request({
    method: "GET",
    url: `${API_BASE}${path}`,
    params: params
      ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        )
      : undefined,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    responseType: "json",
  });
  // Throw on non-2xx so React Query treats it as an error instead of rendering
  // the error body as if it were the feed (which was hiding 500s as "empty home").
  if (res.status < 200 || res.status >= 300) {
    const body = typeof res.data === "string" ? res.data.slice(0, 200) : JSON.stringify(res.data).slice(0, 200);
    console.error(`[nativeGet] ${path} → HTTP ${res.status}`, body);
    throw new Error(`HTTP ${res.status} from ${path}`);
  }
  let data: any = res.data;
  if (typeof data === "string") {
    const t = data.trim();
    if (t && (t[0] === "{" || t[0] === "[")) {
      try { data = JSON.parse(t); } catch { /* keep string */ }
    }
  }
  return data;
}

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
  isSponsored?: boolean;
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
  iconColor?: string | null;
  providerCount: number;
  recentBookings: number;
  weeklyBookings: number;
  growthRate: number;
  trendDirection: 'up' | 'down' | 'stable';
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
  format?: 'rating';
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

export interface HomeFeedProduct {
  id: string;
  name: string;
  photoUrl: string | null;
  photoUrls: string[];
  price: number | null;
  currency: string;
  productType: 'product' | 'service';
  description: string | null;
  isHero?: boolean;
  providerId: string;
  providerName: string;
  providerImage: string | null;
  providerCity: string | null;
  providerArea: string | null;
  providerStatus: string;
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
  bestProducts: HomeFeedProduct[];
  // Personalized products picked from providers in the user's top categories.
  // Same shape as bestProducts; derived server-side from personalizedCategories
  // → providers in those categories → their hero/top products.
  forYouProducts?: HomeFeedProduct[] | null;
}

// ─── API Functions ──────────────────────────────────────────────────

// CapacitorHttp's native adapter sometimes hands back the response body as a
// raw string instead of parsed JSON, bypassing axios's transformResponse.
// Normalize at the call site so the home page renders regardless of adapter.
function normalizeBody(data: unknown): any {
  if (data == null) return data;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return null;
    if (trimmed[0] === '{' || trimmed[0] === '[') {
      try { return JSON.parse(trimmed); } catch { return null; }
    }
    return null;
  }
  return data;
}

const isNative = () => Capacitor.isNativePlatform?.() === true;

export const getHomeFeed = async (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<HomeFeedResponse> => {
  const data = isNative()
    ? await nativeGet(HOME_URLS.FEED, params)
    : normalizeBody((await apiClient.get(HOME_URLS.FEED, { params })).data);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {} as HomeFeedResponse;
  }
  return data as HomeFeedResponse;
};

export const getLiveActivity = async (params?: {
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<LiveActivity[]> => {
  const data = isNative()
    ? await nativeGet(HOME_URLS.LIVE_ACTIVITY, params)
    : normalizeBody((await apiClient.get(HOME_URLS.LIVE_ACTIVITY, { params })).data);
  return Array.isArray(data) ? data : [];
};

export const getCategoryProviders = async (params: {
  slug: string;
  lat?: number;
  lng?: number;
  city?: string;
  limit?: number;
}): Promise<HomeProvider[]> => {
  const data = isNative()
    ? await nativeGet(HOME_URLS.CATEGORY_PROVIDERS, params)
    : normalizeBody((await apiClient.get(HOME_URLS.CATEGORY_PROVIDERS, { params })).data);
  return Array.isArray(data) ? data : [];
};
