import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getNearbyProviders,
  getProviderById,
  ProviderNearbyParams,
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
