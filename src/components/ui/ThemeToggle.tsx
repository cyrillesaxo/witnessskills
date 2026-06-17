import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Sun/Moon toggle button inspired by balafons Navbar ThemeToggle.
 * Sits in the AppShell nav bar. Reads theme from ThemeContext.
 */
export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

  return (
        <button
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className={
                          'p-2 rounded-lg transition-all duration-200 ' +
                          (isDark
                                     ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800'
                                     : 'text-slate-600 hover:text-amber-500 hover:bg-slate-100')
                }
              >
          {isDark ? (
                        <Sun className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Moon className="w-4 h-4" aria-hidden="true" />
                      )}
        </button>
      );
}</button>
