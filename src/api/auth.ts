import { AuthResponse } from "../types/auth";
import api from "./axios";

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export const AuthService = {
  async login(data: LoginData) {
    const response = await api.post("/auth/login/", data);
    return response.data;
  },
  async register(data: RegisterData) {
    const response = await api.post("/auth/register/", data);
    return response.data;
  },
  async refreshToken(data: { refresh: string }): Promise<AuthResponse> {
    const response = await api.post("/auth/token/refresh/", data);
    return response.data;
  },
};