import apiClient from "@/utils/axios";
import type { ProviderData, ProviderDetailsProduct, ProviderVerification } from "@/services/provider.service";

/**
 * "List your business", built for real phones:
 *  - progress is a draft saved to the account (and the device) as people go,
 *  - each photo uploads on its own as soon as it is picked,
 *  - the final submit is a small request with photo URLs — fast, and safe to
 *    send again (the server hands back the business if it already exists).
 */

export type OnboardingMediaKind = "banner" | "profile" | "product" | "verification";

export interface OnboardingDraftEnvelope<T = unknown> {
  data: T;
  step: number;
  updatedAt: string;
}

export const getOnboardingDraft = async <T>(): Promise<OnboardingDraftEnvelope<T> | null> => {
  const { data } = await apiClient.get("/provider-onboarding/draft", { timeout: 15_000 });
  return data && typeof data === "object" && "data" in data ? (data as OnboardingDraftEnvelope<T>) : null;
};

export const saveOnboardingDraft = async (data: unknown, step: number): Promise<{ updatedAt: string }> => {
  const { data: res } = await apiClient.put("/provider-onboarding/draft", { data, step }, { timeout: 15_000 });
  return res;
};

export const deleteOnboardingDraft = async (): Promise<void> => {
  await apiClient.delete("/provider-onboarding/draft", { timeout: 15_000 });
};

/** One photo or document. Bounded in time; reports progress where the platform can. */
export const uploadOnboardingMedia = async (
  kind: OnboardingMediaKind,
  file: File,
  opts: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<{ url: string; storageKey: string }> => {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file, file.name || `${kind}.jpg`);
  const { data } = await apiClient.post("/provider-onboarding/media", form, {
    timeout: 90_000,
    signal: opts.signal,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total) opts.onProgress?.(Math.min(1, e.loaded / e.total));
    },
  });
  if (!data?.url) throw new Error("Upload finished without a link");
  return data;
};

export interface SubmitListingPayload {
  brandName: string;
  description: string;
  contactNumber: string;
  city: string;
  area: string;
  address: string;
  pincode: string;
  openTime?: string;
  closeTime?: string;
  latitude?: string;
  longitude?: string;
  isWomenLed?: boolean;
  categoryIds?: string[];
  bannerImageUrl?: string;
  profilePhotoUrl?: string;
  aadhaarDocUrl?: string;
  products?: Array<{
    name: string;
    description?: string;
    price?: number;
    productType?: "product" | "service";
    photoUrls?: string[];
  }>;
  websiteUrl?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  youtubeHandle?: string;
  whatsappNumber?: string;
  linkedinHandle?: string;
}

/** The final step: text and photo URLs only (photos are already uploaded). */
export const submitListing = async (
  payload: SubmitListingPayload,
  signal?: AbortSignal,
): Promise<{ provider: ProviderData; verification: ProviderVerification | null; products: ProviderDetailsProduct[]; alreadyListed?: boolean }> => {
  const { products, ...rest } = payload;
  const { data } = await apiClient.post(
    "/providers/become-provider",
    // The endpoint takes products as a JSON string (it also serves multipart).
    { ...rest, ...(products?.length ? { products: JSON.stringify(products) } : {}) },
    { timeout: 45_000, signal },
  );
  return data;
};
