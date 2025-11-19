import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.ts";
import { useRouter } from "vue-router";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  headers: {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": true,
  },
  timeout: 100000,
});

// Auth endpoints that should not trigger token refresh
const AUTH_ENDPOINTS = ["/auth/login/", "/auth/register/", "/auth/refresh/"];

// Check if a URL is an auth endpoint
function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Handle 401 Unauthorized errors
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Don't attempt refresh for auth endpoints
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      const authStore = useAuthStore();
      const router = useRouter();

      // Check if we have a refresh token
      if (!authStore.refreshToken) {
        authStore.logout();
        router?.push({
          path: "/login",
          query: { redirect: router.currentRoute.value.fullPath },
        });
        return Promise.reject(error);
      }

      // Attempt to refresh the token (store handles race conditions internally)
      try {
        const refreshSuccess = await authStore.refreshAccessToken();

        if (refreshSuccess) {
          // Update the authorization header with the new token
          const newToken = localStorage.getItem("access_token");
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          // Mark request as retried to prevent infinite loops
          originalRequest._retry = true;

          // Retry the original request with the new token
          return api(originalRequest);
        } else {
          // Refresh failed, logout user (already handled in store)
          router?.push({
            path: "/login",
            query: { redirect: router.currentRoute.value.fullPath },
          });
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, logout user (already handled in store)
        router?.push({
          path: "/login",
          query: { redirect: router.currentRoute.value.fullPath },
        });
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
