import apiClient from "@/utils/axios";
import { CATALOG_URLS, PRODUCT_URLS } from "@/utils/urls";

export type CatalogType = "product" | "service";
export type CatalogSort = "recommended" | "popular" | "nearest" | "price_low" | "price_high" | "newest";
export type CatalogArea = "nearby" | "city" | "all";

/** One product or service as every catalog surface shows it. */
export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  photoUrl: string | null;
  photoUrls: string[];
  productType: CatalogType;
  isHero: boolean;
  categoryId: string | null;
  categoryName: string | null;
  providerId: string;
  providerUserId: string;
  providerName: string;
  providerImage: string | null;
  providerCity: string | null;
  providerArea: string | null;
  verified: boolean;
  isWomenLed: boolean;
  rating: number;
  reviewCount: number;
  views: number;
  distance: number | null;
  approximateLocation: boolean;
}

/** Filters a shelf's "See all" opens the full listing with. */
export type CatalogSeeAll = Partial<
  Record<"sort" | "area" | "maxPrice" | "minRating" | "featured" | "categoryId", string>
>;

export interface CatalogShelf {
  key: string;
  title: string;
  subtitle: string | null;
  seeAll: CatalogSeeAll | null;
  items: CatalogItem[];
}

export interface CatalogCategoryChip {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  iconColor: string | null;
  itemCount: number;
}

export interface CatalogShelvesResponse {
  type: CatalogType;
  /** How wide the storefront had to look to find enough items. */
  scope: "nearby" | "city" | "all";
  totalItems: number;
  categories: CatalogCategoryChip[];
  shelves: CatalogShelf[];
}

export interface CatalogLocation {
  lat?: number;
  lng?: number;
  city?: string;
}

export interface CatalogBrowseParams extends CatalogLocation {
  type: CatalogType;
  categoryId?: string;
  sort?: CatalogSort;
  area?: CatalogArea;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verified?: boolean;
  womenLed?: boolean;
  priced?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface CatalogBrowseResponse {
  data: CatalogItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SimilarItemsResponse {
  data: CatalogItem[];
  /** similar: all close matches · mixed: matches topped up with popular items · popular: no close matches */
  mode: "similar" | "mixed" | "popular";
}

/** Drop unset values — the API rejects unknown or empty params. */
const clean = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== false),
  );

export const getCatalogShelves = async (
  params: CatalogLocation & { type: CatalogType },
): Promise<CatalogShelvesResponse> => {
  const { data } = await apiClient.get(CATALOG_URLS.SHELVES, { params: clean(params) });
  return data;
};

export const browseCatalog = async (params: CatalogBrowseParams): Promise<CatalogBrowseResponse> => {
  const { data } = await apiClient.get(CATALOG_URLS.BROWSE, { params: clean(params) });
  return data;
};

export const getSimilarItems = async (
  id: string,
  params: CatalogLocation & { limit?: number },
): Promise<SimilarItemsResponse> => {
  const { data } = await apiClient.get(PRODUCT_URLS.SIMILAR(id), { params: clean(params) });
  return data;
};
