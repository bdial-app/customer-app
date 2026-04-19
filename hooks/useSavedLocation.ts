import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSavedLocation,
  getSavedLocations,
  CreateSavedLocationPayload,
} from "@/services/saved-location.service";

export const useSavedLocations = () => {
  return useQuery({
    queryKey: ["saved-locations"],
    queryFn: getSavedLocations,
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
