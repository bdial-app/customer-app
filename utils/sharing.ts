import { isNativePlatform, getNativePlatform } from "./platform";

/**
 * Canonical app URL used for all sharing links.
 * Matches metadataBase in layout.tsx and deep link domains in AndroidManifest.xml.
 * On native, window.location.origin returns "https://localhost" which is useless for sharing.
 */
export const APP_BASE_URL: string = process.env.NEXT_APP_BASE_URL ?? "https://tijarahapp.in";
/**
 * Store links for native app downloads.
 * Configure via NEXT_PUBLIC_PLAY_STORE_URL and NEXT_PUBLIC_APP_STORE_URL in .env
 */
export const PLAY_STORE_URL: string = process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.tijarah.app';
export const APP_STORE_URL: string = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/tijarah/id000000000';

/**
 * Get the appropriate download link based on the current platform.
 * On Android native → Play Store link
 * On iOS native → App Store link
 * On web → website URL (which has smart banner / deep link support)
 */
export function getAppDownloadLink(): string {
  const platform = getNativePlatform();
  if (platform === "android") return PLAY_STORE_URL;
  if (platform === "ios") return APP_STORE_URL;
  return APP_BASE_URL;
}

/**
 * Look a place up by name on Maps, for businesses we have no exact pin for.
 * Better than navigating someone to a city centre we guessed.
 */
export function openPlaceSearch(query: string) {
  const q = encodeURIComponent(query.trim());
  if (!q) return;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    window.location.href = `maps://maps.apple.com/?q=${q}`;
  } else {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
}

/**
 * Open directions to a location in Google Maps.
 * On mobile: tries to open the native Maps app.
 * On desktop: opens Google Maps in a new tab.
 */
export function openDirections(lat: number, lng: number, label?: string) {
  const destination = `${lat},${lng}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isAndroid) {
    window.location.href = `google.navigation:q=${destination}`;
  } else if (isIOS) {
    window.location.href = `maps://maps.apple.com/?daddr=${destination}&dirflg=d`;
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=&travelmode=driving`,
      "_blank",
      "noopener,noreferrer",
    );
  }
}

/**
 * Share content using Capacitor Share plugin on native, Web Share API on web,
 * with clipboard fallback.
 */
export async function shareContent(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  // Without a url the message is shared as text alone (share targets would
  // otherwise append one), and the clipboard fallback copies the whole text.
  const payload = data.url ? data : { title: data.title, text: data.text };
  const fallbackText = data.url ?? data.text;

  // Native: use Capacitor Share plugin for reliable native share sheet
  if (isNativePlatform()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ ...payload, dialogTitle: data.title });
      return "shared";
    } catch {
      // User cancelled or plugin error — fallback to clipboard
    }
    try {
      await navigator.clipboard.writeText(fallbackText);
      return "copied";
    } catch {
      return "failed";
    }
  }

  // Web: use Web Share API with clipboard fallback
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch {
      // User cancelled or error — fallback to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(fallbackText);
    return "copied";
  } catch {
    return "failed";
  }
}

/**
 * Build an invite link for the app.
 */
export function buildInviteLink(referrerName?: string): string {
  const params = referrerName ? `?ref=${encodeURIComponent(referrerName)}` : "";
  return `${APP_BASE_URL}${params}`;
}

/**
 * Build a shareable link for a provider details page.
 */
export function buildProviderLink(providerId: string): string {
  return `${APP_BASE_URL}/provider-details?id=${encodeURIComponent(
    providerId,
  )}`;
}

/**
 * Store links worth putting in front of people. The App Store link is skipped
 * while it is still the placeholder id, so we never share a dead link.
 */
function getStoreLinks(): { label: string; url: string }[] {
  const links = [{ label: "Android", url: PLAY_STORE_URL }];
  if (!/id0+$/.test(APP_STORE_URL)) links.push({ label: "iPhone", url: APP_STORE_URL });
  return links;
}

/**
 * Share a provider's profile with proper content and URL.
 */
export async function shareProvider(provider: {
  id: string;
  brandName: string;
  description?: string | null;
  categoryLabel?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const description = provider.description?.replace(/\s+/g, " ").trim();
  const blurb =
    description && description.length > 140
      ? `${description.slice(0, 137).trimEnd()}...`
      : description;

  const lines = [`Check out ${provider.brandName} on Tijarah Connect`];
  if (provider.categoryLabel) lines.push(provider.categoryLabel);
  if (blurb) lines.push("", blurb);
  lines.push("", "Find trusted local businesses near you. Get the Tijarah Connect app:");
  for (const store of getStoreLinks()) lines.push(`${store.label}: ${store.url}`);

  return shareContent({
    title: `${provider.brandName} on Tijarah Connect`,
    text: lines.join("\n"),
  });
}

/**
 * Open WhatsApp with pre-filled text. Works on both native and web.
 */
export function openWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  window.open(
    `https://wa.me/?text=${encoded}`,
    "_blank",
    "noopener,noreferrer",
  );
}

/**
 * Share an invite to join the app.
 * On native: shares the appropriate store link (Play Store / App Store) so recipients can download.
 * On web: shares the website deep link.
 */
export async function shareInvite(
  referrerName?: string,
): Promise<"shared" | "copied" | "failed"> {
  const downloadLink = getAppDownloadLink();
  const webLink = buildInviteLink(referrerName);
  // On native, share the store link; on web, share the website link
  const link = isNativePlatform() ? downloadLink : webLink;
  return shareContent({
    title: "Join Tijarah Connect",
    text: referrerName
      ? `${referrerName} invites you to discover amazing local businesses on Tijarah Connect!\n\nDownload the app:`
      : "Discover amazing local businesses on Tijarah Connect!\n\nDownload the app:",
    url: link,
  });
}
