import apiClient from "@/utils/axios";
import { PRODUCT_URLS } from "@/utils/urls";

export interface ProductDetail {
  id: string;
  listingId: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  photoUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface ProductListingSummary {
  id: string;
  businessName: string;
  description: string | null;
  city: string;
  area: string | null;
  isWomenLed: boolean;
  communityVerified: boolean;
  photos: Array<{ id: string; imageUrl: string; displayOrder: number }>;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface ProductProviderSummary {
  id: string;
  brandName: string;
  profilePhotoUrl: string | null;
  city: string;
  area: string | null;
  contactNumber: string;
}

export interface ProductReview {
  id: string;
  listingId: string;
  reviewerId: string;
  starRating: number;
  reviewText: string | null;
  status: string;
  postedAt: string;
  reviewer?: { id: string; name: string } | null;
}

export interface ProductDetailsResponse {
  product: ProductDetail;
  listing: ProductListingSummary | null;
  provider: ProductProviderSummary | null;
  related: ProductDetail[];
  stats: {
    rating: number;
    reviewCount: number;
    ratingDist: number[];
  };
  reviews: ProductReview[];
}

export const getProductById = async (
  id: string,
): Promise<ProductDetailsResponse> => {
  const { data } = await apiClient.get(PRODUCT_URLS.BY_ID(id));
  return data;
};
