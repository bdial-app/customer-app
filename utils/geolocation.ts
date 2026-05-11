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

/** Error code to distinguish "denied" from other failures */
export const LOCATION_PERMISSION_DENIED = "LOCATION_PERMISSION_DENIED";

/**
 * Get current position using Capacitor Geolocation on native,
 * falling back to navigator.geolocation on web.
 */
export async function getCurrentPosition(
  options?: GeoOptions,
): Promise<GeoPosition> {
  if (isNativePlatform()) {
    // Request permission first on native (no-op if already granted)
    const permStatus = await Geolocation.requestPermissions();
    if (
      permStatus.location !== "granted" &&
      permStatus.coarseLocation !== "granted"
    ) {
      const err = new Error("Location permission denied");
      (err as any).code = LOCATION_PERMISSION_DENIED;
      throw err;
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge,
    });

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  }

  // Web fallback
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not available"));
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
          const err = new Error("Location permission denied");
          (err as any).code = LOCATION_PERMISSION_DENIED;
          reject(err);
          return;
        }
        reject(error);
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy,
        timeout: options?.timeout,
        maximumAge: options?.maximumAge,
      },
    );
  });
}

/**
 * Open the device's app settings page so the user can enable location permission.
 */
export async function openAppSettings(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const platform = getNativePlatform();
    const { App } = await import("@capacitor/app");

    if (platform === "android") {
      const info = await App.getInfo();
      // Opens the app's settings page on Android
      await (App as any).openUrl({
        url: `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${info.id};end`,
      });
    } else if (platform === "ios") {
      await (App as any).openUrl({ url: "app-settings:" });
    }
  } catch {
    // Fallback — nothing we can do
  }
}
