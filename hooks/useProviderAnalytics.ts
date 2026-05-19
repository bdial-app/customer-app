import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnalyticsSummary,
  getLeads,
  getLeadDetail,
  unlockLead,
  getTopProducts,
  getPeakHours,
  getVisitorInsights,
  AnalyticsSummary,
  LeadsResponse,
  LeadDetail,
  TopProduct,
  VisitorInsights,
  LeadFilters,
} from "@/services/analytics.service";
import { createLeadUnlockCheckout, type LeadUnlockResponse } from "@/services/payment.service";
import { payWithRazorpay } from "@/services/razorpay.service";

export const ANALYTICS_SUMMARY_KEY = ["analytics-summary"];
export const ANALYTICS_LEADS_KEY = ["analytics-leads"];
export const ANALYTICS_TOP_PRODUCTS_KEY = ["analytics-top-products"];
export const ANALYTICS_PEAK_HOURS_KEY = ["analytics-peak-hours"];

export const useAnalyticsSummary = (period: "7d" | "30d" | "90d" = "7d") => {
  return useQuery<AnalyticsSummary>({
    queryKey: [...ANALYTICS_SUMMARY_KEY, period],
    queryFn: () => getAnalyticsSummary(period),
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
};

export const useLeads = (filters: LeadFilters = {}) => {
  return useQuery<LeadsResponse>({
    queryKey: [...ANALYTICS_LEADS_KEY, filters],
    queryFn: () => getLeads(filters),
    staleTime: 1000 * 60 * 2,
    retry: 2,
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
  return useMutation<LeadUnlockResponse, Error, { leadId: string; voucherCode?: string }>({
    mutationFn: async ({ leadId, voucherCode }) => {
      const data = await createLeadUnlockCheckout(leadId, voucherCode);
      if (!data.unlocked && data.method === "payment_required" && data.orderId && data.keyId) {
        // Open Razorpay checkout modal
        await payWithRazorpay({
          orderId: data.orderId,
          amount: data.amount!,
          currency: data.currency!,
          paymentId: data.paymentId!,
          keyId: data.keyId,
          description: data.description!,
          prefill: data.prefill || {},
        });
        return { ...data, unlocked: true };
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.unlocked) {
        qc.invalidateQueries({ queryKey: ANALYTICS_LEADS_KEY });
        qc.invalidateQueries({ queryKey: ["lead-unlock-info"] });
      }
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

export const ANALYTICS_VISITOR_INSIGHTS_KEY = ["analytics-visitor-insights"];

export const useVisitorInsights = (period: "7d" | "30d" | "90d" = "30d") => {
  return useQuery<VisitorInsights>({
    queryKey: [...ANALYTICS_VISITOR_INSIGHTS_KEY, period],
    queryFn: () => getVisitorInsights(period),
    staleTime: 1000 * 60 * 5,
  });
};
