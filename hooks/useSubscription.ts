import { useQuery } from "@tanstack/react-query";
import { getCurrentSubscription, type SubscriptionInfo } from "@/services/payment.service";

export const CURRENT_SUBSCRIPTION_KEY = ["current-subscription"];

export const useCurrentSubscription = () => {
  return useQuery<SubscriptionInfo | null>({
    queryKey: CURRENT_SUBSCRIPTION_KEY,
    queryFn: getCurrentSubscription,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
};
