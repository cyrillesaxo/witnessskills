import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import {
  Brain, BarChart2, User, Briefcase, ChevronRight,
  AlertCircle, TrendingUp, Shield
} from 'lucide-react';

export default function Dashboard() {
  useDocumentTitle('Dashboard · WitnessSkills');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    skillsTracked: 0,
    evidenceAdded: 0,
    rctConverged: 0,
    applicationsSent: 0,
  });
  const [auditGaps, setAuditGaps] = useState(0);
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  async function loadStats() {
    try {
      const [skillsResult, appsResult] = await Promise.all([
        supabase
          .from('skills')
          .select('id, source')
          .eq('user_id', user!.id),
        supabase
          .from('job_applications')
          .select('id')
          .eq('user_id', user!.id),
      ]);

      if (skillsResult.error) throw skillsResult.error;

      const skillCount = skillsResult.data?.length || 0;
      const appCount = appsResult.data?.length || 0;

      setStats({
        skillsTracked: skillCount,
        evidenceAdded: 0,
        rctConverged: 0,
        applicationsSent: appCount,
      });
      setAuditGaps(2);
      setCoveragePercent(83);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const quickAccessCards = [
    {
      to: '/learn',
      label: 'Train',
      title: 'Learn',
      icon: Brain,
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/20 hover:border-violet-400/40',
      iconColor: 'text-violet-400',
      description: 'RCT epistemic engine — map unknown cases onto known anchors with spaced retrieval.',
    },
    {
      to: '/audit',
      label: 'Coverage',
      title: 'Audit',
      icon: BarChart2,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20 hover:border-blue-400/40',
      iconColor: 'text-blue-400',
      description: 'Coverage auditor — find ontology gaps from real-world questions and link them to training.',
    },
    {
      to: '/skills',
      label: 'Core',
      title: 'My Skills',
      icon: Shield,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20 hover:border-emerald-400/40',
      iconColor: 'text-emerald-400',
      description: 'Manage and document your professional skills with evidence and proof of competency.',
    },
    {
      to: '/apply',
      label: 'Apply',
      title: 'ApplyAI',
      icon: Briefcase,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/20 hover:border-amber-400/40',
      iconColor: 'text-amber-400',
      description: 'AI job scan — find matching roles daily, generate targeted résumés, track outcomes and close skill gaps.',
    },
    {
      to: '/profile',
      label: 'Account',
      title: 'Profile',
      icon: User,
      color: 'from-slate-500/20 to-slate-600/10 border-slate-500/20 hover:border-slate-400/40',
      iconColor: 'text-slate-400',
      description: 'View and update your personal information and account settings.',
    },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-4">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Skills Intelligence Platform
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back,{' '}
              <span className="text-emerald-400">{user?.user_metadata?.username || user?.email?.split('@')[0] || 'there'}</span>
            </h1>
            <p className="text-slate-400 max-w-lg">
              Track, document, and evidence your professional skills. Train with RCT convergence, audit coverage gaps, and sync proof to your portfolio.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Audit gap alert */}
        {auditGaps > 0 && (
          <button
            onClick={() => navigate('/audit')}
            className="w-full flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/40 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <span className="text-amber-300 font-medium text-sm">{auditGaps} uncovered audit gaps</span>
                <p className="text-amber-400/70 text-xs mt-0.5">{coveragePercent}% demand covered · review in Audit</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Skills Tracked', value: stats.skillsTracked, color: 'text-emerald-400' },
            { label: 'Evidence Added', value: stats.evidenceAdded, color: 'text-blue-400' },
            { label: 'RCT Converged', value: stats.rctConverged, color: 'text-violet-400' },
            { label: 'Applications Sent', value: stats.applicationsSent, color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-center">
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-slate-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-white font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessCards.map(card => (
              <Link
                key={card.to}
                to={card.to}
                className={`group flex flex-col p-6 bg-gradient-to-br ${card.color} border rounded-2xl transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</span>
                  <ChevronRight className={`w-4 h-4 ${card.iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                </div>
                <card.icon className={`w-7 h-7 ${card.iconColor} mb-3`} />
                <h3 className="text-white font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">{card.description}</p>
                <div className={`mt-4 text-xs font-medium ${card.iconColor}`}>
                  Go to {card.title} →
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
      }
