import { AuthResponse } from "@/types/auth.ts";
import api from "./axios.ts";
import { LoginData, RegisterData, RegisterTeamData } from "@/types/auth.ts";
import { i18n } from "@/i18n";

export const AuthService = {
  async login(data: LoginData) {
    const response = await api.post("/auth/login/", data);
    if (!response.data.user.is_active) {
      throw new Error(i18n.global.t("authErrors.userNotActive"));
    }
    return response.data;
  },
  async loginWithGoogle(credential: string) {
    const response = await api.post("/auth/google/", { credential });
    if (!response.data.user.is_active) {
      throw new Error(i18n.global.t("authErrors.userNotActive"));
    }
    return response.data;
  },
  async register(data: RegisterData) {
    const response = await api.post("/auth/register/", data);
    return response.data;
  },
  async createTeam(data: RegisterTeamData) {
    const response = await api.post("/teams/", data);
    return response.data;
  },
  async fetchUser(id: Number) {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
  async refreshToken(data: { refresh: string }): Promise<AuthResponse> {
    const response = await api.post("/auth/refresh/", data);
    return response.data;
  },
};
