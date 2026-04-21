import apiClient from "@/utils/axios";
import { SAVED_ITEM_URLS } from "@/utils/urls";

export interface SavedItemData {
  id: string;
  itemId: string;
  itemType: "provider" | "product";
  savedAt: string;
  name: string;
  image: string | null;
  category: string;
  rating?: number;
  reviews?: number;
  location?: string;
  verified?: boolean;
  isOpen?: boolean;
  contactNumber?: string;
  price?: number | null;
  currency?: string;
  isActive?: boolean;
  providerId?: string;
  providerName?: string;
}

export interface SavedItemId {
  itemId: string;
  itemType: "provider" | "product";
}

export const toggleSavedItem = async (
  itemId: string,
  itemType: "provider" | "product",
): Promise<{ saved: boolean }> => {
  const { data } = await apiClient.post(SAVED_ITEM_URLS.TOGGLE, {
    itemId,
    itemType,
  });
  return data;
};

export const getSavedItems = async (): Promise<SavedItemData[]> => {
  const { data } = await apiClient.get(SAVED_ITEM_URLS.LIST);
  return data;
};

export const getSavedItemIds = async (
  itemType?: "provider" | "product",
): Promise<SavedItemId[]> => {
  const { data } = await apiClient.get(SAVED_ITEM_URLS.IDS, {
    params: itemType ? { itemType } : undefined,
  });
  return data;
};

export const checkSavedItem = async (
  itemId: string,
  itemType: "provider" | "product",
): Promise<{ saved: boolean }> => {
  const { data } = await apiClient.get(
    SAVED_ITEM_URLS.CHECK(itemId, itemType),
  );
  return data;
};
