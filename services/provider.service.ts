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
