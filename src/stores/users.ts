import { defineStore } from "pinia";
import { UserService } from "../api/users";
import type { UserRecord, UserRequest, PatchedUserRequest } from "../types/auth";

interface UserState {
  users: UserRecord[];
  currentUser: UserRecord | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export const useUserStore = defineStore("users", {
  state: (): UserState => ({
    users: [],
    currentUser: null,
    isLoading: false,
    error: null,
    pagination: {
      count: 0,
      next: null,
      previous: null
    }
  }),

  actions: {
    async fetchUsers(page?: number) {
      try {
        this.isLoading = true;
        const data = await UserService.getUsers(page);
        this.users = data.results;
        this.pagination = {
          count: data.count,
          next: data.next,
          previous: data.previous
        };
      } catch (error) {
        this.error = "Failed to fetch users";
        console.error("Error fetching users:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUserById(id: number) {
      try {
        this.isLoading = true;
        this.currentUser = await UserService.getUserById(id);
      } catch (error) {
        this.error = "Failed to fetch user";
        console.error(`Error fetching user ${id}:`, error);
      } finally {
        this.isLoading = false;
      }
    },

    async createUser(userData: UserRequest) {
      try {
        this.isLoading = true;
        const newUser = await UserService.createUser(userData);
        this.users.unshift(newUser);
        return newUser;
      } catch (error) {
        this.error = "Failed to create user";
        console.error("Error creating user:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateUser(id: number, userData: UserRequest) {
      try {
        this.isLoading = true;
        const updatedUser = await UserService.updateUser(id, userData);
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
          this.users.splice(index, 1, updatedUser);
        }
        if (this.currentUser?.id === id) {
          this.currentUser = updatedUser;
        }
        return updatedUser;
      } catch (error) {
        this.error = "Failed to update user";
        console.error(`Error updating user ${id}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async partialUpdateUser(id: number, userData: PatchedUserRequest) {
      try {
        this.isLoading = true;
        const updatedUser = await UserService.partialUpdateUser(id, userData);
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
          this.users.splice(index, 1, updatedUser);
        }
        if (this.currentUser?.id === id) {
          this.currentUser = updatedUser;
        }
        return updatedUser;
      } catch (error) {
        this.error = "Failed to partially update user";
        console.error(`Error partially updating user ${id}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteUser(id: number) {
      try {
        this.isLoading = true;
        await UserService.deleteUser(id);
        this.users = this.users.filter(u => u.id !== id);
        if (this.currentUser?.id === id) {
          this.currentUser = null;
        }
      } catch (error) {
        this.error = "Failed to delete user";
        console.error(`Error deleting user ${id}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async searchUsers(params: {
      search?: string;
      is_admin?: boolean;
      page?: number;
    }) {
      try {
        this.isLoading = true;
        const data = await UserService.searchUsers(params);
        this.users = data.results;
        this.pagination = {
          count: data.count,
          next: data.next,
          previous: data.previous
        };
      } catch (error) {
        this.error = "Failed to search users";
        console.error("Error searching users:", error);
      } finally {
        this.isLoading = false;
      }
    },

    clearCurrentUser() {
      this.currentUser = null;
    },

    clearError() {
      this.error = null;
    }
  },

  getters: {
    adminUsers(state): UserRecord[] {
      return state.users.filter(user => user.is_admin);
    },
    regularUsers(state): UserRecord[] {
      return state.users.filter(user => !user.is_admin);
    },
    getUserById: (state) => (id: number) => {
      return state.users.find(user => user.id === id) || null;
    },
    hasNextPage(state): boolean {
      return !!state.pagination.next;
    },
    hasPreviousPage(state): boolean {
      return !!state.pagination.previous;
    },
    totalUsers(state): number {
      return state.pagination.count;
    }
  }
});