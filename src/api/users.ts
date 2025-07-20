import api from "./axios";
import type { UserRequest, PatchedUserRequest } from "@/types/auth.ts";

export const UserService = {
  async getUsers(page?: number) {
    const params = page ? { page } : {};
    const response = await api.get("/api/users/", { params });
    return response.data;
  },

  async getUserById(id: number) {
    const response = await api.get(`/api/users/${id}/`);
    return response.data;
  },

  async createUser(data: UserRequest) {
    const response = await api.post("/api/users/", data);
    return response.data;
  },

  async updateUser(id: number, data: UserRequest) {
    const response = await api.put(`/api/users/${id}/`, data);
    return response.data;
  },

  async partialUpdateUser(id: number, data: PatchedUserRequest) {
    const response = await api.patch(`/api/users/${id}/`, data);
    return response.data;
  },

  async deleteUser(id: number) {
    await api.delete(`/api/users/${id}/`);
  },

  async searchUsers(params: {
    search?: string;
    is_admin?: boolean;
    page?: number;
  }) {
    const response = await api.get("/api/users/", { params });
    return response.data;
  },
};
