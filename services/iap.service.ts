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
      ProductType: { PAID_SUBSCRIPTION: string; CONSUMABLE: string };
      LogLevel: { DEBUG: number; INFO: number; WARNING: number };
    };
  }
}

interface IAPOffer {
  id: string;
  // 'Default' for the base price; a DiscountType for intro/promotional offers.
  offerType?: string;
  canPurchase?: boolean;
}

interface IAPProduct {
  id: string;
  platform: string;
  type: string;
  pricing?: { price: string; currency: string };
  offers?: IAPOffer[];
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
  products?: IAPProduct[];
  order: (offerOrProduct: IAPProduct | IAPOffer) => Promise<any>;
  when: () => {
    approved: (cb: (transaction: IAPTransaction) => void) => any;
    verified: (cb: (receipt: IAPReceipt) => void) => any;
    finished: (cb: (transaction: IAPTransaction) => void) => any;
    productUpdated: (cb: (product: IAPProduct) => void) => any;
  };
  restorePurchases: () => Promise<void>;
  update?: () => Promise<void>;
  verbosity: number;
  ready: (cb: () => void) => void;
}

let initialized = false;
let listenersReady = false;

// Active purchases we initiated, keyed by product id. A single global
// `approved` listener routes each approved transaction to the matching entry's
// verify handler. This avoids the bug where registering a `when().approved`
// callback per purchase accumulates global listeners that cross-fire (a
// consumable approval triggering the subscription verifier and vice-versa).
interface PendingPurchase {
  verify: (transaction: IAPTransaction) => Promise<any>;
  resolve: (value: any) => void;
  reject: (err: any) => void;
}
const pendingPurchases = new Map<string, PendingPurchase>();

/**
 * Get the CdvPurchase store, or null if not available.
 */
function getStore(): IAPStore | null {
  if (typeof window === 'undefined') return null;
  return window.CdvPurchase?.store ?? null;
}

/**
 * Register the single global transaction listener (idempotent). Each approved
 * transaction is routed to the purchase we initiated for that product id.
 */
function setupListeners(store: IAPStore): void {
  if (listenersReady) return;
  listenersReady = true;
  store.when().approved(async (transaction: IAPTransaction) => {
    const productId = transaction.products?.[0]?.id;
    const entry = productId ? pendingPurchases.get(productId) : undefined;
    if (!entry) {
      // Not a purchase we're currently awaiting (e.g. a restored or
      // interrupted transaction) — leave it for the restore flow to handle.
      return;
    }
    pendingPurchases.delete(productId!);
    try {
      const result = await entry.verify(transaction);
      transaction.finish();
      entry.resolve(result);
    } catch (err) {
      // Leave the transaction unfinished so it can be retried/restored.
      entry.reject(err);
    }
  });
}

/** Turn a CdvPurchase IError (or anything) into a readable message. */
function formatIapError(e: any): string {
  if (!e) return 'Unknown StoreKit error';
  if (typeof e === 'string') return e;
  const code = e.code ?? e.errorCode;
  const msg = e.message ?? e.errorMessage;
  if (msg && code !== undefined) return `${msg} (code ${code})`;
  if (msg) return msg;
  if (code !== undefined) return `StoreKit error code ${code}`;
  try { return JSON.stringify(e); } catch { return 'StoreKit error'; }
}

/**
 * Pick the offer to order. Always the **Default** (base price) offer — never a
 * promotional/intro "discount offer", which requires a signed
 * additionalData.appStore.discount and fails with code 6777032. Works for
 * consumables (single Default offer) and subscriptions (skips intro/promo offers).
 */
function selectBaseOffer(product: IAPProduct): IAPProduct | IAPOffer {
  const offers = product.offers;
  if (!offers || offers.length === 0) return product; // fallback: order the product
  return (
    offers.find((o) => o.offerType === 'Default' || o.id === '$') ??
    offers[0]
  );
}

/**
 * Place a StoreKit order, handling both failure shapes: cordova-plugin-purchase
 * v13 *resolves* with an IError on failure (and may reject with one in some
 * builds). On failure we clean up the pending entry and reject with a real
 * message instead of an empty {}.
 */
function placeOrder(store: IAPStore, product: IAPProduct, productId: string, reject: (e: any) => void): void {
  Promise.resolve(store.order(selectBaseOffer(product))).then(
    (result: any) => {
      if (result && (result.isError || result.code !== undefined || result.message)) {
        pendingPurchases.delete(productId);
        reject(new Error(formatIapError(result)));
      }
    },
    (err) => {
      pendingPurchases.delete(productId);
      reject(new Error(formatIapError(err)));
    },
  );
}

/** Poll until a registered product is loaded and purchasable, or time out. */
async function waitForProduct(
  store: IAPStore,
  productId: string,
  timeoutMs = 6000,
): Promise<IAPProduct | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const p = store.get(productId);
    if (p && p.canPurchase) return p;
    await new Promise((r) => setTimeout(r, 250));
  }
  return store.get(productId) ?? null;
}

/**
 * Initialize the StoreKit / CdvPurchase store exactly once. Required before ANY
 * purchase (subscription or consumable) — not just when subscription products
 * exist. Self-contained so a purchase can call it directly even if the app-start
 * init (which depends on usePayment being mounted) never ran.
 */
async function ensureInitialized(store: IAPStore): Promise<void> {
  if (initialized) return;
  const CdvPurchase = window.CdvPurchase!;
  store.verbosity = CdvPurchase.LogLevel.WARNING;
  setupListeners(store);
  await store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
  initialized = true;
}

/**
 * Register subscription + consumable products and initialize the store. Call on
 * app startup (iOS only). Products MUST be registered before `initialize()` —
 * cordova-plugin-purchase v13 does not re-query StoreKit for products registered
 * afterward, so on-demand registration silently fails to load. That's why the
 * consumable product ids (lead/deal/boost) are passed here and registered up front.
 */
export async function initializeIAP(
  plans: SubscriptionPlan[],
  consumableProductIds: string[] = [],
): Promise<void> {
  const store = getStore();
  if (!store || initialized) return;

  const CdvPurchase = window.CdvPurchase!;

  const products: Array<{ id: string; type: string; platform: string }> = [];
  // Subscription products
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
  // Consumable products (lead unlock / deal creation / boost) — dedupe and skip
  // any id already registered as a subscription above.
  const seen = new Set(products.map((p) => p.id));
  for (const id of consumableProductIds) {
    if (id && !seen.has(id)) {
      seen.add(id);
      products.push({
        id,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.APPLE_APPSTORE,
      });
    }
  }

  if (products.length > 0) store.register(products);
  // Always initialize, even with zero products, so later on-demand fallback works.
  await ensureInitialized(store);
  if (products.length > 0) await store.update?.();
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
  await ensureInitialized(store);
  const CdvPurchase = window.CdvPurchase!;

  // Load the subscription product if it wasn't registered at startup.
  let product = store.get(productId);
  if (!product || !product.canPurchase) {
    store.register([
      {
        id: productId,
        type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
        platform: CdvPurchase.Platform.APPLE_APPSTORE,
      },
    ]);
    await store.update?.();
    product = (await waitForProduct(store, productId)) ?? undefined;
  }
  if (!product) throw new Error(`Product ${productId} not found in App Store. Check the product id and that the subscription is approved in App Store Connect.`);
  if (!product.canPurchase) throw new Error(`Product ${productId} is not purchasable yet (still loading or not approved in App Store Connect).`);

  return new Promise((resolve, reject) => {
    pendingPurchases.set(productId, {
      verify: (transaction) => {
        const transactionId = transaction.transactionId;
        const appleProductId = transaction.products[0]?.id ?? productId;
        return verifyAppleReceipt({
          transactionId,
          originalTransactionId: transactionId, // first purchase
          productId: appleProductId,
        });
      },
      resolve,
      reject,
    });

    placeOrder(store, product, productId, reject);
  });
}

/**
 * Purchase a one-time consumable via Apple IAP (boost / lead unlock / deal creation).
 *
 * The product id is resolved server-side from admin settings and returned by the
 * checkout call. We register it as a consumable on demand (product ids are dynamic),
 * order it, then hand the StoreKit transaction id to `verify` — which should call
 * the backend `/payment/verify/apple-consumable` to fulfil the pending payment.
 * The transaction is only finished once the backend confirms fulfilment.
 */
export async function purchaseConsumable<T>(
  productId: string,
  verify: (transactionId: string) => Promise<T>,
  // Boost is sold as an auto-renewable subscription; lead/deal as consumables.
  // The StoreKit registration type must match the product's type in App Store
  // Connect or it won't load.
  productType: 'consumable' | 'subscription' = 'consumable',
): Promise<T> {
  const store = getStore();
  if (!store) throw new Error('IAP store not available');
  const CdvPurchase = window.CdvPurchase!;

  // Register the product BEFORE initializing — cordova-plugin-purchase v13 only
  // loads products registered prior to initialize(). Registering here (idempotent)
  // guarantees the product is in the first load even if this purchase wins the
  // race against the app-start init effect. If the store is already initialized
  // (normal case: init effect pre-registered all consumables), register is a no-op.
  if (!store.get(productId)) {
    store.register([
      {
        id: productId,
        type:
          productType === 'subscription'
            ? CdvPurchase.ProductType.PAID_SUBSCRIPTION
            : CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.APPLE_APPSTORE,
      },
    ]);
  }
  await ensureInitialized(store);

  let product = store.get(productId);
  if (!product || !product.canPurchase) {
    await store.update?.();
    product = (await waitForProduct(store, productId)) ?? undefined;
  }
  if (!product) {
    // Diagnostic: list what StoreKit actually returned so id mismatches are obvious.
    const loaded = (store.products ?? [])
      .map((p) => `${p.id}${p.canPurchase ? '(ok)' : p.pricing ? '' : '(not loaded)'}`)
      .join(', ') || 'none';
    console.error(`[IAP] Product "${productId}" not loaded. StoreKit returned: [${loaded}]`);
    throw new Error(`Product ${productId} not found in App Store. StoreKit loaded: [${loaded}]. Verify the product id matches exactly, the Paid Apps Agreement is active, and IAP capability is enabled.`);
  }
  if (!product.canPurchase) throw new Error(`Product ${productId} is not purchasable yet (still loading or not approved in App Store Connect).`);

  return new Promise<T>((resolve, reject) => {
    pendingPurchases.set(productId, {
      verify: (transaction) => verify(transaction.transactionId),
      resolve,
      reject,
    });

    placeOrder(store, product!, productId, reject);
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
