import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'ws-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
          try {
                  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
                  if (stored === 'light' || stored === 'dark') return stored;
                  // Default to dark (preserve current look for existing users)
            return 'dark';
          } catch {
                  return 'dark';
          }
    });

  useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
                root.classList.add('dark');
        } else {
                root.classList.remove('dark');
        }
        try {
                localStorage.setItem(STORAGE_KEY, theme);
        } catch { /* noop */ }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
    const toggleTheme = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
          {children}
        </ThemeContext.Provider>
      );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
