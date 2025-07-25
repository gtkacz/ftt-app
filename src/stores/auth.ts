import { defineStore } from "pinia";
import { AuthService } from "@/api/auth";
import type {
  LoginData,
  RegisterData,
  RegisterTeamData,
  User,
} from "@/types/auth";
import { decodeJwt } from "@/utils/jwt";

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
    // Helper method to ensure loading state is reset
    async withLoadingState<T>(action: () => Promise<T>): Promise<T | null> {
      if (this.isLoading) return null;

      try {
        this.isLoading = true;
        return await action();
      } finally {
        // This will ALWAYS run, even if there's an error
        this.isLoading = false;
      }
    },

    async login(data: LoginData): Promise<boolean> {
      const result = await this.withLoadingState(async () => {
        const response = await AuthService.login(data);
        this.setTokens(response.access, response.refresh);
        this.setUser(response.user);
        return true;
      });

      return result ?? false;
    },

    async register(data: RegisterData): Promise<boolean> {
      const result = await this.withLoadingState(async () => {
        await AuthService.register(data);
        return true;
      });

      return result ?? false;
    },

    async createTeam(data: RegisterTeamData): Promise<boolean> {
      const result = await this.withLoadingState(async () => {
        await AuthService.createTeam(data);
        // Fix: Properly use the response from fetchUser
        const updatedUser = await AuthService.fetchUser(this.user?.id!);
        this.setUser(updatedUser);
        return true;
      });

      return result ?? false;
    },

    async fetchUser(): Promise<void> {
      await this.withLoadingState(async () => {
        try {
          if (!this.user?.id) {
            throw new Error("No user ID available");
          }
          const response = await AuthService.fetchUser(this.user.id);
          this.setUser(response);
        } catch (error) {
          if (error instanceof Error && error.message.includes("401")) {
            this.logout();
          }
          throw error; // Re-throw to handle it in the calling context
        }
      });
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
      // Add validation to ensure userData exists
      if (!userData) {
        console.error("Attempted to set user with null/undefined data");
        return;
      }

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
      // Ensure loading state is reset on logout
      this.isLoading = false;
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    },

    // Emergency reset method if loading gets stuck
    resetLoadingState(): void {
      this.isLoading = false;
    },
  },

  getters: {
    isAuthenticated(): boolean {
      if (!this.accessToken) return false;
      try {
        const decoded = decodeJwt(this.accessToken);
        return decoded?.exp ? decoded.exp > Date.now() / 1000 : false;
      } catch {
        // If JWT decode fails, consider user not authenticated
        return false;
      }
    },
    isStaff(): boolean {
      return this.user?.is_staff || false;
    },
    isApproved(): boolean {
      return this.user?.is_approved || false;
    },
  },
});
