import axios from "axios";
import { getTokenSync, removeItem, setTokenCache } from "@/utils/storage";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
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
async function silentRefresh(): Promise<void> {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    const { data } = await axios.post(
      `${apiClient.defaults.baseURL}/api/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${getTokenSync()}` } },
    );
    if (data?.accessToken) {
      setTokenCache(data.accessToken);
      await import("@/utils/storage").then((m) => m.setItem("token", data.accessToken));
    }
  } catch {
    // Refresh failed — token may already be expired, let normal 401 flow handle
  } finally {
    isRefreshing = false;
  }
}

// Request interceptor — attach token if present, check expiry proactively
apiClient.interceptors.request.use((config) => {
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
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error?.response?.status;

    // Detect paused account response
    if (
      status === 403 &&
      error?.response?.data?.code === "ACCOUNT_PAUSED"
    ) {
      pausedListeners.forEach((fn) => fn());
    }
    // 401 or generic 403 (not paused) — trigger auth gate
    // Only fire for authenticated requests (where a token was present).
    else if (status === 401 || (status === 403 && error?.response?.data?.code !== "ACCOUNT_PAUSED")) {
      const hadToken = !!error?.config?.headers?.Authorization;
      // Clear stale token on 401
      if (status === 401 && typeof window !== "undefined") {
        setTokenCache(null);
        removeItem("token");
      }
      // Only trigger auth gate if the request had a token (stale session)
      // Deduplicate: only trigger once per batch of concurrent 401s
      if (hadToken && !isHandling401) {
        isHandling401 = true;
        unauthorizedListeners.forEach((fn) => fn());
        // Reset after a short delay to allow re-triggering if needed later
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
