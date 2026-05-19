/**
 * Apple In-App Purchase Service — handles StoreKit purchases on iOS.
 * Uses the cordova-plugin-purchase (CdvPurchase) library via Capacitor.
 *
 * This service is only initialized on iOS native.
 */

import { verifyAppleReceipt, type SubscriptionPlan } from './payment.service';

// CdvPurchase global namespace (loaded by cordova-plugin-purchase)
declare global {
  interface Window {
    CdvPurchase?: {
      store: IAPStore;
      Platform: { APPLE_APPSTORE: string };
      ProductType: { PAID_SUBSCRIPTION: string };
      LogLevel: { DEBUG: number; INFO: number; WARNING: number };
    };
  }
}

interface IAPProduct {
  id: string;
  platform: string;
  type: string;
  pricing?: { price: string; currency: string };
  owned: boolean;
  canPurchase: boolean;
}

interface IAPTransaction {
  transactionId: string;
  state: string;
  products: Array<{ id: string }>;
  finish: () => void;
}

interface IAPReceipt {
  transactions: IAPTransaction[];
}

interface IAPStore {
  register: (products: Array<{ id: string; type: string; platform: string }>) => void;
  initialize: (platforms?: string[]) => Promise<void>;
  get: (productId: string) => IAPProduct | undefined;
  order: (product: IAPProduct) => Promise<any>;
  when: () => {
    approved: (cb: (transaction: IAPTransaction) => void) => any;
    verified: (cb: (receipt: IAPReceipt) => void) => any;
    finished: (cb: (transaction: IAPTransaction) => void) => any;
    productUpdated: (cb: (product: IAPProduct) => void) => any;
  };
  restorePurchases: () => Promise<void>;
  verbosity: number;
  ready: (cb: () => void) => void;
}

let initialized = false;

/**
 * Get the CdvPurchase store, or null if not available.
 */
function getStore(): IAPStore | null {
  if (typeof window === 'undefined') return null;
  return window.CdvPurchase?.store ?? null;
}

/**
 * Initialize the IAP store and register subscription products.
 * Call this once on app startup (only on iOS).
 */
export async function initializeIAP(plans: SubscriptionPlan[]): Promise<void> {
  const store = getStore();
  if (!store || initialized) return;

  const CdvPurchase = window.CdvPurchase!;

  // Set log level
  store.verbosity = CdvPurchase.LogLevel.WARNING;

  // Register all Apple subscription products from plans
  const products: Array<{ id: string; type: string; platform: string }> = [];
  for (const plan of plans) {
    if (plan.appleProductIdMonthly) {
      products.push({
        id: plan.appleProductIdMonthly,
        type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
        platform: CdvPurchase.Platform.APPLE_APPSTORE,
      });
    }
    if (plan.appleProductIdYearly) {
      products.push({
        id: plan.appleProductIdYearly,
        type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
        platform: CdvPurchase.Platform.APPLE_APPSTORE,
      });
    }
  }

  if (products.length === 0) return;

  store.register(products);
  await store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
  initialized = true;
}

/**
 * Purchase a subscription via Apple IAP.
 * Handles the full flow: purchase → verify with backend → finish transaction.
 */
export async function purchaseAppleSubscription(
  productId: string,
): Promise<{ status: string; subscriptionId: string }> {
  const store = getStore();
  if (!store) throw new Error('IAP store not available');

  const product = store.get(productId);
  if (!product) throw new Error(`Product ${productId} not found in store`);
  if (!product.canPurchase) throw new Error('Product cannot be purchased');

  return new Promise((resolve, reject) => {
    // Listen for approved transactions
    store.when().approved(async (transaction: IAPTransaction) => {
      try {
        // Extract the Apple transaction ID
        const transactionId = transaction.transactionId;
        const appleProductId = transaction.products[0]?.id ?? productId;

        // Verify with our backend
        const result = await verifyAppleReceipt({
          transactionId,
          originalTransactionId: transactionId, // first purchase
          productId: appleProductId,
        });

        // Finish the transaction (acknowledge to Apple)
        transaction.finish();

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    // Initiate the purchase
    store.order(product).catch(reject);
  });
}

/**
 * Restore previous Apple purchases (e.g., after reinstall).
 * Returns true if any active subscriptions were restored.
 */
export async function restoreApplePurchases(): Promise<boolean> {
  const store = getStore();
  if (!store) return false;

  return new Promise((resolve) => {
    let restored = false;

    store.when().verified((receipt: IAPReceipt) => {
      for (const transaction of receipt.transactions) {
        if (transaction.state === 'approved' || transaction.state === 'finished') {
          restored = true;
          // Re-verify with backend
          const appleProductId = transaction.products[0]?.id;
          if (appleProductId) {
            verifyAppleReceipt({
              transactionId: transaction.transactionId,
              originalTransactionId: transaction.transactionId,
              productId: appleProductId,
            }).catch(() => {});
          }
          transaction.finish();
        }
      }
    });

    store.restorePurchases()
      .then(() => {
        // Give a short delay for callbacks to fire
        setTimeout(() => resolve(restored), 1000);
      })
      .catch(() => resolve(false));
  });
}

/**
 * Check if IAP is available (only true on iOS native).
 */
export function isIAPAvailable(): boolean {
  return getStore() !== null;
}

/**
 * Get the localized pricing for a product.
 */
export function getProductPricing(productId: string): { price: string; currency: string } | null {
  const store = getStore();
  if (!store) return null;

  const product = store.get(productId);
  if (!product?.pricing) return null;

  return {
    price: product.pricing.price,
    currency: product.pricing.currency,
  };
}
