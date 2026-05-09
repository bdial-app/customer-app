"use client";
import { useSyncExternalStore, useCallback, useEffect, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
  /** True only when transitioning from offline → online. Auto-clears after timeout. */
  showBackOnline: boolean;
  dismissBackOnline: () => void;
}

// ── Global singleton so every screen shares ONE network state ──
let _isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
let _hasBeenOffline = false; // tracks if user was ever offline this session
let _showBackOnline = false;
let _backOnlineTimer: ReturnType<typeof setTimeout> | null = null;
let _initialized = false;
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((l) => l());
}

function _setOnline(online: boolean) {
  const wasOffline = !_isOnline;
  if (online === _isOnline && !(_showBackOnline && !online)) return; // no change

  _isOnline = online;

  if (online && wasOffline && _hasBeenOffline) {
    // Genuine offline → online transition
    _showBackOnline = true;
    if (_backOnlineTimer) clearTimeout(_backOnlineTimer);
    _backOnlineTimer = setTimeout(() => {
      _showBackOnline = false;
      _backOnlineTimer = null;
      _notify();
    }, 3000);
  }

  if (!online) {
    _hasBeenOffline = true;
    _showBackOnline = false;
    if (_backOnlineTimer) {
      clearTimeout(_backOnlineTimer);
      _backOnlineTimer = null;
    }
  }

  _notify();
}

function _dismissBackOnline() {
  if (!_showBackOnline) return;
  _showBackOnline = false;
  if (_backOnlineTimer) {
    clearTimeout(_backOnlineTimer);
    _backOnlineTimer = null;
  }
  _notify();
}

function _initListeners() {
  if (_initialized) return;
  _initialized = true;

  if (typeof window === "undefined") return;

  if ((window as any).Capacitor?.isNativePlatform?.()) {
    import("@capacitor/network").then(({ Network }) => {
      Network.getStatus().then((status) => {
        // Only mark offline on init, never trigger "back online" on first load
        if (!status.connected) {
          _hasBeenOffline = true;
          _isOnline = false;
          _notify();
        }
      });

      Network.addListener("networkStatusChange", (status) => {
        _setOnline(status.connected);
      });
    });
  } else {
    window.addEventListener("online", () => _setOnline(true));
    window.addEventListener("offline", () => _setOnline(false));
  }
}

function _getSnapshot() {
  return { isOnline: _isOnline, showBackOnline: _showBackOnline };
}

// Cache the snapshot object to avoid unnecessary re-renders
let _cachedSnapshot = _getSnapshot();
let _prevOnline = _isOnline;
let _prevShowBack = _showBackOnline;

function getSnapshot() {
  if (_isOnline !== _prevOnline || _showBackOnline !== _prevShowBack) {
    _cachedSnapshot = _getSnapshot();
    _prevOnline = _isOnline;
    _prevShowBack = _showBackOnline;
  }
  return _cachedSnapshot;
}

function subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

const serverSnapshot = { isOnline: true, showBackOnline: false };
function getServerSnapshot() {
  return serverSnapshot;
}

/**
 * Detects online/offline state and provides reactive status.
 * Uses a global singleton so navigating between screens never
 * re-triggers the "Back Online" banner.
 *
 * Uses @capacitor/network on native for reliable detection,
 * falls back to browser online/offline events on web.
 */
export function useNetworkStatus(): NetworkStatus {
  // Initialize listeners once
  const initRef = useRef(false);
  if (!initRef.current) {
    initRef.current = true;
    _initListeners();
  }

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isOnline: snapshot.isOnline,
    showBackOnline: snapshot.showBackOnline,
    dismissBackOnline: _dismissBackOnline,
  };
}
