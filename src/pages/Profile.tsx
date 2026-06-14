import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, LogOut, ArrowLeft, Zap, ChevronRight } from 'lucide-react';

function BackgroundGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl" />
    </div>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const displayName = user.email?.split('@')[0] ?? 'User';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      <BackgroundGlow />
      <div className="relative z-10 bg-grid-pattern min-h-screen">
        <nav className="border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/40 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors">
                  <ArrowLeft className="w-4 h-4" /><span className="text-sm">Dashboard</span>
                </Link>
                <span className="text-slate-700">/</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-white">Profile</span>
                </div>
              </div>
              <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" /><span>Sign out</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          {/* Profile Hero */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-emerald-500/20 shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{displayName}</h1>
                <p className="text-emerald-400 text-sm font-medium">Skills Portfolio Member</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-400">Active account</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account Details</h2>
            <div className="space-y-4">
              {[
                { icon: Mail, label: 'Email address', value: user.email || '—' },
                { icon: User, label: 'Account ID', value: user.id.substring(0, 18) + '...' },
                { icon: Calendar, label: 'Member since', value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3 border-b border-slate-700/40 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                    <div className="text-sm text-white font-medium truncate">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Security</h2>
            <div className="flex items-center gap-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">Account protection</div>
                <div className="text-xs text-slate-400 mt-0.5">Your account is secured with Supabase Auth</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Navigation</h2>
            <Link to="/skills" className="flex items-center justify-between py-3 group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">My Skills Portfolio</div>
                  <div className="text-xs text-slate-500">View and manage your documented skills</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </Link>
          </div>

          {/* Sign Out */}
          <div className="backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Session</h2>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Sign out</div>
                <div className="text-xs text-slate-500">End your current session</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
