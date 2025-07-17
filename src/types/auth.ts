export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface RegisterTeamData {
  name: string;
  icon?: File | null;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface Team {
  id: number;
  name: string;
  avatar: string | null;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_approved: boolean;
  is_active: boolean;
  is_superuser: boolean;
  team: Team;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  date_joined: string;
}

export interface UserRequest {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
}

export interface PatchedUserRequest {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
}

export interface PaginatedUserList {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}