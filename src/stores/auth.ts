import { defineStore } from "pinia";
import { AuthService } from "../api/auth";
import type {
  LoginData,
  RegisterData,
  RegisterTeamData,
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
    user: localStorage.getItem("user") 
      ? JSON.parse(localStorage.getItem("user")!)
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
        
        this.setUser(response.user);
        
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

    async createTeam(data: RegisterTeamData): Promise<boolean> {
      try {
        this.isLoading = true;
        await AuthService.createTeam(data);
        await AuthService.fetchUser(this.user?.id!);
        this.setUser(this.user!);
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
      localStorage.setItem("access_token", access);
      
      if (refresh) {
        this.refreshToken = refresh;
        localStorage.setItem("refresh_token", refresh);
      }
    },

    setUser(userData: any): void {
      this.user = {
        id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        is_staff: userData.is_staff,
        is_approved: userData.is_approved,
        is_active: userData.is_active,
        is_superuser: userData.is_superuser,
        team: userData.team,
      };
      localStorage.setItem("user", JSON.stringify(this.user));
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
      localStorage.removeItem("user");
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
    isApproved(): boolean {
      return this.user?.is_approved || false;
    },
  },
});