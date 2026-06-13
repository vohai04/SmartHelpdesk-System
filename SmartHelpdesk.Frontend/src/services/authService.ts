import { axiosClient } from '../api/axiosClient';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

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
  
  register: async (data: RegisterRequest): Promise<void> => {
    return axiosClient.post('/auth/register', data);
  },
  
  logout: async (): Promise<void> => {
    try {
      // Optional: Call backend to invalidate token if your API supports it
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout (e.g., token already expired)
      console.error("Logout API failed", error);
    }
  }
};
