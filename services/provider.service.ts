import apiClient from "@/utils/axios";
import { PROVIDER_URLS } from "@/utils/urls";

export interface ProviderNearbyParams {
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  categoryIds?: string[];
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
  ijamatNumber?: string;
  ijamatExpiry?: string;
  ijamatDocUrl?: string;
  latitude?: string;
  longitude?: string;
  aadhaarFile: File;
}

export interface ProviderStatusResponse {
  providerStatus: "not_applied" | "pending" | "in_review" | "approved" | "rejected";
  verificationStatus: string | null;
  provider: any | null;
  verification: any | null;
}

export const getNearbyProviders = async (
  params: ProviderNearbyParams,
): Promise<NearbyProviderResponse> => {
  const { data } = await apiClient.get(PROVIDER_URLS.NEARBY, { params });
  return data;
};

export const getProviderById = async (id: string): Promise<any> => {
  const { data } = await apiClient.get(PROVIDER_URLS.BY_ID(id));
  return data;
};

export const becomeProvider = async (
  payload: BecomeProviderPayload,
): Promise<{ provider: any; verification: any }> => {
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
  formData.append("file", payload.aadhaarFile);

  const { data } = await apiClient.post(PROVIDER_URLS.BECOME_PROVIDER, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
