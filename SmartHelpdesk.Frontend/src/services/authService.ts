import { axiosClient } from '../api/axiosClient';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  token?: string;
  Token?: string;
  userId?: string;
  UserId?: string;
  fullName?: string;
  FullName?: string;
  email?: string;
  Email?: string;
  role?: string;
  Role?: string;
}

export type RegisterResponse = LoginResponse;

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return axiosClient.post('/auth/login', data) as Promise<LoginResponse>;
  },
  
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return axiosClient.post('/auth/register', data) as Promise<RegisterResponse>;
  },
  
  logout: async (): Promise<void> => {
    // JWT is stateless. We only need to clear the token on the frontend.
    // No backend call is required unless token blacklisting is implemented.
    return Promise.resolve();
  }
};
