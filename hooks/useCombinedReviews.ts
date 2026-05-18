import { useQuery } from "@tanstack/react-query";
import {
  getCombinedReviews,
  CombinedReviewsResponse,
} from "@/services/google-reviews.service";

export const useCombinedReviews = (providerId: string, page = 1) => {
  return useQuery<CombinedReviewsResponse>({
    queryKey: ["combined-reviews", providerId, page],
    queryFn: () => getCombinedReviews(providerId, page),
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
