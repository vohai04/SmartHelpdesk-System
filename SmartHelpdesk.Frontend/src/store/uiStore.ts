import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

// Default: open on desktop (md+), closed on mobile
const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: isDesktop,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
