import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

type ThemeMode = 'light';

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    localStorage.setItem('sophia-theme', 'light');
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: 'light',
    toggleTheme: () => undefined,
  }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
