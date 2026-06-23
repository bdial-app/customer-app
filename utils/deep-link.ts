import { ROUTE_PATH } from "./contants";

export interface DeepLinkData {
  route?: string;
  params?: Record<string, string> | string;
}

const DEEPLINK_LAUNCH_KEY = "tijarah_deeplink_launch";

/**
 * Mark that this WebView session was launched/resumed via a deep link, so the
 * first-launch onboarding overlay (PermissionPrompt) doesn't cover the
 * deep-linked screen. Uses a window global (fast) + sessionStorage (survives a
 * hard-nav reload within the same WebView session) + an event (so an
 * already-mounted PermissionPrompt re-renders and hides itself immediately).
 * sessionStorage is per WebView session, so it auto-clears on the next cold
 * launch — the prompt still shows on a normal (non-deep-link) start.
 */
export function markDeepLinkLaunch(): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>).__TIJARAH_DEEPLINK_LAUNCH__ = true;
  try { sessionStorage.setItem(DEEPLINK_LAUNCH_KEY, "1"); } catch {}
  try { window.dispatchEvent(new Event("tijarah-deeplink-active")); } catch {}
}

/** True when the current WebView session was launched/resumed via a deep link. */
export function isDeepLinkLaunch(): boolean {
  if (typeof window === "undefined") return false;
  if ((window as unknown as Record<string, unknown>).__TIJARAH_DEEPLINK_LAUNCH__) return true;
  try { return sessionStorage.getItem(DEEPLINK_LAUNCH_KEY) === "1"; } catch { return false; }
}

const DEEPLINK_TARGET_KEY = "tijarah_deeplink_target";

/**
 * Begin a COLD-START deep-link load: records the pending target and signals the
 * DeepLinkLoadingScreen to cover the screen with a splash-style loader (instead
 * of the brief Home flash) until the target page reports its content is ready.
 * Cold start only — warm navigations mount the target's own skeleton instantly,
 * so a loader there would just flicker.
 */
export function beginDeepLinkLoading(target: string): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>).__TIJARAH_DEEPLINK_TARGET__ = target;
  try { sessionStorage.setItem(DEEPLINK_TARGET_KEY, target); } catch {}
  try { window.dispatchEvent(new Event("tijarah-deeplink-loading")); } catch {}
}

/** The target route of an in-progress cold-start deep-link load, or null. */
export function getPendingDeepLinkTarget(): string | null {
  if (typeof window === "undefined") return null;
  const w = (window as unknown as Record<string, unknown>).__TIJARAH_DEEPLINK_TARGET__;
  if (typeof w === "string") return w;
  try { return sessionStorage.getItem(DEEPLINK_TARGET_KEY); } catch { return null; }
}

/** End the cold-start deep-link load (target page is ready, or we timed out). */
export function endDeepLinkLoading(): void {
  if (typeof window === "undefined") return;
  delete (window as unknown as Record<string, unknown>).__TIJARAH_DEEPLINK_TARGET__;
  try { sessionStorage.removeItem(DEEPLINK_TARGET_KEY); } catch {}
  try { window.dispatchEvent(new Event("tijarah-deeplink-loaded")); } catch {}
}

/** Pathname (no query, no trailing slash) of a deep-link target string. */
export function deepLinkTargetPathname(target: string): string {
  return (target.split("?")[0] || "/").replace(/\/+$/, "") || "/";
}

/**
 * Parse deep link data from a notification payload and return the target URL.
 * Handles params as either an object or a JSON string (FCM data payloads are always strings).
 */
export function resolveDeepLink(data: DeepLinkData | null | undefined): string {
  if (!data?.route) return ROUTE_PATH.HOME;

  const route = data.route;
  let params: Record<string, string> = {};

  if (data.params) {
    if (typeof data.params === "string") {
      try { params = JSON.parse(data.params); } catch { params = {}; }
    } else {
      params = data.params;
    }
  }

  switch (route) {
    case "/provider-details":
      if (params.id) {
        const url = new URL(ROUTE_PATH.PROVIDER_DETAILS, "http://x");
        url.searchParams.set("id", params.id);
        if (params.tab) url.searchParams.set("tab", params.tab);
        return `${url.pathname}${url.search}`;
      }
      return ROUTE_PATH.HOME;

    case "/product-details":
      if (params.id) {
        return `${ROUTE_PATH.PRODUCT_DETAILS}?id=${params.id}`;
      }
      return ROUTE_PATH.HOME;

    case "/chat":
      // Chat is a tab on the home page — we store conversationId to open it
      if (params.conversationId) {
        return `${ROUTE_PATH.HOME}?tab=chats&conversationId=${params.conversationId}`;
      }
      return `${ROUTE_PATH.HOME}?tab=chats`;

    case "/search":
      return ROUTE_PATH.SEARCH;

    case "/provider-onboarding/verify":
      return "/provider-onboarding/verify";

    case "/provider/subscription":
      return "/provider/subscription";

    case "/provider/deals":
      return "/provider/deals";

    case "/provider/sponsorships":
      return "/provider/sponsorships";

    case "/provider/leads":
      return "/provider/leads";

    case "/":
      if (params.tab) {
        return `${ROUTE_PATH.HOME}?tab=${params.tab}`;
      }
      return ROUTE_PATH.HOME;

    default:
      return route.startsWith("/") ? route : ROUTE_PATH.HOME;
  }
}
