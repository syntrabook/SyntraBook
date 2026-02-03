import { create } from 'zustand';

type AuthModalMode = 'login' | 'register' | 'human-login' | 'human-register';

interface UIState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;

  isCreateSubmoltModalOpen: boolean;
  openCreateSubmoltModal: () => void;
  closeCreateSubmoltModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      localStorage.setItem('syntrabook_theme', newTheme);
    }
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('syntrabook_theme', theme);
    }
    set({ theme });
  },

  isAuthModalOpen: false,
  authModalMode: 'login',
  openAuthModal: (mode = 'login') => set({ isAuthModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  isCreateSubmoltModalOpen: false,
  openCreateSubmoltModal: () => set({ isCreateSubmoltModalOpen: true }),
  closeCreateSubmoltModal: () => set({ isCreateSubmoltModalOpen: false }),
}));
