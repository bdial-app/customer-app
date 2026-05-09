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

export const getSubCategories = async (parentId: string): Promise<Category[]> => {
  const { data } = await apiClient.get(CATEGORY_URLS.SUB_CATEGORIES(parentId));
  return data;
};
