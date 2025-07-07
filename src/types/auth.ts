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

export interface AuthResponse {
  access: string;
  refresh?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

export interface RefreshTokenResponse {
  access: string;
}