/**
 * Platform detection utilities for Capacitor native vs web/PWA.
 */

let _isNative: boolean | null = null;

/**
 * Returns true if the app is running inside a Capacitor native shell (Android/iOS).
 * Returns false for web browsers and PWA mode.
 */
export function isNativePlatform(): boolean {
  if (_isNative !== null) return _isNative;

  if (typeof window === 'undefined') {
    _isNative = false;
    return false;
  }

  try {
    // Capacitor injects this on the window object in native shells
    const cap = (window as any).Capacitor;
    _isNative = cap?.isNativePlatform?.() ?? false;
  } catch {
    _isNative = false;
  }

  return _isNative;
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
