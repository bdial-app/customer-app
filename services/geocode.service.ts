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

// Session token for bundling autocomplete + place details into one billing charge
let currentSessionToken: string | null = null;

/** Generate a new session token (call when user starts a new search interaction) */
export const newSearchSession = (): string => {
  currentSessionToken = crypto.randomUUID();
  return currentSessionToken;
};

export const searchGeocode = async (
  query: string,
): Promise<SearchGeocodeResult[]> => {
  // Auto-create session token if none exists
  if (!currentSessionToken) {
    newSearchSession();
  }
  const { data } = await apiClient.get(GEOCODE_URLS.SEARCH, {
    params: { query, sessionToken: currentSessionToken },
  });
  return data;
};

/** Reset session token after user selects a place (session ends) */
export const endSearchSession = (): void => {
  currentSessionToken = null;
};
