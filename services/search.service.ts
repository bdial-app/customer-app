import apiClient from "@/utils/axios";

// ─── URLs ──────────────────────────────────────────────────────

export const SEARCH_URLS = {
  SEARCH: "/search",
  SUGGESTIONS: "/search/suggestions",
  TRENDING: "/search/trending",
  RECENT: "/search/recent",
};

// ─── Types ─────────────────────────────────────────────────────

export type SearchEntityType = "all" | "providers" | "products" | "categories" | "services";
export type SearchSortBy = "relevance" | "distance" | "rating" | "newest";

export interface SearchParams {
  q: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  type?: SearchEntityType;
  categoryIds?: string[];
  sortBy?: SearchSortBy;
  minRating?: number;
  city?: string;
  verifiedOnly?: boolean;
  womenLedOnly?: boolean;
}

export interface SuggestionParams {
  q: string;
  lat?: number;
  lng?: number;
  limit?: number;
}

export interface SearchSuggestion {
  text: string;
  type: "provider" | "product" | "category";
  id: string;
  subtitle?: string;
  imageUrl?: string;
  isSponsored?: boolean;
  hasActiveOffer?: boolean;
  productType?: "product" | "service";
}

export interface ProviderSearchResult {
  id: string;
  brandName: string;
  description: string | null;
  profilePhotoUrl: string | null;
  bannerImageUrl: string | null;
  city: string;
  area: string | null;
  status: string;
  isWomenLed: boolean;
  isFeatured: boolean;
  distance: number | null;
  avgRating: number | null;
  reviewCount: number;
  categories: string | null;
  relevanceScore: number;
  isSponsored?: boolean;
  sponsoredListingId?: string;
  hasActiveOffer?: boolean;
  offerTitle?: string;
  discountValue?: number;
  discountType?: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  photoUrl: string | null;
  productType?: 'product' | 'service';
  providerId: string;
  providerName: string;
  providerCity: string;
  providerArea: string | null;
  distance: number | null;
  relevanceScore: number;
}

export interface CategorySearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  parentId: string | null;
  providerCount: number;
  relevanceScore: number;
}

export interface SearchFallback {
  relaxedProviders?: ProviderSearchResult[];
  relatedCategories?: CategorySearchResult[];
  trending?: { query: string; count: number }[];
  nearbyPopular?: ProviderSearchResult[];
  peopleAlsoSearched?: string[];
}

export interface SearchResponse {
  sponsored: ProviderSearchResult[];
  deals: ProviderSearchResult[];
  topRated: ProviderSearchResult[];
  providers: { data: ProviderSearchResult[]; total: number };
  products: { data: ProductSearchResult[]; total: number };
  categories: { data: CategorySearchResult[]; total: number };
  meta: { query: string; tookMs: number; totalResults: number; didYouMean?: string };
  fallback?: SearchFallback;
}

export interface TrendingSearch {
  query: string;
  count: number;
}

export interface RecentSearch {
  query: string;
  createdAt: string;
}

// ─── API Functions ─────────────────────────────────────────────

export async function searchAll(params: SearchParams): Promise<SearchResponse> {
  const { categoryIds, ...rest } = params;
  const res = await apiClient.get<SearchResponse>(SEARCH_URLS.SEARCH, {
    params: {
      ...rest,
      ...(categoryIds?.length ? { categoryIds: categoryIds.join(',') } : {}),
      ...(rest.verifiedOnly ? { verifiedOnly: true } : {}),
      ...(rest.womenLedOnly ? { womenLedOnly: true } : {}),
    },
  });
  return res.data;
}

export async function getSuggestions(
  params: SuggestionParams
): Promise<SearchSuggestion[]> {
  const res = await apiClient.get<SearchSuggestion[]>(
    SEARCH_URLS.SUGGESTIONS,
    { params }
  );
  return res.data;
}

export async function getTrendingSearches(
  city?: string,
  limit?: number
): Promise<TrendingSearch[]> {
  const res = await apiClient.get<TrendingSearch[]>(SEARCH_URLS.TRENDING, {
    params: { city, limit },
  });
  return res.data;
}

export async function getRecentSearches(
  limit?: number
): Promise<RecentSearch[]> {
  const res = await apiClient.get<RecentSearch[]>(SEARCH_URLS.RECENT, {
    params: { limit },
  });
  return res.data;
}

export async function clearRecentSearches(): Promise<void> {
  await apiClient.delete(SEARCH_URLS.RECENT);
}
