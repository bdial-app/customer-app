import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnalyticsSummary,
  getLeads,
  getLeadDetail,
  unlockLead,
  getTopProducts,
  getPeakHours,
  AnalyticsSummary,
  LeadsResponse,
  LeadDetail,
  TopProduct,
} from "@/services/analytics.service";

export const ANALYTICS_SUMMARY_KEY = ["analytics-summary"];
export const ANALYTICS_LEADS_KEY = ["analytics-leads"];
export const ANALYTICS_TOP_PRODUCTS_KEY = ["analytics-top-products"];
export const ANALYTICS_PEAK_HOURS_KEY = ["analytics-peak-hours"];

export const useAnalyticsSummary = (period: "7d" | "30d" | "90d" = "7d") => {
  return useQuery<AnalyticsSummary>({
    queryKey: [...ANALYTICS_SUMMARY_KEY, period],
    queryFn: () => getAnalyticsSummary(period),
    staleTime: 1000 * 60 * 2,
  });
};

export const useLeads = (tier?: string, page = 1, limit = 20) => {
  return useQuery<LeadsResponse>({
    queryKey: [...ANALYTICS_LEADS_KEY, tier, page, limit],
    queryFn: () => getLeads({ tier, page, limit }),
    staleTime: 1000 * 60 * 2,
  });
};

export const useLeadDetail = (leadId: string) => {
  return useQuery<LeadDetail>({
    queryKey: ["analytics-lead-detail", leadId],
    queryFn: () => getLeadDetail(leadId),
    enabled: !!leadId,
  });
};

export const useUnlockLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => unlockLead(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ANALYTICS_LEADS_KEY });
    },
  });
};

export const useTopProducts = (period: "7d" | "30d" | "90d" = "7d") => {
  return useQuery<TopProduct[]>({
    queryKey: [...ANALYTICS_TOP_PRODUCTS_KEY, period],
    queryFn: () => getTopProducts(period),
    staleTime: 1000 * 60 * 5,
  });
};

export const usePeakHours = (period: "7d" | "30d" | "90d" = "7d") => {
  return useQuery<number[]>({
    queryKey: [...ANALYTICS_PEAK_HOURS_KEY, period],
    queryFn: () => getPeakHours(period),
    staleTime: 1000 * 60 * 5,
  });
};
