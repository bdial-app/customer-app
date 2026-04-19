import apiClient from "@/utils/axios";
import { SAVED_LOCATION_URLS } from "@/utils/urls";

export interface CreateSavedLocationPayload {
  title: string;
  label: string;
  latitude: number;
  longitude: number;
  city: string;
  area: string;
  fullAddress: string;
  placeId: string;
}

export interface SavedLocation extends CreateSavedLocationPayload {
  id: string;
}

export const createSavedLocation = async (
  payload: CreateSavedLocationPayload,
): Promise<SavedLocation> => {
  const { data } = await apiClient.post(SAVED_LOCATION_URLS.CREATE, payload);
  return data;
};

export const getSavedLocations = async (): Promise<SavedLocation[]> => {
  const { data } = await apiClient.get(SAVED_LOCATION_URLS.LIST);
  return data;
};
