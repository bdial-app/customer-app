import apiClient from "@/utils/axios";
import { PAYMENT_URLS } from "@/utils/urls";

export interface LeadPack {
  id: string;
  price: number;
  /** What lands in the wallet: price + bonus (+ first top-up gift). */
  credit: number;
  bonus: number;
  firstBonus: number;
  bonusPct: number;
  popular: boolean;
  /** About how many hot contacts it buys. */
  hotLeads: number;
  /** Sold on iPhone (an Apple product is set up). */
  onApple: boolean;
}

export interface WalletTransaction {
  id: string;
  kind: "topup" | "bonus" | "unlock";
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  leadId: string | null;
  tier: "hot" | "warm" | "soft" | "cold" | null;
  customerName: string | null;
}

export interface LeadWallet {
  enabled: boolean;
  balance: number;
  hotPrice: number;
  hotLeadsCovered: number;
  firstTopup: boolean;
  packs: LeadPack[];
  transactions: WalletTransaction[];
}

export interface WalletQuote {
  count: number;
  freeCount: number;
  paidCount: number;
  total: number;
  balance: number;
  shortfall: number;
  suggestedPack: string | null;
}

export interface PackCheckout {
  requiresPayment: boolean;
  gateway?: "apple";
  appleProductId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentId: string;
  keyId?: string;
  description?: string;
  price: number;
  credit: number;
  prefill?: Record<string, string>;
}

export const getLeadWallet = async (): Promise<LeadWallet> => (await apiClient.get(PAYMENT_URLS.LEAD_WALLET)).data;

export const createLeadPackCheckout = async (packId: string, gateway: "razorpay" | "apple"): Promise<PackCheckout> =>
  (await apiClient.post(PAYMENT_URLS.LEAD_WALLET_CHECKOUT, { packId, gateway })).data;

export const quoteLeads = async (leadIds: string[]): Promise<WalletQuote> =>
  (await apiClient.post(PAYMENT_URLS.LEAD_WALLET_QUOTE, { leadIds })).data;

export const unlockLeadsFromWallet = async (
  leadIds: string[],
): Promise<{ unlocked: string[]; spent: number; freeUsed: number; balance: number }> =>
  (await apiClient.post(PAYMENT_URLS.LEAD_WALLET_UNLOCK, { leadIds })).data;
