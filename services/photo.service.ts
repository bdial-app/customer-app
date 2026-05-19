import apiClient from "@/utils/axios";
import { PHOTO_URLS } from "@/utils/urls";
import { ProviderDetailsPhoto } from "./provider.service";
import { compressImageFile, compressImageFiles, COMPRESS_PRESETS } from "@/utils/compress-image";

// ─── API Functions ──────────────────────────────────────────────────

export const uploadProviderPhotos = async (
  providerId: string,
  files: File[],
): Promise<ProviderDetailsPhoto[]> => {
  const compressed = await compressImageFiles(files, COMPRESS_PRESETS.product);
  const formData = new FormData();
  compressed.forEach((file) => formData.append("files", file));

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

export const uploadProviderProfileImage = async (
  providerId: string,
  file: File,
  field: "bannerImageUrl" | "profilePhotoUrl",
): Promise<{ url: string; field: string }> => {
  const compressed = await compressImageFile(file, COMPRESS_PRESETS.profile);
  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("field", field);

  const { data } = await apiClient.post(
    PHOTO_URLS.UPLOAD_PROFILE_IMAGE(providerId),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
};
