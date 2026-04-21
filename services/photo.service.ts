import apiClient from "@/utils/axios";
import { PHOTO_URLS } from "@/utils/urls";
import { ListingPhoto } from "./listing.service";

// ─── API Functions ──────────────────────────────────────────────────

export const uploadListingPhotos = async (
  listingId: string,
  files: File[],
): Promise<ListingPhoto[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await apiClient.post(
    PHOTO_URLS.UPLOAD_LISTING(listingId),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
};

export const deleteListingPhoto = async (photoId: string): Promise<void> => {
  await apiClient.delete(PHOTO_URLS.DELETE_LISTING(photoId));
};

export const reorderListingPhotos = async (
  listingId: string,
  orderedIds: string[],
): Promise<void> => {
  await apiClient.patch(PHOTO_URLS.REORDER_LISTING(listingId), { orderedIds });
};
