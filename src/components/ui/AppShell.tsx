import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, LogOut, Menu, X, Home, BookOpen, BookMarked, Star, User, Briefcase, Shield } from 'lucide-react';
import BackgroundGlow from './BackgroundGlow';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/reader', label: 'Reader', icon: BookMarked },
  { to: '/skills', label: 'Skills', icon: Star },
  { to: '/apply', label: 'Apply', icon: Briefcase },
  { to: '/verify', label: 'Verify', icon: Shield },
  { to: '/profile', label: 'Profile', icon: User },
] as const;

interface AppShellProps {
  children: React.ReactNode;
  trail?: { label: string; href?: string }[];
  subNav?: React.ReactNode;
  actions?: React.ReactNode;
  onSignOut?: () => void;
}

export default function AppShell({ children, trail, subNav, actions, onSignOut }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();
    }, 50);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut?.();
  }

  const navBg   = isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-white/90 border-slate-200/80';
  const logoText = isDark ? 'text-white' : 'text-slate-900';
  const linkBase = isDark
    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
  const linkActive = isDark
    ? 'text-emerald-400 bg-emerald-500/10'
    : 'text-emerald-600 bg-emerald-50';
  const mobileMenuBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const mobileLinkBase = isDark
    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100';
  const mobileLinkActive = isDark
    ? 'text-emerald-400 bg-emerald-500/10'
    : 'text-emerald-600 bg-emerald-50';
  const signOutBtn = isDark
    ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
    : 'text-slate-500 hover:text-red-600 hover:bg-red-50';
  const rootBg = isDark
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';

  return (
    <div className={`min-h-screen ${rootBg} relative overflow-x-hidden`}>
      {isDark && <BackgroundGlow />}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to content
      </a>

      <div className="relative z-10 bg-grid-pattern min-h-screen">
        <nav
          className={`border-b ${navBg} backdrop-blur-xl sticky top-0 z-50 transition-colors duration-200`}
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link to="/" aria-label="WitnessSkills home" className="flex items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className={`font-bold text-sm hidden sm:block ${logoText}`}>WitnessSkills</span>
            </Link>

            {trail && trail.length > 0 && (
              <nav aria-label="Breadcrumb" className={`hidden sm:flex items-center gap-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span aria-hidden="true">/</span>
                {trail.map((t, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {t.href ? (
                      <Link to={t.href} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t.label}</Link>
                    ) : (
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.label}</span>
                    )}
                    {i < trail.length - 1 && <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>}
                  </span>
                ))}
              </nav>
            )}

            {subNav && <div className="hidden md:flex">{subNav}</div>}

            <div className="hidden md:flex items-center gap-1 ml-auto" role="menubar">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? linkActive : linkBase}`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              {actions && <div className="ml-1">{actions}</div>}
              <ThemeToggle />
              {user && (
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className={`p-2 rounded-lg transition-colors ${signOutBtn}`}
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex md:hidden items-center gap-2 ml-auto">
              <ThemeToggle />
              <button
                ref={menuBtnRef}
                onClick={() => setMenuOpen(v => !v)}
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {menuOpen && (
          <div
            ref={menuRef}
            className={`md:hidden fixed inset-x-0 top-14 z-40 border-b ${mobileMenuBg} shadow-lg`}
            role="menu"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? mobileLinkActive : mobileLinkBase}`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              {user && (
                <button
                  onClick={handleSignOut}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mt-1 transition-colors ${signOutBtn}`}
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign out
                </button>
              )}
            </div>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 pt-6 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
