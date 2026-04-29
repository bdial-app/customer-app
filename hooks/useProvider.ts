import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNearbyProviders,
  getProviderById,
  getProviderDetails,
  submitReview,
  ProviderDetailsResponse,
  ProviderNearbyParams,
  SubmitReviewPayload,
} from "@/services/provider.service";

export const useNearbyProviders = (params: Omit<ProviderNearbyParams, "page">) => {
  return useInfiniteQuery({
    queryKey: ["providers-nearby", params],
    queryFn: ({ pageParam = 1 }) =>
      getNearbyProviders({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!params.lat && !!params.lng,
  });
};

export const useProviderById = (id: string) => {
  return useQuery({
    queryKey: ["provider", id],
    queryFn: () => getProviderById(id),
    enabled: !!id,
  });
};

export const useProviderDetails = (id: string) => {
  return useQuery<ProviderDetailsResponse>({
    queryKey: ["provider-details", id],
    queryFn: () => getProviderDetails(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useSubmitReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) => submitReview(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["provider-details", variables.providerId] });
    },
  });
};
