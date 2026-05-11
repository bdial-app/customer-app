import { isNativePlatform, getNativePlatform } from "./platform";
import { Geolocation } from "@capacitor/geolocation";

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/** Error codes for location failures */
export const LOCATION_PERMISSION_DENIED = "LOCATION_PERMISSION_DENIED";
export const LOCATION_SERVICES_DISABLED = "LOCATION_SERVICES_DISABLED";
export const LOCATION_TIMEOUT = "LOCATION_TIMEOUT";
export const LOCATION_UNAVAILABLE = "LOCATION_UNAVAILABLE";

function makeGeoError(message: string, code: string): Error {
  const err = new Error(message);
  (err as any).code = code;
  return err;
}

/**
 * Get current position using Capacitor Geolocation on native,
 * falling back to navigator.geolocation on web.
 */
export async function getCurrentPosition(
  options?: GeoOptions,
): Promise<GeoPosition> {
  if (isNativePlatform()) {
    return getNativePosition(options);
  }

  // Web fallback
  return getWebPosition(options);
}

async function getNativePosition(options?: GeoOptions): Promise<GeoPosition> {
  // 1. Request permission — will throw if system location services are disabled
  let permStatus;
  try {
    permStatus = await Geolocation.requestPermissions({
      permissions: ["location", "coarseLocation"],
    });
  } catch (e: any) {
    // Capacitor throws when system location services (GPS) are disabled
    const msg = e?.message?.toLowerCase?.() || "";
    if (
      msg.includes("location service") ||
      msg.includes("location disabled") ||
      msg.includes("gps") ||
      msg.includes("denied") ||
      msg.includes("not available")
    ) {
      throw makeGeoError(
        "Location services are disabled. Please enable GPS in your device settings.",
        LOCATION_SERVICES_DISABLED,
      );
    }
    throw makeGeoError(
      "Unable to access location. Please check your device settings.",
      LOCATION_UNAVAILABLE,
    );
  }

  // 2. Check permission result
  if (
    permStatus.location !== "granted" &&
    permStatus.coarseLocation !== "granted"
  ) {
    throw makeGeoError(
      "Location permission denied. Please allow location access in app settings.",
      LOCATION_PERMISSION_DENIED,
    );
  }

  // 3. Get position — try high accuracy first, fall back to low accuracy on timeout
  const highAccuracy = options?.enableHighAccuracy ?? true;
  const timeout = options?.timeout ?? 15000;

  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: highAccuracy,
      timeout,
      maximumAge: options?.maximumAge ?? 30000,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch (e: any) {
    // If high accuracy failed (GPS timeout), retry with low accuracy (network-based)
    if (highAccuracy) {
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        });
        return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch {
        // Fall through to final error
      }
    }

    const msg = e?.message?.toLowerCase?.() || "";
    if (msg.includes("timeout")) {
      throw makeGeoError(
        "Location request timed out. Please try again in an open area.",
        LOCATION_TIMEOUT,
      );
    }
    throw makeGeoError(
      "Unable to determine your location. Please try again.",
      LOCATION_UNAVAILABLE,
    );
  }
}

function getWebPosition(options?: GeoOptions): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(makeGeoError("Geolocation not available", LOCATION_UNAVAILABLE));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(makeGeoError("Location permission denied", LOCATION_PERMISSION_DENIED));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(makeGeoError("Location request timed out", LOCATION_TIMEOUT));
          return;
        }
        reject(makeGeoError("Unable to determine location", LOCATION_UNAVAILABLE));
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 30000,
      },
    );
  });
}

/**
 * Open the device's app settings page so the user can enable location permission.
 * Uses native Capacitor bridge on Android/iOS.
 */
export async function openAppSettings(): Promise<void> {
  if (!isNativePlatform()) return;

  const platform = getNativePlatform();

  try {
    // Use Capacitor's native bridge to open settings
    const Capacitor = (window as any).Capacitor;
    if (!Capacitor) return;

    if (platform === "android") {
      // Call native Android intent to open app settings
      const appId = Capacitor.Plugins?.App
        ? (await Capacitor.Plugins.App.getInfo()).id
        : "com.tijarah.app";
      // Use Capacitor's native bridge to send intent
      await Capacitor.Plugins.Geolocation?.requestPermissions?.({
        permissions: ["location"],
      }).catch(() => {});
      // If that doesn't trigger settings, try opening location settings via native
      try {
        // Last resort: open Android location settings using intent URI
        window.open(
          `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${appId};end`,
          "_system",
        );
      } catch {
        // Best effort
      }
    } else if (platform === "ios") {
      // iOS opens app-specific settings via this URL scheme
      window.open("app-settings:", "_system");
    }
  } catch {
    // Best effort — user will see guidance message in UI
  }
}
