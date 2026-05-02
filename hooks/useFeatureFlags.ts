import { useQuery } from "@tanstack/react-query";
import { getFeatureFlags, type FeatureFlags } from "@/services/feature-flags.service";

export function useFeatureFlags() {
  return useQuery<FeatureFlags>({
    queryKey: ["feature-flags"],
    queryFn: getFeatureFlags,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // re-check every 5 minutes
  });
}

export function useMaintenanceMode() {
  const { data: flags, isLoading } = useFeatureFlags();
  return {
    isMaintenanceMode: flags?.maintenance_mode ?? false,
    maintenanceMessage: flags?.maintenance_message ?? "We are currently performing scheduled maintenance. Please try again later.",
    isLoading,
  };
}
