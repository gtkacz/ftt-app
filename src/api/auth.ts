import { AuthResponse } from "../types/auth";
import api from "./axios";
import { LoginData, RegisterData, RegisterTeamData } from "../types/auth";

export const AuthService = {
  async login(data: LoginData) {
    const response = await api.post("/auth/login/", data);
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