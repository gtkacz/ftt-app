import axios, { AxiosError, AxiosRequestConfig } from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// attach token on every request
api.interceptors.request.use((cfg: AxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// handle 401 + refresh + retry
createAuthRefreshInterceptor(
  api,
  async (failedRequest) => {
    const auth = useAuthStore();
    await auth.refreshAccessToken();
    failedRequest.response!.config.headers!['Authorization'] =
      `Bearer ${auth.accessToken}`;
    return Promise.resolve();
  },
  {
    // only attempt once per request
    statusCodes: [401],
  }
);

// global response interceptor
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // On 401 without retry, logout and redirect
    if (status === 401 && !(error.config as any)?._retry) {
      useAuthStore().logout();
      window.location.href =
        "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return Promise.reject(error);
    }

    // Rethrow all HTTP errors in 400 and 500 range
    if (status && status >= 400 && status < 600) {
      // You can customize error message or wrap error here
      return Promise.reject(error);
    }

    // Non-HTTP or unknown errors
    return Promise.reject(error);
  }
);

export default api;
