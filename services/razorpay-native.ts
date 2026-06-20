/**
 * Bridge to the native Android Razorpay checkout plugin (RazorpayCheckoutPlugin.java).
 *
 * Used on Android only — the native SDK shows the full UPI/wallet method list,
 * which the web checkout.js suppresses inside a WebView. Web/iOS never call this.
 */

import { registerPlugin } from '@capacitor/core';

/** Standard Razorpay checkout options passed straight to the native SDK. */
export interface NativeRazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  recurring?: boolean;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
}

export interface NativeRazorpaySuccess {
  response: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  };
}

export interface RazorpayCheckoutPlugin {
  open(options: NativeRazorpayOptions): Promise<NativeRazorpaySuccess>;
}

export const RazorpayCheckout = registerPlugin<RazorpayCheckoutPlugin>('RazorpayCheckout');
