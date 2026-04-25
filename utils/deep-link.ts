import { ROUTE_PATH } from "./contants";

export interface DeepLinkData {
  route?: string;
  params?: Record<string, string>;
}

/**
 * Parse deep link data from a notification payload and return the target URL.
 */
export function resolveDeepLink(data: DeepLinkData | null | undefined): string {
  if (!data?.route) return ROUTE_PATH.HOME;

  const route = data.route;
  const params = data.params || {};

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

    case "/":
      if (params.tab) {
        return `${ROUTE_PATH.HOME}?tab=${params.tab}`;
      }
      return ROUTE_PATH.HOME;

    default:
      return route.startsWith("/") ? route : ROUTE_PATH.HOME;
  }
}
