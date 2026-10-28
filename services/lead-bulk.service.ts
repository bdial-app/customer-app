import apiClient from "@/utils/axios";
import { PAYMENT_URLS } from "@/utils/urls";

export interface BulkLeadQuote {
  count: number;
  freeCount: number;
  paidCount: number;
  subtotal: number;
  discountPct: number;
  total: number;
  /** Add `more` paid contacts to get `pct`% off. */
  nextDiscount: { more: number; pct: number } | null;
}

export interface BulkLeadCheckout {
  requiresPayment: boolean;
  /** Unlocked already (free monthly unlocks / plan credits). */
  unlocked: string[];
  paidLeadIds?: string[];
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentId?: string;
  keyId?: string;
  description?: string;
  total?: number;
  prefill?: Record<string, string>;
}

export const quoteBulkLeads = async (leadIds: string[]): Promise<BulkLeadQuote> =>
  (await apiClient.post(PAYMENT_URLS.LEAD_BULK_QUOTE, { leadIds })).data;

export const checkoutBulkLeads = async (leadIds: string[]): Promise<BulkLeadCheckout> =>
  (await apiClient.post(PAYMENT_URLS.LEAD_BULK_CHECKOUT, { leadIds })).data;
