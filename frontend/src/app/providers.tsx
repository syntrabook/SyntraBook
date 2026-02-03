'use client';

import { useEffect } from 'react';
import { SWRConfig } from 'swr';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    // Initialize auth
    checkAuth();

    // Sync Zustand store with the theme already applied by the blocking script
    // This doesn't cause a flash because the DOM is already correct
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, [checkAuth, setTheme]);

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
