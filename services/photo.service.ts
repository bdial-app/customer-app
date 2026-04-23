import apiClient from "@/utils/axios";
import { PHOTO_URLS } from "@/utils/urls";
import { ProviderDetailsPhoto } from "./provider.service";

// ─── API Functions ──────────────────────────────────────────────────

export const uploadProviderPhotos = async (
  providerId: string,
  files: File[],
): Promise<ProviderDetailsPhoto[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await apiClient.post(
    PHOTO_URLS.UPLOAD_PROVIDER(providerId),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
};

export const deleteProviderPhoto = async (photoId: string): Promise<void> => {
  await apiClient.delete(PHOTO_URLS.DELETE_PROVIDER(photoId));
};

export const reorderProviderPhotos = async (
  providerId: string,
  orderedIds: string[],
): Promise<void> => {
  await apiClient.patch(PHOTO_URLS.REORDER_PROVIDER(providerId), { orderedIds });
};
