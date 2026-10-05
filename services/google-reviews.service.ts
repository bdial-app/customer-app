import apiClient from "@/utils/axios";
import type { ProviderDetailsReview } from "@/services/provider.service";

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
    data: ProviderDetailsReview[];
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
// An owner never picks a listing: the server finds the one Google has under
// the business's phone number, and links it once the owner has shown they
// control that number (their login number, or a code sent to the listing's).

export interface GooglePlacePreview {
  name: string;
  address: string;
  rating: number | null;
  userRatingCount: number | null;
}

export type GoogleConnectResult =
  | { status: "linked"; via: "login_number" | "code" }
  | { status: "already_linked" }
  | {
      status: "otp_required";
      maskedPhone: string;
      expiresInSeconds: number;
      devCode?: string;
      place: GooglePlacePreview | null;
    }
  | { status: "not_found"; numbersChecked: string[] }
  | { status: "ambiguous" }
  | { status: "taken" };

export const connectGoogleBusiness = async (
  providerId: string,
): Promise<GoogleConnectResult> => {
  const { data } = await apiClient.post(`/google-reviews/connect/${providerId}`);
  return data;
};

export const verifyGoogleConnectCode = async (
  providerId: string,
  code: string,
): Promise<GoogleConnectResult> => {
  const { data } = await apiClient.post(
    `/google-reviews/connect/${providerId}/verify`,
    { code },
  );
  return data;
};

export const unlinkGooglePlace = async (
  providerId: string,
): Promise<void> => {
  await apiClient.delete(`/google-reviews/unlink/${providerId}`);
};
