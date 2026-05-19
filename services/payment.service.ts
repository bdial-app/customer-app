import apiClient from "@/utils/axios";
import { PAYMENT_URLS } from "@/utils/urls";

// ─── Types ──────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, any> | null;
  maxActiveDeals: number;
  maxTotalDeals: number;
  monthlyLeadUnlocks: number;
  sponsorshipTypes: string[] | null;
  sortOrder: number;
  appleProductIdMonthly: string | null;
  appleProductIdYearly: string | null;
}

export interface SubscriptionInfo {
  id: string;
  providerId: string;
  planId: string;
  paymentGateway: 'razorpay' | 'apple';
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
  billingInterval: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  leadUnlocksUsed: number;
  plan: SubscriptionPlan;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  type: 'sponsorship' | 'lead_unlock' | 'badge' | 'subscription' | 'deal_unlock' | 'deal_creation';
  paymentGateway: 'razorpay' | 'apple';
  discountAmount: number;
  createdAt: string;
}

/** Razorpay order response from backend (one-time payments) */
export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentId: string;
  keyId: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
}

/** Razorpay subscription response from backend */
export interface RazorpaySubscriptionResponse {
  subscriptionId: string;
  keyId: string;
  amount: number | null;
  planName: string;
  billingInterval: 'monthly' | 'yearly';
  prefill: { name?: string; email?: string; contact?: string };
  metadata: {
    planId: string;
    providerId: string;
    billingInterval: 'monthly' | 'yearly';
  };
}

export interface LeadUnlockResponse {
  unlocked: boolean;
  method?: 'subscription_credit' | 'payment_required' | 'free_quota' | 'free';
  remainingCredits?: number;
  // Razorpay order fields (when payment_required)
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentId?: string;
  keyId?: string;
  description?: string;
  price?: number;
  tier?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}

export interface VoucherValidation {
  valid: boolean;
  voucherId?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  discount?: number;
  finalAmount?: number;
  message: string;
}

// ─── Sponsorship Checkout ───────────────────────────────────────────

export interface CreateSponsorshipCheckoutPayload {
  type: 'carousel' | 'inline' | 'top_result';
  budgetAmount: number;
  targetCategoryIds?: string[];
  targetCities?: string[];
  startsAt: string;
  endsAt: string;
  voucherCode?: string;
}

export const createSponsorshipCheckout = async (
  payload: CreateSponsorshipCheckoutPayload,
): Promise<RazorpayOrderResponse> => {
  const { data } = await apiClient.post(PAYMENT_URLS.SPONSORSHIP_CHECKOUT, payload);
  return data;
};

// ─── Lead Unlock ────────────────────────────────────────────────────

export const createLeadUnlockCheckout = async (
  leadId: string,
  voucherCode?: string,
): Promise<LeadUnlockResponse> => {
  const { data } = await apiClient.post(PAYMENT_URLS.LEAD_UNLOCK_CHECKOUT, {
    leadId,
    voucherCode,
  });
  return data;
};

// ─── Subscriptions ──────────────────────────────────────────────────

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data } = await apiClient.get(PAYMENT_URLS.SUBSCRIPTION_PLANS);
  return data;
};

export const createSubscriptionCheckout = async (
  planId: string,
  billingInterval: 'monthly' | 'yearly',
  voucherCode?: string,
): Promise<RazorpaySubscriptionResponse> => {
  const { data } = await apiClient.post(PAYMENT_URLS.SUBSCRIPTION_CHECKOUT, {
    planId,
    billingInterval,
    voucherCode,
  });
  return data;
};

export const getCurrentSubscription = async (): Promise<SubscriptionInfo | null> => {
  const { data } = await apiClient.get(PAYMENT_URLS.SUBSCRIPTION_CURRENT);
  return data;
};

export const cancelSubscription = async (): Promise<{ cancelled: boolean; endsAt: string }> => {
  const { data } = await apiClient.post(PAYMENT_URLS.SUBSCRIPTION_CANCEL);
  return data;
};

export const resumeSubscription = async (): Promise<{ resumed: boolean }> => {
  const { data } = await apiClient.post(PAYMENT_URLS.SUBSCRIPTION_RESUME);
  return data;
};

// ─── Payment Verification ───────────────────────────────────────────

export const verifyRazorpayPayment = async (body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ status: string; paymentId: string }> => {
  const { data } = await apiClient.post(PAYMENT_URLS.VERIFY_RAZORPAY, body);
  return data;
};

export const verifyRazorpaySubscription = async (body: {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string;
  providerId: string;
  billingInterval: 'monthly' | 'yearly';
}): Promise<{ status: string; subscriptionId: string }> => {
  const { data } = await apiClient.post(PAYMENT_URLS.VERIFY_RAZORPAY_SUBSCRIPTION, body);
  return data;
};

export const verifyAppleReceipt = async (body: {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
}): Promise<{ status: string; subscriptionId: string }> => {
  const { data } = await apiClient.post(PAYMENT_URLS.VERIFY_APPLE, body);
  return data;
};

// ─── Voucher Validation ─────────────────────────────────────────────

export const validateVoucher = async (
  code: string,
  purchaseType: string,
  amount: number,
): Promise<VoucherValidation> => {
  const { data } = await apiClient.post(PAYMENT_URLS.VALIDATE_VOUCHER, {
    code,
    purchaseType,
    amount,
  });
  return data;
};

// ─── Payment History ────────────────────────────────────────────────

export const getPaymentHistory = async (
  page = 1,
  limit = 20,
): Promise<{ payments: PaymentRecord[]; total: number; page: number; limit: number }> => {
  const { data } = await apiClient.get(PAYMENT_URLS.HISTORY, {
    params: { page, limit },
  });
  return data;
};

// ─── Lead Unlock Info ───────────────────────────────────────────────

export interface LeadUnlockInfo {
  monetizationEnabled: boolean;
  freeQuota: number;
  freeUsedThisMonth: number;
  freeRemaining: number;
  subscriptionCreditsRemaining: number;
  isProSubscriber: boolean;
  isGrowthSubscriber: boolean;
  currentPlan: string;
}

export const getLeadUnlockInfo = async (): Promise<LeadUnlockInfo> => {
  const { data } = await apiClient.get(PAYMENT_URLS.LEAD_UNLOCK_INFO);
  return data;
};

// ─── Deal Creation ──────────────────────────────────────────────────

export interface DealCreationInfo {
  monetizationEnabled: boolean;
  freeQuotaLifetime: number;
  freeDealsCreated: number;
  freeRemaining: number;
  activeDeals: number;
  maxActiveDeals: number;
  isProSubscriber: boolean;
  isGrowthSubscriber: boolean;
  currentPlan: string;
}

export interface DealCreationCheckoutResponse {
  requiresPayment: boolean;
  method: 'free' | 'subscription_unlimited' | 'subscription_credit' | 'free_quota' | 'payment_required';
  // Razorpay order fields (when payment_required)
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentId?: string;
  keyId?: string;
  description?: string;
  price?: number;
  discounted?: boolean;
  freeRemaining?: number;
  prefill?: { name?: string; email?: string; contact?: string };
}

export const getDealCreationInfo = async (): Promise<DealCreationInfo> => {
  const { data } = await apiClient.get(PAYMENT_URLS.DEAL_CREATION_INFO);
  return data;
};

export const createDealCreationCheckout = async (
  voucherCode?: string,
  dealData?: Record<string, any>,
): Promise<DealCreationCheckoutResponse> => {
  const { data } = await apiClient.post(PAYMENT_URLS.DEAL_CREATION_CHECKOUT, {
    voucherCode,
    dealData,
  });
  return data;
};

// ─── Monetization Config ────────────────────────────────────────────

export interface MonetizationConfig {
  leadPricing: {
    hot: number;
    warm: number;
    soft: number;
    cold: number;
    hotDiscounted: number;
    warmDiscounted: number;
    softDiscounted: number;
    coldDiscounted: number;
  };
  dealPricing: {
    price: number;
    discountedPrice: number;
  };
  freeQuotas: {
    leadsPerMonth: number;
    dealsLifetime: number;
  };
  flags: {
    leadsMonetizationEnabled: boolean;
    dealsMonetizationEnabled: boolean;
    subscriptionsVisible: boolean;
  };
}

export const getMonetizationConfig = async (): Promise<MonetizationConfig> => {
  const { data } = await apiClient.get(PAYMENT_URLS.MONETIZATION_CONFIG);
  return data;
};
