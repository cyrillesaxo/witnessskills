import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, LogOut, Menu, X } from 'lucide-react';
import BackgroundGlow from './BackgroundGlow';

const NAV_LINKS = [
  { to: '/learn', label: 'Learn' },
  { to: '/skills', label: 'Skills' },
  { to: '/profile', label: 'Profile' },
] as const;

interface AppShellProps {
  children: React.ReactNode;
  trail?: { label: string; href?: string }[];
  /** Rendered between trail and right nav — e.g. Learn tab switcher */
  subNav?: React.ReactNode;
  actions?: React.ReactNode;
  onSignOut?: () => void;
}

export default function AppShell({ children, trail, subNav, actions, onSignOut }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      <BackgroundGlow />
      <div className="relative z-10 bg-grid-pattern min-h-screen">
        <nav className="border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/40 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {trail ? (
                  <>
                    {trail.map((item, i) => (
                      <span key={i} className="flex items-center gap-3 shrink-0">
                        {i > 0 && <span className="text-slate-700 hidden sm:inline">/</span>}
                        {item.href ? (
                          <Link to={item.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                            {item.label}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                              <Zap className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-semibold text-white text-sm">{item.label}</span>
                          </div>
                        )}
                      </span>
                    ))}
                  </>
                ) : (
                  <Link to="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">WitnessSkills</span>
                  </Link>
                )}
              </div>

              {subNav && <div className="hidden md:flex flex-1 justify-center min-w-0">{subNav}</div>}

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-4">
                  {NAV_LINKS.map(({ to, label }) => (
                    <Link key={to} to={to}
                      className={`text-sm font-medium transition-colors ${location.pathname.startsWith(to) ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}>
                      {label}
                    </Link>
                  ))}
                </div>
                {actions}
                {onSignOut && (
                  <button onClick={onSignOut} className="hidden sm:flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                )}
                <button onClick={() => setMenuOpen(o => !o)} className="sm:hidden text-slate-400 hover:text-white p-1" aria-label="Menu">
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {subNav && (
              <div className="md:hidden border-t border-slate-800/60 py-2 px-1 flex justify-center">
                {subNav}
              </div>
            )}

            {menuOpen && (
              <div className="sm:hidden border-t border-slate-800/60 py-3 space-y-1">
                {NAV_LINKS.map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                    className={`block px-2 py-2.5 rounded-lg text-sm font-medium ${location.pathname.startsWith(to) ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300 hover:bg-slate-800/40'}`}>
                    {label}
                  </Link>
                ))}
                {onSignOut && (
                  <button onClick={() => { setMenuOpen(false); onSignOut(); }}
                    className="w-full text-left px-2 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10">
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}
