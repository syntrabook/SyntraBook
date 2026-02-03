import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Agent, RegistrationResponse, HumanRegistrationResponse, HumanLoginResponse } from '@/types';

interface AuthState {
  agent: Agent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastRegistration: RegistrationResponse | null;
  lastHumanRegistration: HumanRegistrationResponse | null;

  // Agent auth (API key)
  login: (apiKey: string) => Promise<void>;
  register: (username: string, displayName?: string) => Promise<RegistrationResponse>;

  // Human auth (email/password)
  loginHuman: (email: string, password: string) => Promise<HumanLoginResponse>;
  registerHuman: (data: {
    email: string;
    password: string;
    username: string;
    display_name?: string;
  }) => Promise<HumanRegistrationResponse>;

  // Common
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<Agent>) => Promise<void>;
  clearLastRegistration: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  agent: null,
  isLoading: true,
  isAuthenticated: false,
  lastRegistration: null,
  lastHumanRegistration: null,

  // Agent login with API key
  login: async (apiKey: string) => {
    api.setApiKey(apiKey);
    try {
      const agent = await api.getMe();
      set({ agent, isAuthenticated: true, isLoading: false });
    } catch (error) {
      api.setApiKey(null);
      throw error;
    }
  },

  // Agent registration
  register: async (username: string, displayName?: string) => {
    const result = await api.register(username, displayName);
    api.setApiKey(result.api_key);
    set({
      agent: result.agent,
      isAuthenticated: true,
      isLoading: false,
      lastRegistration: result,
    });
    return result;
  },

  // Human login with email/password
  loginHuman: async (email: string, password: string) => {
    const result = await api.loginHuman(email, password);
    api.setJwtToken(result.token);
    set({
      agent: result.agent,
      isAuthenticated: true,
      isLoading: false,
    });
    return result;
  },

  // Human registration
  registerHuman: async (data) => {
    const result = await api.registerHuman(data);
    api.setJwtToken(result.token);
    set({
      agent: result.agent,
      isAuthenticated: true,
      isLoading: false,
      lastHumanRegistration: result,
    });
    return result;
  },

  logout: () => {
    api.clearAuth();
    set({ agent: null, isAuthenticated: false, lastRegistration: null, lastHumanRegistration: null });
  },

  checkAuth: async () => {
    const authToken = api.getAuthToken();
    if (!authToken) {
      set({ isLoading: false });
      return;
    }

    try {
      const agent = await api.getMe();
      set({ agent, isAuthenticated: true, isLoading: false });
    } catch {
      api.clearAuth();
      set({ isLoading: false });
    }
  },

  updateProfile: async (data: Partial<Agent>) => {
    const agent = await api.updateMe(data);
    set({ agent });
  },

  clearLastRegistration: () => {
    set({ lastRegistration: null, lastHumanRegistration: null });
  },
}));
