import { Preferences } from "@capacitor/preferences";

/**
 * Cross-platform storage utility.
 *
 * Strategy:
 * - **Web / PWA**: localStorage for everything (sync, reliable).
 * - **Native (Capacitor)**: localStorage is available in the WebView and used
 *   for fast synchronous reads. Every write also mirrors to
 *   @capacitor/preferences (SharedPreferences on Android, UserDefaults on iOS)
 *   which survives WebView data clears by the OS.
 *   On startup, `hydrateStorageCache()` copies Preferences → localStorage so
 *   sync readers see the latest persisted values.
 *
 * Auth keys ("token", "user") additionally use an in-memory cache so the axios
 * interceptor (`getTokenSync`) never has to touch async storage mid-request.
 */

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

// ── Async helpers ────────────────────────────────────────────────────
// Await these when you need confirmation that the write persisted.

export async function getItem(key: string): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  // Always write to localStorage for immediate sync availability
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
    if (key === "token") tokenCache = value;
    if (key === "user") userCache = value;
  }
  if (isNative()) {
    await Preferences.set({ key, value });
  }
}

export async function removeItem(key: string): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
    if (key === "token") tokenCache = null;
    if (key === "user") userCache = null;
  }
  if (isNative()) {
    await Preferences.remove({ key });
  }
}

// ── Sync helpers ─────────────────────────────────────────────────────
// Use these in Redux reducers, useState initialisers, and other sync code.
// Writes mirror to Preferences (fire-and-forget) on native.

/** Read a value synchronously. Works on all platforms (WebView has localStorage). */
export function getItemSync(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (key === "token") return getTokenSync();
  if (key === "user") return getUserSync();
  return localStorage.getItem(key);
}

/** Write a value synchronously to localStorage + Preferences (native). */
export function setItemSync(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
  if (key === "token") tokenCache = value;
  if (key === "user") userCache = value;
  if (isNative()) {
    Preferences.set({ key, value }).catch(() => {});
  }
}

/** Remove a value synchronously from localStorage + Preferences (native). */
export function removeItemSync(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
  if (key === "token") tokenCache = null;
  if (key === "user") userCache = null;
  if (isNative()) {
    Preferences.remove({ key }).catch(() => {});
  }
}

// ── Auth-specific sync getters (for axios interceptor) ──────────────

let tokenCache: string | null = null;
let userCache: string | null = null;

export function getTokenSync(): string | null {
  if (!isNative()) {
    return localStorage.getItem("token");
  }
  // Prefer memory cache, fall back to WebView localStorage
  return tokenCache ?? localStorage.getItem("token");
}

export function getUserSync(): string | null {
  if (!isNative()) {
    return localStorage.getItem("user");
  }
  return userCache ?? localStorage.getItem("user");
}

export function setTokenCache(token: string | null): void {
  tokenCache = token;
}

export function setUserCache(user: string | null): void {
  userCache = user;
}

// ── Hydration ────────────────────────────────────────────────────────
// Call once at app startup (before Redux hydrate). Copies every persisted
// Preferences key into localStorage so sync readers see them immediately.

export async function hydrateStorageCache(): Promise<void> {
  if (!isNative()) return;
  const { keys } = await Preferences.keys();
  for (const key of keys) {
    const { value } = await Preferences.get({ key });
    if (value !== null) {
      try { localStorage.setItem(key, value); } catch {}
    }
    if (key === "token") tokenCache = value;
    if (key === "user") userCache = value;
  }
}
