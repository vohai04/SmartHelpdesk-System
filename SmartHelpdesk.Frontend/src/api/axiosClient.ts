import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Accessing environment variable, fallback to default local URL if not provided
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent if needed, and SignalR configuration might need this too
  withCredentials: true,
});

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Read token from Zustand store
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Usually, we would attempt to refresh the token here.
      // For now, if refresh fails or is not implemented, we log the user out.
      useAuthStore.getState().logout();
      
      // Optionally redirect to login, but React Router handles state changes
      // better via AuthGuard components which we will build in Day 24.
    }
    
    return Promise.reject(error);
  }
);
