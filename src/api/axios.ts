import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
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
    const status = error.response?.status;

    if (status === 401) {
      const authStore = useAuthStore();
      const router = useRouter();

      authStore.logout();

      router?.push({
        path: "/login",
        query: { redirect: router.currentRoute.value.fullPath },
      });
    }

    return Promise.reject(error);
  }
);

export default api;
