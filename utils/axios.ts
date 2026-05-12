import axios from "axios";
import { getTokenSync, removeItem, setTokenCache } from "@/utils/storage";
import { getIsOnline } from "@/hooks/useNetworkStatus";

/** Typed error thrown when a request is attempted while the device is offline. */
export class OfflineError extends Error {
  readonly isOffline = true;
  constructor() { super("No internet connection"); this.name = "OfflineError"; }
}

/** Type-guard to check if an error is an OfflineError or a network failure. */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof OfflineError) return true;
  if (!axios.isAxiosError(error)) return false;
  // No response at all (network failure, DNS, timeout, etc.)
  if (!error.response) return true;
  const code = error.code;
  return code === "ERR_NETWORK" || code === "ECONNABORTED" || code === "ERR_CANCELED";
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  timeout: 20_000, // 20s — prevents requests from hanging on slow mobile data
  headers: {
    "Content-Type": "application/json",
  },
});

// Event emitter for account paused state
type AccountPausedListener = () => void;
const pausedListeners: AccountPausedListener[] = [];
export const onAccountPaused = (listener: AccountPausedListener) => {
  pausedListeners.push(listener);
  return () => {
    const idx = pausedListeners.indexOf(listener);
    if (idx >= 0) pausedListeners.splice(idx, 1);
  };
};

// Event emitter for inappropriate content errors (400 from sanitizer)
type InappropriateContentListener = (message: string) => void;
const inappropriateContentListeners: InappropriateContentListener[] = [];
export const onInappropriateContent = (listener: InappropriateContentListener) => {
  inappropriateContentListeners.push(listener);
  return () => {
    const idx = inappropriateContentListeners.indexOf(listener);
    if (idx >= 0) inappropriateContentListeners.splice(idx, 1);
  };
};

// Event emitter for unauthorized (401 / non-paused 403) — triggers auth gate
type UnauthorizedListener = () => void;
const unauthorizedListeners: UnauthorizedListener[] = [];
export const onUnauthorized = (listener: UnauthorizedListener) => {
  unauthorizedListeners.push(listener);
  return () => {
    const idx = unauthorizedListeners.indexOf(listener);
    if (idx >= 0) unauthorizedListeners.splice(idx, 1);
  };
};

// ─── Token expiry check ─────────────────────────────────────────────
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // 60s buffer before actual expiry
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return false;
  }
}

/** Returns true if the token will expire within 30 days (proactive refresh window) */
function shouldRefreshToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return payload.exp * 1000 < Date.now() + thirtyDaysMs;
  } catch {
    return false;
  }
}

// ─── Silent token refresh ───────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

/** Notify all queued requests after a refresh attempt */
function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/** Subscribe to the refresh result — resolves when the refresh completes */
function subscribeTokenRefresh(): Promise<string | null> {
  return new Promise((resolve) => {
    refreshSubscribers.push(resolve);
  });
}

async function silentRefresh(): Promise<string | null> {
  if (isRefreshing) {
    // Already refreshing — wait for it
    return subscribeTokenRefresh();
  }
  isRefreshing = true;
  try {
    const { data } = await apiClient.post(
      "/auth/refresh",
      {},
    );
    if (data?.accessToken) {
      setTokenCache(data.accessToken);
      await import("@/utils/storage").then((m) => m.setItem("token", data.accessToken));
      onRefreshed(data.accessToken);
      return data.accessToken;
    }
    onRefreshed(null);
    return null;
  } catch {
    onRefreshed(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

// Request interceptor — attach token if present, check expiry proactively
apiClient.interceptors.request.use((config) => {
  // Warn but don't block when offline — mobile data (5G/LTE) may briefly report
  // offline during network transitions, and getIsOnline() can be inaccurate when
  // ACCESS_NETWORK_STATE is not yet granted or the Capacitor Network plugin
  // hasn't fully initialised.  Let the request attempt and fail naturally so
  // axios retries / React-Query retries can handle it.
  // Only block for truly-offline scenarios where the device has been offline for a while.

  const token = getTokenSync();
  if (token) {
    // Proactively clear expired tokens rather than sending them
    if (isTokenExpired(token)) {
      setTokenCache(null);
      removeItem("token");
      // Notify listeners so auth gate can open, but don't cancel the request —
      // let it proceed without auth. Protected endpoints will return 401 which
      // is handled gracefully by the response interceptor.
      unauthorizedListeners.forEach((fn) => fn());
      return config;
    }
    // Proactively refresh if token is within 30-day expiry window
    if (shouldRefreshToken(token)) {
      silentRefresh();
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Prevent duplicate 401 handling across concurrent requests
let isHandling401 = false;

// Response interceptor — unwrap data / handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error?.response?.status;
    const originalConfig = error?.config;

    // ── Retry on network errors (mobile data / 5G transitions) ──
    // No response at all = DNS failure, timeout, or connection reset
    if (
      !error.response &&
      originalConfig &&
      !originalConfig._retryNetwork &&
      (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED")
    ) {
      originalConfig._retryNetwork = true;
      // Wait a bit for network to stabilise (DNS, new IP route)
      await new Promise((r) => setTimeout(r, 1500));
      return apiClient(originalConfig);
    }

    // ── Retry on 5xx (transient server errors) ────────────────────
    // Retry once for server errors (e.g. connection pool exhaustion returning 500)
    if (status && status >= 500 && originalConfig && !originalConfig._retry5xx) {
      originalConfig._retry5xx = true;
      // Brief delay before retry
      await new Promise((r) => setTimeout(r, 500));
      return apiClient(originalConfig);
    }

    // Detect paused account response
    if (
      status === 403 &&
      error?.response?.data?.code === "ACCOUNT_PAUSED"
    ) {
      pausedListeners.forEach((fn) => fn());
    }
    // 401 — attempt silent refresh before giving up
    else if (status === 401 && originalConfig && !originalConfig._retry401) {
      originalConfig._retry401 = true;
      const hadToken = !!originalConfig.headers?.Authorization;

      if (hadToken) {
        // Try to refresh the token first
        const newToken = await silentRefresh();
        if (newToken) {
          // Retry the original request with the new token
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalConfig);
        }
      }

      // Refresh failed or no token — clear and open auth gate
      if (typeof window !== "undefined") {
        setTokenCache(null);
        removeItem("token");
      }
      if (hadToken && !isHandling401) {
        isHandling401 = true;
        unauthorizedListeners.forEach((fn) => fn());
        setTimeout(() => { isHandling401 = false; }, 2000);
      }
    }
    // Generic 403 (not paused) — open auth gate
    else if (status === 403 && error?.response?.data?.code !== "ACCOUNT_PAUSED") {
      const hadToken = !!originalConfig?.headers?.Authorization;
      if (hadToken && !isHandling401) {
        isHandling401 = true;
        unauthorizedListeners.forEach((fn) => fn());
        setTimeout(() => { isHandling401 = false; }, 2000);
      }
    }

    // Detect inappropriate language error (400 from ContentSanitizerService)
    if (status === 400) {
      const msg: string = error?.response?.data?.message ?? "";
      if (typeof msg === "string" && msg.toLowerCase().includes("inappropriate language")) {
        inappropriateContentListeners.forEach((fn) => fn(msg));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
