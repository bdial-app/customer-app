import axios from "axios";

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

// Request interceptor — attach token if present
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — unwrap data / handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
    // Guest users (no token) get 401s naturally — don't popup the auth gate for those.
    else if (status === 401 || (status === 403 && error?.response?.data?.code !== "ACCOUNT_PAUSED")) {
      const hadToken = !!error?.config?.headers?.Authorization;
      // Clear stale token on 401
      if (status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      // Only trigger auth gate if the request had a token (stale session)
      if (hadToken) {
        unauthorizedListeners.forEach((fn) => fn());
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
