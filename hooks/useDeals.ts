import { useInfiniteQuery } from "@tanstack/react-query";
import { getDeals, type DealsParams } from "@/services/explore.service";

export const useDeals = (params?: Omit<DealsParams, "page">) => {
  return useInfiniteQuery({
    queryKey: [
      "deals",
      params?.lat,
      params?.lng,
      params?.city,
      params?.sort,
      params?.category,
      params?.radius,
      params?.discountType,
      params?.minDiscount,
      params?.verified,
      params?.minRating,
      params?.endingSoon,
      params?.womenLed,
    ],
    queryFn: ({ pageParam = 1 }) =>
      getDeals({ ...params, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
