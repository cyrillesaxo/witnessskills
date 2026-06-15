import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import { getDueSummary, getLearnProgress } from '../lib/rct/learnProgress';
import { getAuditSummary } from '../lib/rct/auditProgress';
import { DOMAINS } from '../lib/rct/mavenOntology';
import { isRctMigrationError } from '../lib/skillsSchema';
import { BookOpen, User, Award, TrendingUp, Shield, ArrowRight, Brain, ChevronRight, AlertCircle, BarChart3 } from 'lucide-react';

interface RecentSkill {
  id: string;
  name: string;
  level: string;
  source?: string;
  rct_node_id?: string;
  created_at: string;
}

const QUICK_ACTIONS = [
  { href: '/learn', icon: Brain, title: 'Learn', description: 'RCT epistemic engine — map unknown cases onto known anchors with spaced retrieval.', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30', iconColor: 'text-purple-400', badge: 'Train' },
  { href: '/learn?tab=audit', icon: BarChart3, title: 'Audit', description: 'Coverage auditor — find ontology gaps from real-world questions and link them to training.', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', iconColor: 'text-cyan-400', badge: 'Coverage' },
  { href: '/skills', icon: BookOpen, title: 'My Skills', description: 'Manage and document your professional skills with evidence and proof of competency.', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', iconColor: 'text-emerald-400', badge: 'Core' },
  { href: '/profile', icon: User, title: 'Profile', description: 'View and update your personal information and account settings.', gradient: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-500/30', iconColor: 'text-slate-300', badge: 'Account' },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ skills: 0, evidence: 0, rct: 0 });
  const [recent, setRecent] = useState<RecentSkill[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [learnPct, setLearnPct] = useState(0);
  const [auditSummary, setAuditSummary] = useState({ coveragePct: 0, uncovered: 0, orphanNodes: 0 });
  const [statsError, setStatsError] = useState('');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    setStatsError('');
    supabase
      .from('skills')
      .select('id, name, level, evidence, source, rct_node_id, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setStatsError(error.message);
          return;
        }
        const rows = data || [];
        setStats({
          skills: rows.length,
          evidence: rows.filter(s => s.evidence?.trim()).length,
          rct: rows.filter(s => s.source === 'rct').length,
        });
        setRecent(rows.slice(0, 5));
      });

    const maven = DOMAINS.maven;
    const due = getDueSummary('maven', maven.nodes);
    const progress = getLearnProgress('maven', maven.nodes);
    const audit = getAuditSummary('maven');
    setDueCount(due.count);
    setLearnPct(progress.total ? Math.round((progress.cleared / progress.total) * 100) : 0);
    setAuditSummary(audit);
  }, [user]);

  if (!user) return null;
  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  return (
    <AppShell onSignOut={handleSignOut}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Skills Intelligence Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Welcome back, <span className="text-gradient-emerald">{user.email?.split('@')[0] ?? 'there'}</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Track, document, and evidence your professional skills. Train with RCT convergence, audit coverage gaps, and sync proof to your portfolio.
        </p>
      </div>

      {statsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
            Could not load portfolio stats: {statsError}
            {isRctMigrationError(statsError) && ' — run supabase/setup_all.sql in the Supabase SQL editor.'}
          </p>
        </div>
      )}

      {stats.skills === 0 && learnPct === 0 && !statsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white mb-2">Getting started</h2>
            <p className="text-sm text-slate-400 mb-5 max-w-2xl">
              New here? Start with the Maven RCT learning path — clear nodes to sync evidence to your portfolio automatically.
              Or add skills manually, then audit coverage gaps.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/learn" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20">
                Start learning
              </Link>
              <Link to="/skills" className="bg-slate-800/60 border border-slate-700/60 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-emerald-500/30">
                Add a skill
              </Link>
              <Link to="/learn?tab=audit" className="text-cyan-400 border border-cyan-500/30 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-cyan-500/10">
                Explore audit
              </Link>
            </div>
          </div>
        </div>
      )}

      {(dueCount > 0 || learnPct > 0 || auditSummary.uncovered > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {dueCount > 0 && (
              <Link to="/learn"
                className="flex-1 flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/25 rounded-xl hover:bg-amber-500/10 transition-colors">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-amber-200">{dueCount} node{dueCount !== 1 ? 's' : ''} due for retrieval</div>
                  <div className="text-xs text-amber-400/80">Spaced review keeps your convergence fresh — tap to train</div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 ml-auto shrink-0" />
              </Link>
            )}
            {learnPct > 0 && (
              <Link to="/learn"
                className="flex-1 flex items-center gap-3 p-4 bg-purple-500/5 border border-purple-500/25 rounded-xl hover:bg-purple-500/10 transition-colors">
                <Brain className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-purple-200">{learnPct}% Maven convergence</div>
                  <div className="text-xs text-purple-400/80">Continue the RCT learning path</div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 ml-auto shrink-0" />
              </Link>
            )}
            {auditSummary.uncovered > 0 && (
              <Link to="/learn?tab=audit"
                className="flex-1 flex items-center gap-3 p-4 bg-cyan-500/5 border border-cyan-500/25 rounded-xl hover:bg-cyan-500/10 transition-colors">
                <BarChart3 className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-cyan-200">{auditSummary.uncovered} uncovered audit gap{auditSummary.uncovered !== 1 ? 's' : ''}</div>
                  <div className="text-xs text-cyan-400/80">{auditSummary.coveragePct}% demand covered · review in Audit</div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 ml-auto shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Award, label: 'Skills Tracked', value: stats.skills, color: 'text-emerald-400' },
            { icon: TrendingUp, label: 'Evidence Added', value: stats.evidence, color: 'text-teal-400' },
            { icon: Shield, label: 'RCT Converged', value: stats.rct, color: 'text-cyan-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
              <div className="text-xs text-slate-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-300">Recent activity</h2>
            <Link to="/skills" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl divide-y divide-slate-800/60">
            {recent.map(skill => (
              <Link key={skill.id} to={`/skills?skill=${skill.id}`}
                className="flex items-center justify-between px-5 py-3.5 gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{skill.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{skill.level} · {new Date(skill.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {skill.source === 'rct' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded">RCT</span>
                  )}
                  {skill.source === 'rct' && skill.rct_node_id && (
                    <span
                      onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/learn?node=${skill.rct_node_id}`); }}
                      className="text-xs text-purple-400 hover:text-purple-300"
                      role="link"
                    >
                      retrain
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ href, icon: Icon, title, description, gradient, border, iconColor, badge }) => (
            <Link key={href} to={href}
              className={`group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-slate-800/60 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700/40">{badge}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
              <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all duration-200">
                Go to {title} <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
