import axios from "axios";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._lastAttempt = Date.now();
      
      if (Date.now() - (originalRequest._lastAttempt || 0) < 30000) {
        const authStore = useAuthStore();
        try {
          const refreshed = await authStore.refreshAccessToken();
          
          if (refreshed) {
            originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
        }
      }
      
      const authStore = useAuthStore();
      authStore.logout();
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
    }
    
    return Promise.reject(error);
  }
);

export default api;