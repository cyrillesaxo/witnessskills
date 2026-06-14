import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Award, TrendingUp, Shield, Zap, ArrowRight, LogOut } from 'lucide-react';

function BackgroundGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl" />
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: '/skills', icon: BookOpen, title: 'My Skills', description: 'Manage and document your professional skills with evidence and proof of competency.', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', iconColor: 'text-emerald-400', badge: 'Core' },
  { href: '/profile', icon: User, title: 'Profile', description: 'View and update your personal information and account settings.', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', iconColor: 'text-cyan-400', badge: 'Account' },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;
  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      <BackgroundGlow />
      <div className="relative z-10 bg-grid-pattern min-h-screen">
        <nav className="border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/40 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">WitnessSkills</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/skills" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 font-medium">Skills</Link>
                <Link to="/profile" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200 font-medium">Profile</Link>
                <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors duration-200">
                  <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Skills Intelligence Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">Welcome back, <span className="text-gradient-emerald">{user.email?.split('@')[0] ?? 'there'}</span></h1>
          <p className="text-slate-400 text-lg max-w-2xl">Track, document, and evidence your professional skills.</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="grid grid-cols-3 gap-4">
            {[{icon: Award, label: 'Skills Tracked', color: 'text-emerald-400'},{icon: TrendingUp, label: 'Evidence Added', color: 'text-teal-400'},{icon: Shield, label: 'Verified Skills', color: 'text-cyan-400'}].map(({icon: Icon, label, color}) => (
              <div key={label} className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                <div className={`text-2xl font-bold ${color} mb-1`}>—</div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUICK_ACTIONS.map(({href, icon: Icon, title, description, gradient, border, iconColor, badge}) => (
              <Link key={href} to={href} className={`group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-800/60 flex items-center justify-center"><Icon className={`w-5 h-5 ${iconColor}`} /></div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700/40">{badge}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all duration-200">Go to {title} <ArrowRight className="w-4 h-4" /></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
