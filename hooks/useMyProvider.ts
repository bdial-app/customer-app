import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProviderStatus,
  updateProvider,
  getMyAnalytics,
  replyToReview,
  ProviderStatusResponse,
  ProviderAnalytics,
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

export const useProviderAnalytics = () => {
  return useQuery<ProviderAnalytics>({
    queryKey: ["my-provider-analytics"],
    queryFn: getMyAnalytics,
    staleTime: 1000 * 60 * 2,
  });
};

export const useReplyToReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, replyText }: { reviewId: string; replyText: string }) =>
      replyToReview(reviewId, replyText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-provider-analytics"] });
      qc.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    },
  });
};
