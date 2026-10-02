/**
 * Where "get the app" sends people. Checked against both stores on 2 Oct 2026:
 *
 *   Google Play  com.pronttera.tijarah — the Android applicationId
 *   App Store    "Tijarah", id6772507338 (bundle com.tijarah.appstore), v1.0.2
 *
 * Hard-coded on purpose. A store listing is the same in every environment, and
 * the env values these replace pointed at a package that does not exist
 * (com.tijarah.app, a 404) and an App Store placeholder (id000000000), so every
 * share and every "get the app" button led nowhere.
 *
 * The App Store link carries no country, so Apple sends each person to their
 * own storefront — the app has users outside India.
 */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pronttera.tijarah";
export const APP_STORE_URL = "https://apps.apple.com/app/id6772507338";

export type DevicePlatform = "android" | "ios";

/**
 * The phone in someone's hand. Inside the native app Capacitor says so; in a
 * browser the user agent is the only clue. iPadOS reports itself as a Mac,
 * which the touch check catches.
 */
export function detectDevicePlatform(nativePlatform?: "android" | "ios" | "web"): DevicePlatform {
  if (nativePlatform === "android" || nativePlatform === "ios") return nativePlatform;
  if (typeof navigator === "undefined") return "android";
  const ua = navigator.userAgent;
  const isIpad = /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
  return /iPhone|iPad|iPod/.test(ua) || isIpad ? "ios" : "android";
}

export const storeUrlFor = (platform: DevicePlatform) => (platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL);

/**
 * Both links, labelled, for a message that will be read on someone else's
 * phone — the sender cannot know which store the reader uses.
 */
export const storeLinksText = () => `Android: ${PLAY_STORE_URL}\niPhone: ${APP_STORE_URL}`;
