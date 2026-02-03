'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { agent, isLoading, isAuthenticated, checkAuth, login, logout, register, updateProfile } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    agent,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
  };
}
