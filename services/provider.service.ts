import apiClient from "@/utils/axios";
import { PROVIDER_URLS, REVIEW_URLS } from "@/utils/urls";

// ─── Types ──────────────────────────────────────────────────────────

export interface ProviderNearbyParams {
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  categoryIds?: string[];
  sortBy?: 'distance' | 'rating' | 'newest' | 'reviews';
  minRating?: number;
  verifiedOnly?: boolean;
  womenLedOnly?: boolean;
}

export interface NearbyProviderResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    radius: number;
  };
}

export interface BecomeProviderPayload {
  userId: string;
  brandName: string;
  description: string;
  contactNumber: string;
  city: string;
  area: string;
  address: string;
  pincode: string;
  openTime?: string;
  closeTime?: string;
  profilePhotoUrl?: string;
  bannerImageUrl?: string;
  bannerImage?: File;
  profileImage?: File;
  ijamatNumber?: string;
  ijamatExpiry?: string;
  ijamatDocUrl?: string;
  latitude?: string;
  longitude?: string;
  aadhaarFile?: File;
  isWomenLed?: boolean;
  categoryIds?: string[];
  products?: Array<{ name: string; description?: string; price?: number; currency?: string; imageCount?: number }>;
  productImages?: File[];
}

export interface ProviderData {
  id: string;
  userId: string;
  brandName: string;
  description: string | null;
  address: string | null;
  city: string;
  area: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  contactNumber: string;
  openTime: string | null;
  closeTime: string | null;
  isAvailable: boolean;
  profilePhotoUrl: string | null;
  bannerImageUrl: string | null;
  status: "pending" | "in_review" | "active" | "suspended" | "unverified" | "disabled";
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  user?: any;
}

export interface ProviderStatusResponse {
  providerStatus: "not_applied" | "pending" | "in_review" | "approved" | "rejected" | "disabled" | "deleted" | "suspended";
  verificationStatus: string | null;
  provider: ProviderData | null;
  verification: any | null;
  preferredMode?: "customer" | "provider";
}

export interface UpdateProviderPayload {
  brandName?: string;
  description?: string;
  address?: string;
  city?: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contactNumber?: string;
  openTime?: string;
  closeTime?: string;
  isAvailable?: boolean;
  profilePhotoUrl?: string;
  bannerImageUrl?: string;
}

// ─── API Functions ──────────────────────────────────────────────────

export const getNearbyProviders = async (
  params: ProviderNearbyParams,
): Promise<NearbyProviderResponse> => {
  const { data } = await apiClient.get(PROVIDER_URLS.NEARBY, { params });
  return data;
};

export interface WomenLedHubParams {
  page?: number;
  limit?: number;
  city?: string;
  categoryIds?: string;
  sortBy?: 'rating' | 'newest' | 'reviews';
  minRating?: number;
  lat?: number;
  lng?: number;
}

export interface WomenLedHubResponse {
  providers: any[];
  stats: { total: number; categoriesCovered: number; avgRating: number };
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const getWomenLedHub = async (
  params: WomenLedHubParams,
): Promise<WomenLedHubResponse> => {
  const { data } = await apiClient.get(PROVIDER_URLS.WOMEN_LED, { params });
  return data;
};

export const getProviderById = async (id: string): Promise<any> => {
  const { data } = await apiClient.get(PROVIDER_URLS.BY_ID(id));
  return data;
};

export interface ProviderDetailsPhoto {
  id: string;
  providerId: string;
  imageUrl: string;
  storageKey: string;
  displayOrder: number;
  uploadedAt: string;
}

export interface ProviderDetailsProduct {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  photoUrl: string | null;
  photoUrls: string[];
  isActive: boolean;
  displayOrder: number;
}

export interface ProviderDetailsReview {
  id: string;
  providerId: string;
  reviewerId: string;
  starRating: number;
  reviewText: string | null;
  status: string;
  postedAt: string;
  replyText?: string | null;
  repliedAt?: string | null;
  reviewer?: {
    id: string;
    name: string;
  } | null;
  photos?: Array<{ id: string; imageUrl: string }>;
}

export interface ProviderDetailsCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProviderDetailsBadge {
  id: string;
  providerId: string;
  type: string;
  createdAt: string;
  isActive: boolean;
}

export interface ProviderDetailsOffer {
  id: string;
  providerId: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface ProviderDetailsResponse {
  provider: ProviderData;
  categories: ProviderDetailsCategory[];
  photos: ProviderDetailsPhoto[];
  products: ProviderDetailsProduct[];
  reviews: ProviderDetailsReview[];
  badges: ProviderDetailsBadge[];
  activeOffers: ProviderDetailsOffer[];
  isSponsored: boolean;
  sponsorEndsAt: string | null;
  stats: {
    rating: number;
    reviewCount: number;
    ratingDist: number[];
    photoCount: number;
    productCount: number;
    priceRange: { min: number; max: number; currency: string } | null;
  };
}

export const getProviderDetails = async (
  id: string,
): Promise<ProviderDetailsResponse> => {
  const { data } = await apiClient.get(PROVIDER_URLS.DETAILS(id));
  return data;
};

export const becomeProvider = async (
  payload: BecomeProviderPayload,
): Promise<{ provider: any; verification: any; products: any[] }> => {
  const formData = new FormData();
  formData.append("userId", payload.userId);
  formData.append("brandName", payload.brandName);
  formData.append("description", payload.description);
  formData.append("contactNumber", payload.contactNumber);
  formData.append("city", payload.city);
  formData.append("area", payload.area);
  formData.append("address", payload.address);
  formData.append("pincode", payload.pincode);
  if (payload.openTime) formData.append("openTime", payload.openTime);
  if (payload.closeTime) formData.append("closeTime", payload.closeTime);
  if (payload.profilePhotoUrl) formData.append("profilePhotoUrl", payload.profilePhotoUrl);
  if (payload.latitude) formData.append("latitude", payload.latitude);
  if (payload.longitude) formData.append("longitude", payload.longitude);
  if (payload.ijamatNumber) formData.append("ijamatNumber", payload.ijamatNumber);
  if (payload.ijamatExpiry) formData.append("ijamatExpiry", payload.ijamatExpiry);
  if (payload.ijamatDocUrl) formData.append("ijamatDocUrl", payload.ijamatDocUrl);
  if (payload.aadhaarFile) formData.append("file", payload.aadhaarFile);
  if (payload.bannerImage) formData.append("bannerImage", payload.bannerImage);
  if (payload.profileImage) formData.append("profileImage", payload.profileImage);
  if (payload.bannerImageUrl) formData.append("bannerImageUrl", payload.bannerImageUrl);
  if (payload.categoryIds?.length) {
    payload.categoryIds.forEach((id) => formData.append("categoryIds", id));
  }
  // Products as JSON string + individual image files
  if (payload.products?.length) {
    formData.append("products", JSON.stringify(payload.products));
    payload.productImages?.forEach((img) => {
      formData.append("productImages", img);
    });
  }

  const { data } = await apiClient.post(PROVIDER_URLS.BECOME_PROVIDER, formData);
  return data;
};

export const getMyProviderStatus = async (): Promise<ProviderStatusResponse> => {
  const { data } = await apiClient.get(PROVIDER_URLS.MY_STATUS);
  return data;
};

export const sendProviderOtp = async (mobileNumber: string): Promise<any> => {
  const { data } = await apiClient.post(PROVIDER_URLS.SEND_OTP, { mobileNumber });
  return data;
};

export const verifyProviderOtp = async (
  mobileNumber: string,
  otp: string,
): Promise<{ verified: boolean }> => {
  const { data } = await apiClient.post(PROVIDER_URLS.VERIFY_OTP, { mobileNumber, otp });
  return data;
};

export const updateProvider = async (
  id: string,
  payload: UpdateProviderPayload,
): Promise<ProviderData> => {
  const { data } = await apiClient.patch(PROVIDER_URLS.UPDATE(id), payload);
  return data;
};

export const updateProviderCategories = async (
  id: string,
  categoryIds: string[],
): Promise<{ id: string; name: string; slug: string }[]> => {
  const { data } = await apiClient.patch(
    PROVIDER_URLS.UPDATE_CATEGORIES(id),
    { categoryIds },
  );
  return data;
};

export const submitVerification = async (
  file: File,
  docType?: string,
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  if (docType) formData.append("docType", docType);

  const { data } = await apiClient.post(PROVIDER_URLS.SUBMIT_VERIFICATION, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export interface ProviderAnalytics {
  totalProducts: number;
  totalReviews: number;
  averageRating: number;
  totalEnquiries: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  recentReviews: Array<{
    id: string;
    starRating: number;
    reviewText: string | null;
    postedAt: string;
    reviewer: { id: string; name: string } | null;
  }>;
}

export const getMyAnalytics = async (): Promise<ProviderAnalytics> => {
  const { data } = await apiClient.get(PROVIDER_URLS.MY_ANALYTICS);
  return data;
};

export const replyToReview = async (
  reviewId: string,
  replyText: string,
): Promise<any> => {
  const { data } = await apiClient.post(`/reviews/${reviewId}/reply`, { replyText });
  return data;
};

export interface SubmitReviewPayload {
  providerId: string;
  starRating: number;
  reviewText?: string;
}

export const submitReview = async (payload: SubmitReviewPayload): Promise<any> => {
  const { data } = await apiClient.post(REVIEW_URLS.CREATE, payload);
  return data;
};

// ─── Offers / Deals ─────────────────────────────────────────────────

export interface ProviderOfferFull {
  id: string;
  providerId: string;
  title: string;
  description: string | null;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  usageCount: number;
  usageLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferPayload {
  title: string;
  description?: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
}

export type UpdateOfferPayload = Partial<CreateOfferPayload>;

export interface OfferLimits {
  totalDeals: number;
  maxTotalDeals: number;
  activeDeals: number;
  maxActiveDeals: number;
  requiresPayment: boolean;
}

export const getMyOffers = async (): Promise<ProviderOfferFull[]> => {
  const { data } = await apiClient.get(PROVIDER_URLS.MY_OFFERS);
  return data;
};

export const getOfferLimits = async (): Promise<OfferLimits> => {
  const { data } = await apiClient.get(PROVIDER_URLS.OFFER_LIMITS);
  return data;
};

export const createOffer = async (
  payload: CreateOfferPayload,
): Promise<ProviderOfferFull> => {
  const { data } = await apiClient.post(PROVIDER_URLS.MY_OFFERS, payload);
  return data;
};

export const updateOffer = async (
  offerId: string,
  payload: UpdateOfferPayload,
): Promise<ProviderOfferFull> => {
  const { data } = await apiClient.patch(PROVIDER_URLS.UPDATE_OFFER(offerId), payload);
  return data;
};

export const deleteOffer = async (offerId: string): Promise<{ deleted: boolean }> => {
  const { data } = await apiClient.delete(PROVIDER_URLS.DELETE_OFFER(offerId));
  return data;
};

// ─── Sponsorship Types ──────────────────────────────────────────────

export interface SponsorshipPlan {
  id: string;
  name: string;
  type: 'carousel' | 'inline' | 'top_result';
  price: number;
  duration: number;
  features: string[];
  recommended: boolean;
}

export interface SponsoredListing {
  id: string;
  providerId: string;
  type: 'carousel' | 'inline' | 'top_result';
  budgetAmount: number;
  spentAmount: number;
  costPerClick: number;
  impressions: number;
  clicks: number;
  targetCategoryIds: string[] | null;
  targetCities: string[] | null;
  targetRadius: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSponsorshipPayload {
  type: 'carousel' | 'inline' | 'top_result';
  budgetAmount: number;
  costPerClick?: number;
  targetCategoryIds?: string[];
  targetCities?: string[];
  targetRadius?: number;
  startsAt: string;
  endsAt: string;
}

export interface UpdateSponsorshipPayload {
  budgetAmount?: number;
  isActive?: boolean;
  endsAt?: string;
}

// ─── Sponsorship API Functions ──────────────────────────────────────

export const getSponsorshipPlans = async (): Promise<SponsorshipPlan[]> => {
  const { data } = await apiClient.get(PROVIDER_URLS.SPONSORSHIP_PLANS);
  return data;
};

export const getMySponsorships = async (): Promise<SponsoredListing[]> => {
  const { data } = await apiClient.get(PROVIDER_URLS.MY_SPONSORSHIPS);
  return data;
};

export const createSponsorship = async (payload: CreateSponsorshipPayload): Promise<SponsoredListing> => {
  const { data } = await apiClient.post(PROVIDER_URLS.MY_SPONSORSHIPS, payload);
  return data;
};

export const updateSponsorship = async (id: string, payload: UpdateSponsorshipPayload): Promise<SponsoredListing> => {
  const { data } = await apiClient.patch(PROVIDER_URLS.UPDATE_SPONSORSHIP(id), payload);
  return data;
};

// ─── Provider Disable / Enable / Delete ─────────────────────────────

export const disableMyProvider = async (): Promise<{ message: string; status: string }> => {
  const { data } = await apiClient.post(PROVIDER_URLS.DISABLE_PROVIDER);
  return data;
};

export const enableMyProvider = async (): Promise<{ message: string; status: string }> => {
  const { data } = await apiClient.post(PROVIDER_URLS.ENABLE_PROVIDER);
  return data;
};

export const deleteMyProvider = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(PROVIDER_URLS.DELETE_PROVIDER);
  return data;
};

export const getProviderCooldownStatus = async (): Promise<{
  canReEnable: boolean;
  disableRemainingHours: number | null;
  disabledAt: string | null;
  cooldownHours: number;
}> => {
  const { data } = await apiClient.get(PROVIDER_URLS.COOLDOWN_STATUS);
  return data;
};
