/**
 * Platform detection utilities for Capacitor native vs web/PWA.
 */

let _isNative: boolean | null = null;

/**
 * Returns true if the app is running inside a Capacitor native shell (Android/iOS).
 * Returns false for web browsers and PWA mode.
 * Only caches `true` permanently — `false` is recomputed until Capacitor is ready.
 */
export function isNativePlatform(): boolean {
  if (_isNative === true) return true;

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Capacitor injects this on the window object in native shells
    const cap = (window as any).Capacitor;
    const result = cap?.isNativePlatform?.() ?? false;
    if (result) _isNative = true;
    return result;
  } catch {
    return false;
  }
}

/**
 * Get the native platform name: 'android', 'ios', or 'web'.
 */
export function getNativePlatform(): 'android' | 'ios' | 'web' {
  if (typeof window === 'undefined') return 'web';

  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const platform = cap.getPlatform?.();
      if (platform === 'android') return 'android';
      if (platform === 'ios') return 'ios';
    }
  } catch {
    // fall through
  }

  return 'web';
}
