import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// attach token on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("access_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// handle 401 + refresh + retry
createAuthRefreshInterceptor(api, async (failedRequest) => {
  const auth = useAuthStore();
  await auth.refreshAccessToken();
  failedRequest.response.config.headers.Authorization =
    `Bearer ${auth.accessToken}`;
  return Promise.resolve();
}, {
  // only attempt once per request
  statusCodes: [401]
});

// optional: global logout-on-failed-refresh
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config._retry) {
      useAuthStore().logout();
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
    }
    return Promise.reject(err);
  }
);

export default api;