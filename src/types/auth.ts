export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
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

export interface RefreshTokenResponse {
  access: string;
}