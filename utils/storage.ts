import { Preferences } from "@capacitor/preferences";

/**
 * Cross-platform storage utility.
 * - Native (Capacitor): Uses @capacitor/preferences (SharedPreferences on Android, UserDefaults on iOS)
 * - Web/PWA: Falls back to localStorage
 *
 * This ensures tokens are stored in platform-appropriate secure storage
 * rather than unencrypted localStorage on native devices.
 */

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export async function getItem(key: string): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isNative()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

export async function removeItem(key: string): Promise<void> {
  if (isNative()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Synchronous getter for cases where async isn't possible (e.g. axios interceptors).
 * On native, this reads from a memory cache that is hydrated at app start.
 * On web, this reads from localStorage directly.
 */
let tokenCache: string | null = null;
let userCache: string | null = null;

export function getTokenSync(): string | null {
  if (!isNative()) {
    return localStorage.getItem("token");
  }
  return tokenCache;
}

export function getUserSync(): string | null {
  if (!isNative()) {
    return localStorage.getItem("user");
  }
  return userCache;
}

export function setTokenCache(token: string | null): void {
  tokenCache = token;
}

export function setUserCache(user: string | null): void {
  userCache = user;
}

/**
 * Hydrate in-memory caches from Preferences on app startup.
 * Call this early in your app initialization (e.g. in a provider or layout).
 */
export async function hydrateStorageCache(): Promise<void> {
  if (!isNative()) return;
  const { value: token } = await Preferences.get({ key: "token" });
  const { value: user } = await Preferences.get({ key: "user" });
  tokenCache = token;
  userCache = user;
}
