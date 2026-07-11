import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signalRService } from '../services/signalrService';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
        signalRService.startConnection();
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        signalRService.stopConnection();
      },
    }),
    {
      name: 'auth-storage-v2', // bumped version to clear stale cache
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
