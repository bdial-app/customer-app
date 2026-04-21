import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProviderStatus,
  updateProvider,
  ProviderStatusResponse,
  UpdateProviderPayload,
} from "@/services/provider.service";

export const PROVIDER_STATUS_KEY = ["my-provider-status"];

export const useMyProvider = () => {
  return useQuery<ProviderStatusResponse>({
    queryKey: PROVIDER_STATUS_KEY,
    queryFn: getMyProviderStatus,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProviderPayload }) =>
      updateProvider(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};
