import { defineStore } from "pinia";
import { AuthService } from "../api/auth";
import type {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
} from "../types/auth";
import { decodeJwt } from "../utils/jwt";

import { showError } from "../services/errorSnackbar";

interface AuthState {
  user: null | User;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

export const useAuthStore = defineStore("auth", {
  persist: true,
  state: (): AuthState => ({
    user: localStorage.getItem("access_token") 
      ? (() => {
          try {
            const decoded = decodeJwt(localStorage.getItem("access_token")!);
            return decoded ? {
              id: decoded.user_id || 0,
              username: decoded.username || '',
              first_name: decoded.first_name || '',
              last_name: decoded.last_name || '',
              email: decoded.email || '',
              is_staff: decoded.is_staff || false,
            } : null;
          } catch {
            return null;
          }
        })()
      : null,
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    isLoading: false,
  }),

  actions: {
    async login(data: LoginData): Promise<boolean> {
      if (this.isLoading) return false;
      try {
        this.isLoading = true;
        const response = await AuthService.login(data);
        this.setTokens(response.access, response.refresh);

        const decoded = decodeJwt(response.access);
        if (!decoded) throw new Error("Invalid token");

        this.user = {
          id: decoded.user_id!,
          username: decoded.username!,
          first_name: decoded.first_name!,
          last_name: decoded.last_name!,
          email: decoded.email!,
          is_staff: decoded.is_staff!,
        };
        return true;
      } catch (error) {
        showError("Login failed:", error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async register(data: RegisterData): Promise<boolean> {
      try {
        this.isLoading = true;
        await AuthService.register(data);
        return true;
      } catch (error) {
        showError("Registration failed:", error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    setTokens(access: string, refresh?: string): void {
      this.accessToken = access;
      if (refresh) {
        this.refreshToken = refresh;
        localStorage.setItem("refresh_token", refresh);
      }
      localStorage.setItem("access_token", access);

      const decoded = decodeJwt(access);
      if (decoded) {
        this.user = {
        id: decoded.user_id!,
        username: decoded.username!,
        first_name: decoded.first_name!,
        last_name: decoded.last_name!,
        email: decoded.email!,
        is_staff: decoded.is_staff!,
        };
      }
    },

  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        this.logout();
        return false;
      }
    
      const response = await AuthService.refreshToken({
        refresh: this.refreshToken,
      });
      this.setTokens(response.access, response.refresh);
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  },

    logout(): void {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
  },

getters: {
  isAuthenticated(): boolean {
    if (!this.accessToken) return false;
    const decoded = decodeJwt(this.accessToken);
    return decoded?.exp ? decoded.exp > Date.now() / 1000 : false;
  },
  isStaff(): boolean {
    return this.user?.is_staff || false;
  },
},
});
