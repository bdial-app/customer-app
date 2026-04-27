import apiClient from "@/utils/axios";
import { GEOCODE_URLS } from "@/utils/urls";

export interface ReverseGeocodePayload {
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResponse {
  label: string;
  city: string;
  area: string;
  pincode: string | null;
  fullAddress: string;
  placeId: string;
}

export interface SearchGeocodeResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
}

export const reverseGeocode = async (
  payload: ReverseGeocodePayload,
): Promise<ReverseGeocodeResponse> => {
  const { data } = await apiClient.post(GEOCODE_URLS.REVERSE, payload);
  return data;
};

export const searchGeocode = async (
  query: string,
): Promise<SearchGeocodeResult[]> => {
  const { data } = await apiClient.get(GEOCODE_URLS.SEARCH, {
    params: { query: query },
  });
  return data;
};
