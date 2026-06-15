import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Award, FileText, Briefcase, TrendingUp, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import BackgroundGlow from '../components/ui/BackgroundGlow';
import ErrorBoundary from '../components/ui/ErrorBoundary';

interface DashboardStats {
  skillsTracked: number;
  evidenceAdded: number;
  rctConverged: number;
  applicationsent: number;
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    skillsTracked: 0,
    evidenceAdded: 0,
    rctConverged: 0,
    applicationsent: 0,
  });
  const [recentSkills, setRecentSkills] = useState<Array<{id: string; name: string; level: string; domain?: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const [skillsRes, appsRes] = await Promise.all([
        supabase
          .from('skills')
          .select('id, name, level, domain, evidence, rct_cleared_at')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('job_applications')
          .select('id')
          .eq('user_id', user!.id),
      ]);

      if (skillsRes.error) throw new Error(skillsRes.error.message);

      const skills = skillsRes.data || [];
      const apps = appsRes.data || [];

      const converged = skills.filter(s => s.rct_cleared_at).length;
      const withEvidence = skills.filter(s => s.evidence && s.evidence.length > 0).length;

      setStats({
        skillsTracked: skills.length,
        evidenceAdded: withEvidence,
        rctConverged: converged,
        applicationsent: apps.length,
      });
      setRecentSkills(skills.slice(0, 5));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const LEVEL_COLORS: Record<string, string> = {
    beginner: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
    intermediate: 'text-teal-400 bg-teal-500/10 border border-teal-500/20',
    advanced: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
    expert: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
  };

  const quickCards = [
    {
      label: 'Skills Tracked',
      value: stats.skillsTracked,
      icon: Brain,
      color: 'emerald',
      href: '/skills',
      desc: 'In your portfolio',
    },
    {
      label: 'Evidence Added',
      value: stats.evidenceAdded,
      icon: Award,
      color: 'teal',
      href: '/skills',
      desc: 'Skills with evidence',
    },
    {
      label: 'RCT Converged',
      value: stats.rctConverged,
      icon: TrendingUp,
      color: 'purple',
      href: '/learn',
      desc: 'Training complete',
    },
    {
      label: 'Applications',
      value: stats.applicationsent,
      icon: Briefcase,
      color: 'amber',
      href: '/apply',
      desc: 'Sent via ApplyAI',
    },
  ];

  return (
    <AppShell>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
          <BackgroundGlow />
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back{user?.email ? ', ' + user.email.split('@')[0] : ''}
                </h1>
                <p className="text-slate-400 mt-1">
                  Your skills intelligence dashboard
                </p>
              </div>
              <Link
                to="/skills"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </Link>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.label}
                    to={card.href}
                    className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/70 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={'w-10 h-10 rounded-lg flex items-center justify-center bg-' + card.color + '-500/10 border border-' + card.color + '-500/20'}>
                        <Icon className={'w-5 h-5 text-' + card.color + '-400'} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                    {loading ? (
                      <div className="h-8 bg-slate-800 rounded animate-pulse w-16 mb-1" />
                    ) : (
                      <p className="text-3xl font-bold text-white">{card.value}</p>
                    )}
                    <p className="text-sm font-medium text-slate-300 mt-1">{card.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{card.desc}</p>
                  </Link>
                );
              })}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent Skills */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-400" />
                    Recent Skills
                  </h2>
                  <Link to="/skills" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    View all
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : recentSkills.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No skills yet</p>
                    <Link to="/skills" className="inline-flex items-center gap-1 mt-3 text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                      <Plus className="w-3 h-3" /> Add your first skill
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentSkills.map(skill => (
                      <Link
                        key={skill.id}
                        to={'/learn?node=' + encodeURIComponent(skill.name)}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">{skill.name}</p>
                          {skill.domain && <p className="text-xs text-slate-500">{skill.domain}</p>}
                        </div>
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (LEVEL_COLORS[skill.level] || 'text-slate-400')}>
                          {skill.level}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ApplyAI Card */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-amber-400" />
                    ApplyAI
                  </h2>
                  <Link to="/apply" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    Open
                  </Link>
                </div>
                <p className="text-sm text-slate-400 mb-5">
                  Generate résumés from your portfolio, analyze JD skill gaps, and track your job campaign — all connected to your training data.
                </p>
                <div className="space-y-2">
                  <Link
                    to="/apply"
                    className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors group"
                  >
                    <Briefcase className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Campaign Dashboard</p>
                      <p className="text-xs text-slate-500">Track applications and outcomes</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </Link>
                  <Link
                    to="/apply/resume"
                    className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Resume Builder</p>
                      <p className="text-xs text-slate-500">Generate from portfolio skills</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </Link>
                  <Link
                    to="/apply/gaps"
                    className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-colors group"
                  >
                    <TrendingUp className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Gap Analyzer</p>
                      <p className="text-xs text-slate-500">Find missing skills in any JD</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </ErrorBoundary>
    </AppShell>
  );
}
