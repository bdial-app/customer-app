/**
 * Unified payment hook — routes to Razorpay (Android/Web) or Apple IAP (iOS)
 * based on the current platform.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { getNativePlatform } from '@/utils/platform';
import { payWithRazorpay, subscribeWithRazorpay } from '@/services/razorpay.service';
import {
  initializeIAP,
  purchaseAppleSubscription,
  restoreApplePurchases,
  isIAPAvailable,
} from '@/services/iap.service';
import {
  createSponsorshipCheckout,
  createLeadUnlockCheckout,
  createDealCreationCheckout,
  createSubscriptionCheckout,
  getSubscriptionPlans,
  type CreateSponsorshipCheckoutPayload,
  type SubscriptionPlan,
} from '@/services/payment.service';

export type PaymentGateway = 'razorpay' | 'apple';

interface UsePaymentReturn {
  /** Current payment gateway based on platform */
  gateway: PaymentGateway;
  /** Whether a payment is in progress */
  loading: boolean;
  /** Last error message */
  error: string | null;
  /** Purchase a sponsorship */
  purchaseSponsorship: (payload: CreateSponsorshipCheckoutPayload) => Promise<{ status: string; paymentId: string }>;
  /** Unlock a lead (may be free via credits) */
  unlockLead: (leadId: string, voucherCode?: string) => Promise<{
    unlocked: boolean;
    method?: string;
    remainingCredits?: number;
    status?: string;
    paymentId?: string;
  }>;
  /** Create a deal (may be free via quota) */
  purchaseDealCreation: (voucherCode?: string, dealData?: Record<string, any>) => Promise<{
    requiresPayment: boolean;
    method: string;
    status?: string;
    paymentId?: string;
    freeRemaining?: number;
  }>;
  /** Subscribe to a plan */
  subscribe: (planId: string, billingInterval: 'monthly' | 'yearly', voucherCode?: string) => Promise<{
    status: string;
    subscriptionId: string;
  }>;
  /** Restore Apple purchases (iOS only) */
  restorePurchases: () => Promise<boolean>;
  /** Whether Apple IAP is available */
  isAppleIAP: boolean;
  /** Clear error */
  clearError: () => void;
}

export function usePayment(): UsePaymentReturn {
  const platform = getNativePlatform();
  const gateway: PaymentGateway = platform === 'ios' ? 'apple' : 'razorpay';
  const isAppleIAP = platform === 'ios';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Apple IAP on iOS
  useEffect(() => {
    if (isAppleIAP && isIAPAvailable()) {
      getSubscriptionPlans()
        .then((plans: SubscriptionPlan[]) => initializeIAP(plans))
        .catch(() => {}); // silent fail — plans will load when tab opens
    }
  }, [isAppleIAP]);

  const clearError = useCallback(() => setError(null), []);

  // ─── Sponsorship (Razorpay only — one-time, not a digital subscription) ───

  const purchaseSponsorship = useCallback(async (payload: CreateSponsorshipCheckoutPayload) => {
    setLoading(true);
    setError(null);
    try {
      const orderResponse = await createSponsorshipCheckout(payload);
      const result = await payWithRazorpay(orderResponse);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Payment failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Lead Unlock ───

  const unlockLead = useCallback(async (leadId: string, voucherCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createLeadUnlockCheckout(leadId, voucherCode);

      if (response.unlocked) {
        return {
          unlocked: true,
          method: response.method,
          remainingCredits: response.remainingCredits,
        };
      }

      // Payment required — use Razorpay (lead unlock is a one-time payment, not IAP)
      if (response.orderId && response.keyId) {
        const payResult = await payWithRazorpay({
          orderId: response.orderId,
          amount: response.amount!,
          currency: response.currency!,
          paymentId: response.paymentId!,
          keyId: response.keyId,
          description: response.description!,
          prefill: response.prefill || {},
        });
        return {
          unlocked: true,
          method: 'payment_required',
          status: payResult.status,
          paymentId: payResult.paymentId,
        };
      }

      throw new Error('Unexpected response from lead unlock');
    } catch (err: any) {
      const msg = err?.message || 'Lead unlock failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Deal Creation ───

  const purchaseDealCreation = useCallback(async (voucherCode?: string, dealData?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createDealCreationCheckout(voucherCode, dealData);

      if (!response.requiresPayment) {
        return {
          requiresPayment: false,
          method: response.method,
          freeRemaining: response.freeRemaining,
        };
      }

      // Payment required — use Razorpay
      if (response.orderId && response.keyId) {
        const payResult = await payWithRazorpay({
          orderId: response.orderId,
          amount: response.amount!,
          currency: response.currency!,
          paymentId: response.paymentId!,
          keyId: response.keyId,
          description: response.description!,
          prefill: response.prefill || {},
        });
        return {
          requiresPayment: true,
          method: 'payment_required',
          status: payResult.status,
          paymentId: payResult.paymentId,
        };
      }

      throw new Error('Unexpected response from deal creation checkout');
    } catch (err: any) {
      const msg = err?.message || 'Deal creation payment failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Subscription ───

  const subscribe = useCallback(async (planId: string, billingInterval: 'monthly' | 'yearly', voucherCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isAppleIAP) {
        // Apple IAP flow
        const plans = await getSubscriptionPlans();
        const plan = plans.find(p => p.id === planId);
        if (!plan) throw new Error('Plan not found');

        const productId = billingInterval === 'yearly'
          ? plan.appleProductIdYearly
          : plan.appleProductIdMonthly;
        if (!productId) throw new Error('Apple product not configured for this plan');

        const result = await purchaseAppleSubscription(productId);
        return result;
      } else {
        // Razorpay flow
        const subResponse = await createSubscriptionCheckout(planId, billingInterval, voucherCode);
        const result = await subscribeWithRazorpay(subResponse);
        return result;
      }
    } catch (err: any) {
      const msg = err?.message || 'Subscription failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAppleIAP]);

  // ─── Restore Purchases (iOS only) ───

  const restorePurchasesHandler = useCallback(async () => {
    if (!isAppleIAP) return false;
    setLoading(true);
    try {
      const restored = await restoreApplePurchases();
      return restored;
    } finally {
      setLoading(false);
    }
  }, [isAppleIAP]);

  return {
    gateway,
    loading,
    error,
    purchaseSponsorship,
    unlockLead,
    purchaseDealCreation,
    subscribe,
    restorePurchases: restorePurchasesHandler,
    isAppleIAP,
    clearError,
  };
}
