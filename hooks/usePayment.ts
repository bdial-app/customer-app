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
  purchaseConsumable,
  restoreApplePurchases,
  isIAPAvailable,
} from '@/services/iap.service';
import {
  createSponsorshipCheckout,
  createLeadUnlockCheckout,
  createDealCreationCheckout,
  createSubscriptionCheckout,
  getSubscriptionPlans,
  getMonetizationConfig,
  verifyAppleConsumable,
  type CreateSponsorshipCheckoutPayload,
  type SubscriptionPlan,
} from '@/services/payment.service';
import { getSponsorshipPlans } from '@/services/provider.service';

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

  // Initialize Apple IAP on iOS — register BOTH subscription and consumable
  // products before StoreKit initializes (products registered after init don't load).
  // Boost ids come from sponsorship plans (always present in the deployed backend),
  // lead/deal ids from the monetization config — merged so boost works regardless.
  useEffect(() => {
    if (isAppleIAP && isIAPAvailable()) {
      Promise.all([
        getSubscriptionPlans(),
        getSponsorshipPlans().catch(() => []),
        getMonetizationConfig().catch(() => null),
      ])
        .then(([plans, sponsorPlans, config]: [SubscriptionPlan[], any[], any]) => {
          const consumableIds = [
            ...((sponsorPlans ?? []).map((p: any) => p?.appleProductId).filter(Boolean)),
            ...((config?.appleProductIds ?? []) as string[]),
          ];
          return initializeIAP(plans, consumableIds);
        })
        .catch(() => {}); // silent fail — products load when a purchase is attempted
    }
  }, [isAppleIAP]);

  const clearError = useCallback(() => setError(null), []);

  // ─── Sponsorship / Boost ───
  // iOS → Apple IAP consumable (App Store policy); Android/Web → Razorpay.

  const purchaseSponsorship = useCallback(async (payload: CreateSponsorshipCheckoutPayload) => {
    setLoading(true);
    setError(null);
    try {
      const orderResponse = await createSponsorshipCheckout(payload, isAppleIAP ? 'apple' : 'razorpay');
      if (isAppleIAP && orderResponse.gateway === 'apple') {
        if (!orderResponse.appleProductId) throw new Error('Apple product not configured for this boost plan');
        // Boost is a one-time, non-recurring purchase → Consumable IAP.
        const result = await purchaseConsumable(
          orderResponse.appleProductId,
          (transactionId) => verifyAppleConsumable({ paymentId: orderResponse.paymentId, transactionId }),
          'consumable',
        );
        return result as { status: string; paymentId: string };
      }
      const result = await payWithRazorpay(orderResponse);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Payment failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAppleIAP]);

  // ─── Lead Unlock ───

  const unlockLead = useCallback(async (leadId: string, voucherCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createLeadUnlockCheckout(leadId, voucherCode, isAppleIAP ? 'apple' : 'razorpay');

      if (response.unlocked) {
        return {
          unlocked: true,
          method: response.method,
          remainingCredits: response.remainingCredits,
        };
      }

      // iOS → Apple IAP consumable
      if (isAppleIAP && response.gateway === 'apple' && response.appleProductId) {
        const result = await purchaseConsumable(response.appleProductId, (transactionId) =>
          verifyAppleConsumable({ paymentId: response.paymentId!, transactionId }),
        );
        return { unlocked: true, method: 'payment_required', status: result.status, paymentId: result.paymentId };
      }

      // Android/Web → Razorpay
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
  }, [isAppleIAP]);

  // ─── Deal Creation ───

  const purchaseDealCreation = useCallback(async (voucherCode?: string, dealData?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createDealCreationCheckout(voucherCode, dealData, isAppleIAP ? 'apple' : 'razorpay');

      if (!response.requiresPayment) {
        return {
          requiresPayment: false,
          method: response.method,
          freeRemaining: response.freeRemaining,
        };
      }

      // iOS → Apple IAP consumable
      if (isAppleIAP && response.gateway === 'apple' && response.appleProductId) {
        const result = await purchaseConsumable(response.appleProductId, (transactionId) =>
          verifyAppleConsumable({ paymentId: response.paymentId!, transactionId }),
        );
        return { requiresPayment: true, method: 'payment_required', status: result.status, paymentId: result.paymentId };
      }

      // Android/Web → Razorpay
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
  }, [isAppleIAP]);

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
