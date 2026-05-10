import apiClient from "@/utils/axios";
import { CONFIG_URLS } from "@/utils/urls";

export interface ServiceableCity {
  id: string;
  name: string;
  slug: string;
  status: "active" | "coming_soon" | "disabled";
  lat: number;
  lng: number;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  matchedCity: string | null;
}

export const getServiceableCities = async (): Promise<ServiceableCity[]> => {
  const { data } = await apiClient.get(CONFIG_URLS.SERVICEABLE_CITIES);
  return data;
};

export const checkServiceability = async (params: {
  city?: string;
  lat?: number;
  lng?: number;
}): Promise<ServiceabilityResult> => {
  const { data } = await apiClient.get(CONFIG_URLS.CHECK_SERVICEABILITY, {
    params,
  });
  return data;
};

export const requestCity = async (city: string, deviceId?: string): Promise<void> => {
  await apiClient.post(CONFIG_URLS.CITY_REQUESTS, { city, deviceId });
};
