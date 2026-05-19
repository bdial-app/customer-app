import { useQuery } from "@tanstack/react-query";
import {
  getMonetizationConfig,
  getLeadUnlockInfo,
  getDealCreationInfo,
  type MonetizationConfig,
  type LeadUnlockInfo,
  type DealCreationInfo,
} from "@/services/payment.service";

export function useMonetizationConfig() {
  return useQuery<MonetizationConfig>({
    queryKey: ["monetization-config"],
    queryFn: getMonetizationConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLeadUnlockInfo() {
  return useQuery<LeadUnlockInfo>({
    queryKey: ["lead-unlock-info"],
    queryFn: getLeadUnlockInfo,
    staleTime: 30 * 1000, // 30 seconds (credits change frequently)
  });
}

export function useDealCreationInfo() {
  return useQuery<DealCreationInfo>({
    queryKey: ["deal-creation-info"],
    queryFn: getDealCreationInfo,
    staleTime: 30 * 1000,
  });
}
