import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

type ThemeMode = 'light' | 'dark';
type ThemeContextValue = { theme: ThemeMode; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const ALWAYS_LIGHT_PATHS = new Set([
  '/',
  '/login',
  '/onboarding',
  '/onboarding/profile',
  '/forgot-password',
  '/reset-password',
]);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem('sophia-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Dark appearance is an account-page preference, never a public/onboarding experience.
  // Keep the saved preference when visiting public pages so it can resume on signed-in pages.
  const canUseDarkTheme = isAuthenticated && !ALWAYS_LIGHT_PATHS.has(pathname);
  const appliedTheme: ThemeMode = canUseDarkTheme ? theme : 'light';

  useEffect(() => {
    document.documentElement.dataset.theme = appliedTheme;
    document.documentElement.style.colorScheme = appliedTheme;
    try { localStorage.setItem('sophia-theme', theme); } catch { /* preference remains active for this session */ }
  }, [appliedTheme, theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => current === 'light' ? 'dark' : 'light');
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme: appliedTheme, toggleTheme }), [appliedTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
