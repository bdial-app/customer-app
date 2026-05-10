import { isNativePlatform } from "./platform";
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
      throw new Error("Location permission denied");
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
