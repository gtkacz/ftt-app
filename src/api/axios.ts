import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  headers: { "Content-Type": "application/json", "bypass-tunnel-reminder": true },
  timeout: 10000,
});

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    cfg.headers = cfg.headers || {};
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
    failedRequest.response!.config.headers![
      "Authorization"
    ] = `Bearer ${auth.accessToken}`;
    return Promise.resolve();
  },
  {
    // only attempt once per request
    statusCodes: [401],
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const authStore = useAuthStore();

    if (status !== 401 || (error.config as any)?._retry) {
      return Promise.reject(error);
    }

    if (authStore.isAuthenticated) {
      authStore.logout();
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
      }, 0);
    }

    return Promise.reject(error);
  }
);

export default api;
