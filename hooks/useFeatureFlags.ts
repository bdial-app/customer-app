import { useQuery } from "@tanstack/react-query";
import { getFeatureFlags, type FeatureFlags } from "@/services/config.service";

const DEFAULTS: FeatureFlags = {
  maintenance_mode: false,
  registration_enabled: true,
  provider_onboarding_enabled: true,
  chat_enabled: true,
  reviews_enabled: true,
  search_enabled: true,
  offers_require_approval: false,
  sponsorship_requires_approval: false,
};

export const useFeatureFlags = () => {
  const query = useQuery({
    queryKey: ["feature-flags"],
    queryFn: getFeatureFlags,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  return {
    flags: query.data ?? DEFAULTS,
    isLoading: query.isLoading,
  };
};
