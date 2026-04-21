import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadListingPhotos,
  deleteListingPhoto,
  reorderListingPhotos,
} from "@/services/photo.service";
import { MY_LISTINGS_KEY } from "./useListing";

export const useUploadPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, files }: { listingId: string; files: File[] }) =>
      uploadListingPhotos(listingId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deleteListingPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
};

export const useReorderPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, orderedIds }: { listingId: string; orderedIds: string[] }) =>
      reorderListingPhotos(listingId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LISTINGS_KEY });
    },
  });
};
