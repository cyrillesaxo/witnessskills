import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, LogOut, Menu, X, Home, BookOpen, Star, User, Briefcase } from 'lucide-react';
import BackgroundGlow from './BackgroundGlow';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../lib/supabase';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/skills', label: 'Skills', icon: Star },
  { to: '/apply', label: 'Apply', icon: Briefcase },
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
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Keyboard: Escape closes menu, focus trap inside mobile menu
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
    // Focus first nav link when menu opens
    setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();
    }, 50);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut?.();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      <BackgroundGlow />
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to content
      </a>

      <div className="relative z-10 bg-grid-pattern min-h-screen">
        {/* Top nav */}
        <nav
          className="border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/40 sticky top-0 z-50"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
            {/* Logo */}
            <Link to="/" aria-label="WitnessSkills home" className="flex items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-white text-sm hidden sm:block">WitnessSkills</span>
            </Link>

            {/* Breadcrumb trail */}
            {trail && trail.length > 0 && (
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-sm text-slate-500">
                <span aria-hidden="true">/</span>
                {trail.map((t, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {t.href ? (
                      <Link to={t.href} className="text-slate-400 hover:text-white transition-colors">{t.label}</Link>
                    ) : (
                      <span className="text-slate-300">{t.label}</span>
                    )}
                    {i < trail.length - 1 && <span aria-hidden="true" className="text-slate-600">/</span>}
                  </span>
                ))}
              </nav>
            )}

            {/* Sub nav (e.g. Learn tabs) */}
            {subNav && <div className="hidden md:flex">{subNav}</div>}

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 ml-auto" role="menubar">
              {NAV_LINKS.map(({ to, label }) => {
                const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={'px-3 py-1.5 rounded-lg text-sm transition-colors ' + (isActive
                      ? 'text-white bg-slate-800/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50')}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Actions slot (e.g. export, add buttons) */}
            {actions && <div className="hidden sm:flex items-center gap-2 ml-2">{actions}</div>}

            {/* Desktop sign out */}
            {user && (
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="hidden md:flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm ml-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden lg:block">Sign out</span>
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              ref={menuBtnRef}
              onClick={() => setMenuOpen(o => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden ml-auto p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>

          {/* Mobile menu — slide-in */}
          {menuOpen && (
            <div
              id="mobile-menu"
              ref={menuRef}
              role="menu"
              aria-label="Navigation menu"
              className="md:hidden border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-xl"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                  return (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                      className={'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ' + (isActive
                        ? 'text-white bg-slate-800/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50')}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {label}
                    </Link>
                  );
                })}
                {user && (
                  <button
                    onClick={handleSignOut}
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign out
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Page content */}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
