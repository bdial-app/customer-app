import apiClient from "@/utils/axios";
import { ANALYTICS_URLS } from "@/utils/urls";

// ─── Types ──────────────────────────────────────────────────────────

export interface StatWithTrend {
  count: number;
  trend: number; // % change vs previous period
  sparkline?: number[];
}

export interface AnalyticsSummary {
  period: string;
  profileViews: StatWithTrend;
  searchAppearances: StatWithTrend;
  enquiries: StatWithTrend;
  calls: StatWithTrend;
  directions: StatWithTrend;
  saves: StatWithTrend;
  shares: StatWithTrend;
  leads: { hot: number; warm: number; soft: number; cold: number };
  conversionRate: number;
  peakHours: number[];
  topProducts: { productId: string; name: string; views: number }[];
}

export interface LeadVisitor {
  name: string;
  avatar: string | null;
  userId: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
}

export interface LeadItem {
  id: string;
  tier: "hot" | "warm" | "soft" | "cold";
  score: number;
  source: string | null;
  searchQuery: string | null;
  productsViewed: string[];
  actionsPerformed: string[];
  totalDuration: number;
  firstSeenAt: string;
  lastSeenAt: string;
  isUnlocked: boolean;
  isAnonymous: boolean;
  visitor: LeadVisitor;
}

export interface LeadsResponse {
  data: LeadItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface LeadTimelineEvent {
  eventType: string;
  entityId: string | null;
  metadata: Record<string, any> | null;
  duration: number | null;
  source: string | null;
  createdAt: string;
}

export interface LeadDetail extends LeadItem {
  timeline: LeadTimelineEvent[];
  products: { id: string; name: string }[];
}

export interface TopProduct {
  productId: string;
  name: string;
  photoUrl: string | null;
  price: number | null;
  views: number;
  uniqueVisitors: number;
}

// ─── API Functions ──────────────────────────────────────────────────

export const getAnalyticsSummary = async (
  period: "7d" | "30d" | "90d" = "7d",
): Promise<AnalyticsSummary> => {
  const { data } = await apiClient.get(ANALYTICS_URLS.SUMMARY, { params: { period } });
  return data;
};

export const getLeads = async (params: {
  tier?: string;
  page?: number;
  limit?: number;
}): Promise<LeadsResponse> => {
  const { data } = await apiClient.get(ANALYTICS_URLS.LEADS, { params });
  return data;
};

export const getLeadDetail = async (id: string): Promise<LeadDetail> => {
  const { data } = await apiClient.get(ANALYTICS_URLS.LEAD_DETAIL(id));
  return data;
};

export const unlockLead = async (id: string): Promise<{ unlocked: boolean }> => {
  const { data } = await apiClient.post(ANALYTICS_URLS.UNLOCK_LEAD(id));
  return data;
};

export const getTopProducts = async (
  period: "7d" | "30d" | "90d" = "7d",
): Promise<TopProduct[]> => {
  const { data } = await apiClient.get(ANALYTICS_URLS.TOP_PRODUCTS, { params: { period } });
  return data;
};

export const getPeakHours = async (
  period: "7d" | "30d" | "90d" = "7d",
): Promise<number[]> => {
  const { data } = await apiClient.get(ANALYTICS_URLS.PEAK_HOURS, { params: { period } });
  return data;
};
