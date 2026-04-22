import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadProviderPhotos,
  deleteProviderPhoto,
  reorderProviderPhotos,
} from "@/services/photo.service";
import { PROVIDER_STATUS_KEY } from "./useMyProvider";

export const useUploadPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, files }: { providerId: string; files: File[] }) =>
      uploadProviderPhotos(providerId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deleteProviderPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};

export const useReorderPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, orderedIds }: { providerId: string; orderedIds: string[] }) =>
      reorderProviderPhotos(providerId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};
