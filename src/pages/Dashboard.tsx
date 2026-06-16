import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, BarChart3, Briefcase, Target, TrendingUp,
  ChevronRight, ExternalLink, Zap,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import OntologyGraphModal from '../components/ui/OntologyGraphModal';
import { supabase } from '../lib/supabase';

interface Skill {
  id: string;
  name: string;
  level: string;
  domain: string | null;
  evidence: string | null;
}

interface Stats {
  totalSkills: number;
  withEvidence: number;
  jobApplications: number;
  gapsQueued: number;
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [recentSkills, setRecentSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSkills: 0, withEvidence: 0, jobApplications: 0, gapsQueued: 0 });
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [graphSkill, setGraphSkill] = useState<{ name: string; level: string } | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user, navigate]);

  async function loadData() {
    setLoadErr(null);
    try {
      const [skillsRes, appsRes, gapsRes] = await Promise.all([
        supabase.from('skills').select('id, name, level, domain, evidence').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('skill_gaps').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ]);
      if (skillsRes.error) throw skillsRes.error;
      const skills = (skillsRes.data ?? []) as Skill[];
      setRecentSkills(skills);
      setStats({
        totalSkills: skills.length,
        withEvidence: skills.filter(s => s.evidence).length,
        jobApplications: appsRes.count ?? 0,
        gapsQueued: gapsRes.count ?? 0,
      });
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : String(e));
    }
  }

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  if (!user) return null;

  const STAT_CARDS = [
    { label: 'Skills documented', value: stats.totalSkills, icon: Brain, color: 'emerald', href: '/skills' },
    { label: 'With evidence', value: stats.withEvidence, icon: BarChart3, color: 'cyan', href: '/skills' },
    { label: 'Job applications', value: stats.jobApplications, icon: Briefcase, color: 'violet', href: '/apply' },
    { label: 'Gaps queued', value: stats.gapsQueued, icon: Target, color: 'amber', href: '/apply/gaps' },
  ];

  return (
    <>
      <AppShell trail={[{ label: 'Dashboard' }]} onSignOut={handleSignOut}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Welcome back{user.email ? ', ' + user.email.split('@')[0] : ''}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Your skills portfolio at a glance</p>
          </div>

          {/* Error */}
          {loadErr && (
            <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm" role="alert">
              {loadErr}
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_CARDS.map(({ label, value, icon: Icon, color, href }) => (
              <Link key={label} to={href}
                className={'block p-4 bg-slate-800/40 border border-slate-700/40 rounded-2xl hover:border-slate-600/60 transition-colors group'}>
                <div className={'w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-' + color + '-500/20 border border-' + color + '-500/30'}>
                  <Icon className={'w-4 h-4 text-' + color + '-400'} />
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </Link>
            ))}
          </div>

          {/* Recent skills + Apply AI cards row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent skills */}
            <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Recent Skills</h2>
                <Link to="/skills" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {recentSkills.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No skills yet.</p>
                  <Link to="/skills" className="text-xs text-emerald-400 hover:underline mt-1 inline-block">Add your first skill</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSkills.map(skill => (
                    <div key={skill.id} className="group flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-200 font-medium truncate block">{skill.name}</span>
                        {skill.domain && <span className="text-xs text-slate-500">{skill.domain}</span>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-slate-500 hidden sm:inline">{skill.level}</span>
                        {/* RCT Ontology Graph icon */}
                        <button
                          onClick={() => setGraphSkill({ name: skill.name, level: skill.level })}
                          title={'Open RCT ontology graph for ' + skill.name}
                          aria-label={'Open RCT ontology graph for ' + skill.name}
                          className="p-1.5 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Brain className="w-3.5 h-3.5" />
                        </button>
                        {/* Learn node link */}
                        <Link
                          to={'/learn?node=' + encodeURIComponent(skill.name)}
                          aria-label={'Open ' + skill.name + ' in RCT graph'}
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ApplyAI quick links */}
            <div className="space-y-4">
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <h2 className="text-sm font-semibold text-white">ApplyAI</h2>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Resume Builder', href: '/apply/resume', color: 'emerald' },
                    { label: 'JD Gap Analyzer', href: '/apply/gaps', color: 'cyan' },
                    { label: 'Applications', href: '/apply', color: 'violet' },
                  ].map(({ label, href, color }) => (
                    <Link key={label} to={href}
                      className={'flex items-center justify-between px-3 py-2.5 rounded-xl bg-' + color + '-500/10 border border-' + color + '-500/20 text-' + color + '-300 text-xs font-medium hover:bg-' + color + '-500/20 transition-colors'}>
                      {label}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-white">Learn</h2>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'RCT Graph', href: '/learn', color: 'amber' },
                    { label: 'Coverage Audit', href: '/learn?tab=audit', color: 'cyan' },
                    { label: 'Generate Domain', href: '/learn?tab=generate', color: 'violet' },
                  ].map(({ label, href, color }) => (
                    <Link key={label} to={href}
                      className={'flex items-center justify-between px-3 py-2.5 rounded-xl bg-' + color + '-500/10 border border-' + color + '-500/20 text-' + color + '-300 text-xs font-medium hover:bg-' + color + '-500/20 transition-colors'}>
                      {label}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      {/* RCT Ontology Graph Modal */}
      {graphSkill && (
        <OntologyGraphModal
          skillName={graphSkill.name}
          skillLevel={graphSkill.level}
          onClose={() => setGraphSkill(null)}
        />
      )}
    </>
  );
}
