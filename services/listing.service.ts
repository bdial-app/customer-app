import apiClient from "@/utils/axios";
import { LISTING_URLS } from "@/utils/urls";

// ─── Types ──────────────────────────────────────────────────────────

export interface ListingPhoto {
  id: string;
  listingId: string;
  imageUrl: string;
  storageKey: string;
  displayOrder: number;
  uploadedAt: string;
}

export interface ListingProduct {
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

export interface ListingReview {
  id: string;
  listingId: string;
  reviewerId: string;
  starRating: number;
  reviewText: string | null;
  status: string;
  postedAt: string;
  reviewer?: {
    id: string;
    name: string;
  };
}

export interface ListingData {
  id: string;
  providerId: string;
  businessName: string;
  description: string | null;
  contactPhone: string | null;
  city: string;
  area: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  isWomenLed: boolean;
  communityVerified: boolean;
  status: "pending" | "live" | "rejected" | "inactive";
  rejectionNote: string | null;
  submittedAt: string;
  approvedAt: string | null;
  updatedAt: string;
  photos: ListingPhoto[];
  products: ListingProduct[];
  reviews: ListingReview[];
  listingCategories: any[];
}

export interface CreateListingPayload {
  businessName: string;
  description?: string;
  contactPhone?: string;
  city: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  categoryIds?: string[];
}

export interface UpdateListingPayload {
  businessName?: string;
  description?: string;
  contactPhone?: string;
  city?: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  categoryIds?: string[];
}

// ─── API Functions ──────────────────────────────────────────────────

export const getMyListings = async (): Promise<ListingData[]> => {
  const { data } = await apiClient.get(LISTING_URLS.MY_LISTINGS);
  return data;
};

export const getListingById = async (id: string): Promise<ListingData> => {
  const { data } = await apiClient.get(LISTING_URLS.BY_ID(id));
  return data;
};

export const createListing = async (
  payload: CreateListingPayload,
): Promise<ListingData> => {
  const { data } = await apiClient.post(LISTING_URLS.CREATE, payload);
  return data;
};

export const updateListing = async (
  id: string,
  payload: UpdateListingPayload,
): Promise<ListingData> => {
  const { data } = await apiClient.patch(LISTING_URLS.UPDATE(id), payload);
  return data;
};

export const deleteListing = async (id: string): Promise<void> => {
  await apiClient.delete(LISTING_URLS.DELETE(id));
};
