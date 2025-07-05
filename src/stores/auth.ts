import { defineStore } from "pinia";
import { AuthService } from "../api/auth";
import type { LoginData, RegisterData, AuthResponse } from "../types/auth";

interface AuthState {
  user: null | { id: number; username: string; email: string };
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    isLoading: false,
  }),

  actions: {
    async login(data: LoginData): Promise<boolean> {
      try {
        this.isLoading = true;
        const response = await AuthService.login(data);
        this.setTokens(response.access, response.refresh);
        if (response.user) {
          this.user = response.user;
        }
        return true;
      } catch (error) {
        console.error("Login failed:", error);
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
        console.error("Registration failed:", error);
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
    },

    async refreshAccessToken(): Promise<boolean> {
      try {
        if (!this.refreshToken) throw new Error("No refresh token available");
        const response = await AuthService.refreshToken({ refresh: this.refreshToken });
        this.setTokens(response.access, response.refresh);
        return true;
      } catch (error) {
        this.logout();
        console.error("Token refresh failed:", error);
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
      return !!this.accessToken;
    },
  },
});