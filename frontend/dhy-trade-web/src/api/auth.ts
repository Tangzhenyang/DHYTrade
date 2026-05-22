import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  inviteCode: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data);

export const register = (data: RegisterRequest) =>
  client.post<UserDto>('/auth/register', data);
