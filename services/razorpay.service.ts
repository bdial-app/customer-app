/**
 * Razorpay Checkout Service — processes payments for Android and Web users.
 *
 * Web/PWA: loads checkout.js and opens the hosted checkout modal.
 * Android: uses the native Razorpay SDK via RazorpayCheckout plugin, because
 *   checkout.js can't launch UPI apps from inside a WebView and therefore hides
 *   UPI/wallet options. (iOS uses Apple IAP and never reaches this service.)
 */

import { getNativePlatform } from '@/utils/platform';
import {
  verifyRazorpayPayment,
  verifyRazorpaySubscription,
  type RazorpayOrderResponse,
  type RazorpaySubscriptionResponse,
} from './payment.service';
import { RazorpayCheckout } from './razorpay-native';

// Razorpay Checkout types
interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  handler: (response: any) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: any) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let sdkLoaded = false;

/**
 * Load the Razorpay checkout.js script (idempotent).
 */
async function loadRazorpaySdk(): Promise<void> {
  if (sdkLoaded || typeof window === 'undefined') return;
  if (window.Razorpay) {
    sdkLoaded = true;
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      sdkLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout for a one-time payment (sponsorship, lead-unlock, deal-creation).
 * Returns the verified payment result.
 */
export async function payWithRazorpay(
  orderResponse: RazorpayOrderResponse,
): Promise<{ status: string; paymentId: string }> {
  // Android → native SDK (full UPI/wallet support); Web → checkout.js modal.
  if (getNativePlatform() === 'android') {
    const { response } = await RazorpayCheckout.open({
      key: orderResponse.keyId,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      name: 'Tijarah',
      description: orderResponse.description,
      order_id: orderResponse.orderId,
      prefill: orderResponse.prefill,
      theme: { color: '#6366f1' },
    });
    return verifyRazorpayPayment({
      razorpay_order_id: response.razorpay_order_id!,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature!,
    });
  }

  await loadRazorpaySdk();

  return new Promise((resolve, reject) => {
    const options: RazorpayOptions = {
      key: orderResponse.keyId,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      name: 'Tijarah',
      description: orderResponse.description,
      order_id: orderResponse.orderId,
      prefill: orderResponse.prefill,
      theme: { color: '#6366f1' },
      handler: async (response: any) => {
        try {
          // Verify payment signature with backend
          const result = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled by user')),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}

/**
 * Open Razorpay Checkout for a subscription payment.
 * Returns the verified subscription result.
 */
export async function subscribeWithRazorpay(
  subResponse: RazorpaySubscriptionResponse,
): Promise<{ status: string; subscriptionId: string }> {
  // Android → native SDK (full UPI/wallet support); Web → checkout.js modal.
  if (getNativePlatform() === 'android') {
    const { response } = await RazorpayCheckout.open({
      key: subResponse.keyId,
      name: 'Tijarah',
      description: `${subResponse.planName} — ${subResponse.billingInterval}`,
      subscription_id: subResponse.subscriptionId,
      recurring: true,
      prefill: subResponse.prefill,
      theme: { color: '#6366f1' },
    });
    return verifyRazorpaySubscription({
      razorpay_subscription_id: response.razorpay_subscription_id!,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature!,
      planId: subResponse.metadata.planId,
      providerId: subResponse.metadata.providerId,
      billingInterval: subResponse.metadata.billingInterval,
    });
  }

  await loadRazorpaySdk();

  return new Promise((resolve, reject) => {
    const options: RazorpayOptions = {
      key: subResponse.keyId,
      name: 'Tijarah',
      description: `${subResponse.planName} — ${subResponse.billingInterval}`,
      subscription_id: subResponse.subscriptionId,
      prefill: subResponse.prefill,
      theme: { color: '#6366f1' },
      handler: async (response: any) => {
        try {
          const result = await verifyRazorpaySubscription({
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: subResponse.metadata.planId,
            providerId: subResponse.metadata.providerId,
            billingInterval: subResponse.metadata.billingInterval,
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Subscription cancelled by user')),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      reject(new Error(response.error?.description || 'Subscription payment failed'));
    });
    rzp.open();
  });
}
