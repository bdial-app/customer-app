import { SHARE_ORIGIN } from "./share-links";

/**
 * Message links carry their screen as an in-app route, sometimes with
 * `mode=provider|customer` (which side of the app it belongs to). Split it so
 * the app can switch mode, then open the route.
 */
export function splitAppTarget(target: string): { path: string; mode: "provider" | "customer" | null } {
  try {
    const url = new URL(target, "https://app.local");
    const mode = url.searchParams.get("mode");
    url.searchParams.delete("mode");
    const search = url.searchParams.toString();
    return {
      path: `${url.pathname}${search ? `?${search}` : ""}`,
      mode: mode === "provider" || mode === "customer" ? mode : null,
    };
  } catch {
    return { path: "/", mode: null };
  }
}

// ── Review links ───────────────────────────────────────────────────────────

/** The link an owner shares so customers can review them: /r?b=<business id>. */
export const reviewLinkUrl = (providerId: string) => `${SHARE_ORIGIN}/r?b=${encodeURIComponent(providerId)}`;

const VIA_KEY = "tijarah.reviewVia";

/** Remember that this review started from the owner's link (for this session). */
export function markReviewFromLink(providerId: string): void {
  try {
    sessionStorage.setItem(VIA_KEY, providerId);
  } catch {
    /* private mode: the review still works, just isn't credited to the link */
  }
}

export function cameFromReviewLink(providerId: string): boolean {
  try {
    return sessionStorage.getItem(VIA_KEY) === providerId;
  } catch {
    return false;
  }
}

/** The business page with the review sheet open, stars filled in. */
export const reviewRoute = (providerId: string, stars?: number | null) =>
  `/provider-details?id=${encodeURIComponent(providerId)}&review=1${stars ? `&stars=${stars}` : ""}`;
