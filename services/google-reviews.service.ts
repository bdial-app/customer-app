import apiClient from "@/utils/axios";

// ─── Types ──────────────────────────────────────────────────────────

export interface GoogleReview {
  source: "google";
  authorName: string;
  authorPhotoUrl: string | null;
  authorUrl: string | null;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  time: number;
  googleAttribution: {
    authorUrl: string | null;
    photoUrl: string | null;
  };
}

export interface CombinedReviewsAggregates {
  combinedRating: number | null;
  combinedReviewCount: number | null;
  appRating: number | null;
  appReviewCount: number;
  googleRating: number | null;
  googleReviewCount: number | null;
  trustLevel: "unverified" | "basic" | "verified" | "trusted";
}

export interface CombinedReviewsResponse {
  appReviews: {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  googleReviews: GoogleReview[];
  aggregates: CombinedReviewsAggregates;
}

// ─── API Functions ──────────────────────────────────────────────────

export const getCombinedReviews = async (
  providerId: string,
  page = 1,
  limit = 20,
): Promise<CombinedReviewsResponse> => {
  const { data } = await apiClient.get(
    `/google-reviews/provider/${providerId}/combined`,
    { params: { page, limit } },
  );
  return data;
};

export const getGoogleReviews = async (
  providerId: string,
): Promise<GoogleReview[]> => {
  const { data } = await apiClient.get(
    `/google-reviews/provider/${providerId}`,
  );
  return data;
};

// ─── Provider Self-Service (Linking Flow) ───────────────────────────

export interface GooglePlaceCandidate {
  placeId: string;
  name: string;
  address: string;
}

export const verifyGooglePlace = async (
  providerId: string,
  phoneNumber?: string,
): Promise<GooglePlaceCandidate[]> => {
  const { data } = await apiClient.post(
    `/google-reviews/verify/${providerId}`,
    phoneNumber ? { phoneNumber } : {},
  );
  return data;
};

export const confirmGooglePlace = async (
  providerId: string,
  placeId: string,
): Promise<void> => {
  await apiClient.post(`/google-reviews/confirm/${providerId}`, { placeId });
};

export const unlinkGooglePlace = async (
  providerId: string,
): Promise<void> => {
  await apiClient.delete(`/google-reviews/unlink/${providerId}`);
};
