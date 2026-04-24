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
    // Detect paused account response
    if (
      error?.response?.status === 403 &&
      error?.response?.data?.code === "ACCOUNT_PAUSED"
    ) {
      pausedListeners.forEach((fn) => fn());
    }
    return Promise.reject(error);
  }
);

export default apiClient;
