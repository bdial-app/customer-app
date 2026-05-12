import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSavedLocation,
  deleteSavedLocation,
  getSavedLocations,
  CreateSavedLocationPayload,
  SavedLocation,
} from "@/services/saved-location.service";
import { useAppSelector } from "@/hooks/useAppStore";

export const MAX_SAVED_LOCATIONS = 10;

export const useSavedLocations = () => {
  const user = useAppSelector((state) => state.auth.user);
  return useQuery({
    queryKey: ["saved-locations"],
    queryFn: getSavedLocations,
    enabled: !!user,
  });
};

export const useCreateSavedLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSavedLocationPayload) => createSavedLocation(payload),
    onSuccess: (newLocation) => {
      // Immediately update cache so the list view has fresh data on remount
      queryClient.setQueryData<SavedLocation[]>(["saved-locations"], (old) =>
        old ? [newLocation, ...old] : [newLocation]
      );
      // Also invalidate for background consistency
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
    },
  });
};

export const useDeleteSavedLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSavedLocation(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["saved-locations"] });
      const previous = queryClient.getQueryData<SavedLocation[]>(["saved-locations"]);
      // Optimistically remove from cache
      queryClient.setQueryData<SavedLocation[]>(["saved-locations"], (old) =>
        old ? old.filter((loc) => loc.id !== deletedId) : []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["saved-locations"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
    },
  });
};
