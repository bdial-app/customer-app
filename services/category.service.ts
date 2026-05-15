import apiClient from "@/utils/axios";
import { CATEGORY_URLS } from "@/utils/urls";

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  children?: Category[];
}

export interface PaginatedCategories {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getTopLevelCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get(CATEGORY_URLS.TOP_LEVEL);
  return Array.isArray(data) ? data : [];
};

export const getAllCategories = async (
  page = 1,
  limit = 20,
): Promise<PaginatedCategories> => {
  const { data } = await apiClient.get(CATEGORY_URLS.LIST, {
    params: { page, limit },
  });
  return data;
};

export interface SubCategory extends Category {
  providerCount?: number;
  recentBookings?: number;
}

export const getSubCategories = async (parentId: string): Promise<SubCategory[]> => {
  const { data } = await apiClient.get(CATEGORY_URLS.SUB_CATEGORIES(parentId));
  // Backend returns { data: [...], meta: {...} } — unwrap properly
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export interface CategorySearchResult {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  description?: string;
  parentId: string | null;
  parentName?: string;
  parentIcon?: string;
  providerCount: number;
}

export const searchCategoriesAPI = async (q: string, limit = 10): Promise<CategorySearchResult[]> => {
  const { data } = await apiClient.get(CATEGORY_URLS.SEARCH, { params: { q, limit } });
  return Array.isArray(data) ? data : [];
};

export interface SuggestedCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  description?: string;
  score: number;
}

export const suggestCategories = async (
  title: string,
  description: string,
): Promise<SuggestedCategory[]> => {
  const { data } = await apiClient.post(CATEGORY_URLS.SUGGEST, { title, description });
  return Array.isArray(data) ? data : [];
};
