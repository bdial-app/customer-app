import apiClient from "@/utils/axios";
import { PRODUCT_URLS } from "@/utils/urls";

export interface ProductDetail {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  photoUrl: string | null;
  photoUrls: string[];
  isActive: boolean;
  displayOrder: number;
}

export interface ProductProviderSummary {
  id: string;
  userId: string;
  brandName: string;
  description: string | null;
  profilePhotoUrl: string | null;
  city: string;
  area: string | null;
  contactNumber: string;
  isWomenLed: boolean;
  communityVerified: boolean;
  photos: Array<{ id: string; imageUrl: string; displayOrder: number }>;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface ProductReview {
  id: string;
  providerId: string;
  reviewerId: string;
  starRating: number;
  reviewText: string | null;
  status: string;
  postedAt: string;
  reviewer?: { id: string; name: string } | null;
}

export interface ProductDetailsResponse {
  product: ProductDetail;
  provider: ProductProviderSummary | null;
  related: ProductDetail[];
  stats: {
    rating: number;
    reviewCount: number;
    ratingDist: number[];
  };
  reviews: ProductReview[];
}

export const getProductById = async (
  id: string,
): Promise<ProductDetailsResponse> => {
  const { data } = await apiClient.get(PRODUCT_URLS.BY_ID(id));
  return data;
};

export interface CreateProductPayload {
  providerId: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  photoUrl?: string;
  photoUrls?: string[];
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  photoUrl?: string;
  photoUrls?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

export const createProduct = async (payload: CreateProductPayload): Promise<ProductDetail> => {
  const { data } = await apiClient.post(PRODUCT_URLS.CREATE, payload);
  return data;
};

export const updateProduct = async (id: string, payload: UpdateProductPayload): Promise<ProductDetail> => {
  const { data } = await apiClient.patch(PRODUCT_URLS.UPDATE(id), payload);
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await apiClient.delete(PRODUCT_URLS.DELETE(id));
};

export const uploadProductImage = async (
  file: File,
): Promise<{ url: string; storageKey: string }> => {
  const { compressImageFile, COMPRESS_PRESETS } = await import("@/utils/compress-image");
  const compressed = await compressImageFile(file, COMPRESS_PRESETS.product);
  const formData = new FormData();
  formData.append("file", compressed);
  const { data } = await apiClient.post(PRODUCT_URLS.UPLOAD_IMAGE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
