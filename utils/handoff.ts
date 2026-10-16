import { PLAY_STORE_URL } from "./store-links";

export type HandoffDevice = "android" | "ios" | "desktop";

const ANDROID_PACKAGE = "com.pronttera.tijarah";

/** Which phone (or a computer) this web page is open on. */
export function detectHandoffDevice(): HandoffDevice {
  const ua = navigator.userAgent;
  const isIpad = /Macintosh/.test(ua) && "ontouchend" in document;
  if (/iPhone|iPad|iPod/.test(ua) || isIpad) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * Android's "open the app on this screen if it's installed, otherwise Google
 * Play" in one link (Chrome resolves it). Same approach as shared /b/ links.
 */
export function androidIntentUrl(deepPath: string, source: string): string {
  const store = `${PLAY_STORE_URL}&referrer=${encodeURIComponent(`utm_source=${source}&deep_link=${deepPath}`)}`;
  return (
    `intent://${window.location.host}${deepPath}` +
    `#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(store)};end`
  );
}
