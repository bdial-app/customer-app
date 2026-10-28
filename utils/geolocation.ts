import { isNativePlatform, getNativePlatform } from "./platform";
import { Geolocation } from "@capacitor/geolocation";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  /** Radius of uncertainty in metres, when the platform reports it. */
  accuracy?: number;
}

export interface GeoOptions {
  /**
   * true: wait for a GPS fix — for pinning a business or an address.
   * Otherwise a quick Wi-Fi/cell fix is returned (well under a second) and
   * GPS refines it in the background; see `onRefine`.
   */
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  /** Called once if the background GPS fix lands noticeably away from the quick one. */
  onRefine?: (pos: GeoPosition) => void;
}

/** Error codes for location failures */
export const LOCATION_PERMISSION_DENIED = "LOCATION_PERMISSION_DENIED";
export const LOCATION_SERVICES_DISABLED = "LOCATION_SERVICES_DISABLED";
export const LOCATION_TIMEOUT = "LOCATION_TIMEOUT";
export const LOCATION_UNAVAILABLE = "LOCATION_UNAVAILABLE";

function makeGeoError(message: string, code: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

/** Lower-cased `message` of a thrown value, or "" when it has none. */
function lowerErrorMessage(e: unknown): string {
  if (typeof e === "object" && e !== null && "message" in e && typeof e.message === "string") {
    return e.message.toLowerCase();
  }
  return "";
}

/** A quick fix this vague is not worth showing; wait for GPS instead. */
const QUICK_MAX_ACCURACY_M = 1000;
/** Below this the quick fix is already as good as GPS would make it. */
const GOOD_ACCURACY_M = 100;
/** A background GPS fix this far from the quick one replaces it. */
const REFINE_MIN_MOVE_M = 100;
/** A fix from this session younger than this is reused outright. */
const SESSION_FIX_TTL_MS = 2 * 60 * 1000;

let lastFix: (GeoPosition & { at: number; precise: boolean }) | null = null;
let quickInFlight: Promise<GeoPosition> | null = null;

const remember = (pos: GeoPosition, precise: boolean): GeoPosition => {
  lastFix = { ...pos, at: Date.now(), precise };
  return pos;
};

const metresBetween = (a: GeoPosition, b: GeoPosition) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Get the current position, using Capacitor Geolocation on native and
 * navigator.geolocation on web.
 *
 * By default this is fast: a fix from the last two minutes is reused, else a
 * Wi-Fi/cell fix is returned and GPS refines it in the background (onRefine).
 * Pass `enableHighAccuracy: true` where the exact spot matters.
 */
export async function getCurrentPosition(
  options?: GeoOptions,
): Promise<GeoPosition> {
  await ensurePermission();
  const precise = options?.enableHighAccuracy === true;
  const timeout = options?.timeout ?? 15000;

  const cached = lastFix;
  if (cached && Date.now() - cached.at < SESSION_FIX_TTL_MS && (cached.precise || !precise)) {
    return { latitude: cached.latitude, longitude: cached.longitude, accuracy: cached.accuracy };
  }

  if (precise) {
    try {
      return remember(await platformPosition(true, timeout, options?.maximumAge ?? 30000), true);
    } catch (e) {
      // No GPS fix in time (indoors): a network fix is better than failing.
      const code = typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
      if (code !== LOCATION_TIMEOUT && code !== LOCATION_UNAVAILABLE) throw e;
      return quickPosition();
    }
  }

  let quick: GeoPosition | null = null;
  try {
    quick = await quickPosition();
  } catch {
    // No network fix to be had (offline, Wi-Fi off) — GPS is the only way.
  }

  if (quick && (quick.accuracy == null || quick.accuracy <= QUICK_MAX_ACCURACY_M)) {
    if (quick.accuracy != null && quick.accuracy > GOOD_ACCURACY_M) refineInBackground(quick, options?.onRefine);
    return quick;
  }
  try {
    return remember(await platformPosition(true, timeout, 30000), true);
  } catch (e) {
    // A vague fix still beats none.
    if (quick) return quick;
    throw e;
  }
}

/** The Wi-Fi/cell fix, shared by every caller asking at the same moment. */
function quickPosition(): Promise<GeoPosition> {
  if (!quickInFlight) {
    quickInFlight = platformPosition(false, 4000, 5 * 60 * 1000)
      .then((pos) => remember(pos, false))
      .finally(() => {
        quickInFlight = null;
      });
  }
  return quickInFlight;
}

function refineInBackground(quick: GeoPosition, onRefine?: (pos: GeoPosition) => void) {
  platformPosition(true, 15000, 0)
    .then((pos) => {
      remember(pos, true);
      if (onRefine && metresBetween(quick, pos) >= REFINE_MIN_MOVE_M) onRefine(pos);
    })
    .catch(() => {
      // Keep the quick fix.
    });
}

/**
 * Start a quick fix in the background when permission is already granted, so
 * "Use current location" answers at once. Never prompts.
 */
export async function warmUpLocation(): Promise<void> {
  try {
    if (lastFix && Date.now() - lastFix.at < SESSION_FIX_TTL_MS) return;
    if (isNativePlatform()) {
      const status = await Geolocation.checkPermissions();
      if (status.location !== "granted" && status.coarseLocation !== "granted") return;
    } else {
      if (typeof navigator === "undefined" || !navigator.permissions || !navigator.geolocation) return;
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state !== "granted") return;
    }
    await quickPosition();
  } catch {
    // Warming up is best-effort.
  }
}

/** Ask for permission only when it isn't already granted — asking again costs a native round trip. */
async function ensurePermission(): Promise<void> {
  if (!isNativePlatform()) return; // the browser asks on the first position request

  try {
    const current = await Geolocation.checkPermissions();
    if (current.location === "granted" || current.coarseLocation === "granted") return;
  } catch {
    // Fall through to requesting.
  }

  let permStatus;
  try {
    permStatus = await Geolocation.requestPermissions({
      permissions: ["location", "coarseLocation"],
    });
  } catch (e: unknown) {
    // Capacitor throws when system location services (GPS) are disabled
    const msg = lowerErrorMessage(e);
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

  if (
    permStatus.location !== "granted" &&
    permStatus.coarseLocation !== "granted"
  ) {
    throw makeGeoError(
      "Location permission denied. Please allow location access in app settings.",
      LOCATION_PERMISSION_DENIED,
    );
  }
}

function platformPosition(highAccuracy: boolean, timeout: number, maximumAge: number): Promise<GeoPosition> {
  return isNativePlatform()
    ? getNativePosition(highAccuracy, timeout, maximumAge)
    : getWebPosition(highAccuracy, timeout, maximumAge);
}

async function getNativePosition(highAccuracy: boolean, timeout: number, maximumAge: number): Promise<GeoPosition> {
  try {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: highAccuracy, timeout, maximumAge });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
  } catch (e: unknown) {
    // Plugin codes: OS-PLUG-GLOC-0003 denied, 0007/0009/0017 location off, 0010 timeout.
    const code = typeof e === "object" && e !== null && "code" in e ? String(e.code) : "";
    const msg = lowerErrorMessage(e);
    if (code.endsWith("0003")) {
      throw makeGeoError("Location permission denied. Please allow location access in app settings.", LOCATION_PERMISSION_DENIED);
    }
    if (/00(07|09|17)$/.test(code) || msg.includes("not enabled") || msg.includes("turned off")) {
      throw makeGeoError("Location services are disabled. Please enable GPS in your device settings.", LOCATION_SERVICES_DISABLED);
    }
    if (code.endsWith("0010") || msg.includes("timeout") || msg.includes("in time")) {
      throw makeGeoError("Location request timed out. Please try again in an open area.", LOCATION_TIMEOUT);
    }
    throw makeGeoError("Unable to determine your location. Please try again.", LOCATION_UNAVAILABLE);
  }
}

function getWebPosition(highAccuracy: boolean, timeout: number, maximumAge: number): Promise<GeoPosition> {
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
          accuracy: position.coords.accuracy,
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
      { enableHighAccuracy: highAccuracy, timeout, maximumAge },
    );
  });
}

/**
 * Like `getCurrentPosition`, but if the call fails because the user previously
 * denied the location permission (or denies it now), shows a global sheet that
 * explains why and links to the device's Settings app.
 *
 * `featureLabel` is woven into the sheet copy (e.g. "Detecting your location").
 * The original error is still thrown so callers can run their own fallback.
 */
export async function requestLocationOrPrompt(
  featureLabel?: string,
  options?: GeoOptions,
): Promise<GeoPosition> {
  try {
    return await getCurrentPosition(options);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === LOCATION_PERMISSION_DENIED
    ) {
      const { showLocationDeniedSheet } = await import(
        "@/hooks/useLocationDeniedSheet"
      );
      showLocationDeniedSheet(featureLabel);
    }
    throw err;
  }
}

/**
 * Open the device's app settings page so the user can enable location permission.
 * Uses capacitor-native-settings plugin on Android/iOS.
 */
export async function openAppSettings(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const { NativeSettings, AndroidSettings, IOSSettings } = await import(
      "capacitor-native-settings"
    );
    await NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App,
    });
  } catch {
    // Fallback — nothing we can do
  }
}
