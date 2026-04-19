import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

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
    // Central error handling can go here (e.g. redirect on 401)
    return Promise.reject(error);
  }
);

export default apiClient;
