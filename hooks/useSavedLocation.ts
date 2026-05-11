import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSavedLocation,
  deleteSavedLocation,
  getSavedLocations,
  CreateSavedLocationPayload,
} from "@/services/saved-location.service";
import { useAppSelector } from "@/hooks/useAppStore";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
    },
  });
};

export const useDeleteSavedLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSavedLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
    },
  });
};
