import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getNearbyProviders,
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
