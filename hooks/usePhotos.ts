import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadProviderPhotos,
  deleteProviderPhoto,
  reorderProviderPhotos,
  uploadProviderProfileImage,
} from "@/services/photo.service";
import { PROVIDER_STATUS_KEY } from "./useMyProvider";
import { ProviderStatusResponse } from "@/services/provider.service";

const PROVIDER_DETAILS_KEY = "provider-details";

export const useUploadPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, files }: { providerId: string; files: File[] }) =>
      uploadProviderPhotos(providerId, files),
    onSuccess: (_data, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: [PROVIDER_DETAILS_KEY, providerId] });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deleteProviderPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: [PROVIDER_DETAILS_KEY] });
    },
  });
};

export const useReorderPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, orderedIds }: { providerId: string; orderedIds: string[] }) =>
      reorderProviderPhotos(providerId, orderedIds),
    onSuccess: (_data, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: [PROVIDER_DETAILS_KEY, providerId] });
    },
  });
};

export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      providerId,
      file,
      field,
    }: {
      providerId: string;
      file: File;
      field: "bannerImageUrl" | "profilePhotoUrl";
    }) => uploadProviderProfileImage(providerId, file, field),
    onSuccess: (data) => {
      // Directly update cache so the new image URL is available immediately
      queryClient.setQueryData<ProviderStatusResponse>(PROVIDER_STATUS_KEY, (old) => {
        if (!old?.provider) return old;
        return {
          ...old,
          provider: { ...old.provider, [data.field]: data.url },
        };
      });
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};
