import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import { getLearnProgress, getDueSummary } from '../lib/rct/learnProgress';
import { getAuditSummary } from '../lib/rct/auditProgress';
import { DOMAINS } from '../lib/rct/mavenOntology';
import { STAGES } from '../lib/rct/types';
import { User, Mail, Calendar, Shield, ChevronRight, Brain, BookOpen, Award, BarChart3, Download } from 'lucide-react';
import { skillsToMarkdown, downloadMarkdown } from '../lib/portfolioExport';

export default function Profile() {
  useDocumentTitle('Profile');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState({ skills: 0, rct: 0, evidence: 0 });
  const [learn, setLearn] = useState({ pct: 0, stage: 0, due: 0 });
  const [audit, setAudit] = useState({ coveragePct: 0, uncovered: 0 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('skills').select('id, evidence, source').then(({ data }) => {
      const rows = data || [];
      setPortfolio({
        skills: rows.length,
        rct: rows.filter(s => s.source === 'rct').length,
        evidence: rows.filter(s => s.evidence?.trim()).length,
      });
    });
    const maven = DOMAINS.maven;
    const progress = getLearnProgress('maven', maven.nodes);
    const due = getDueSummary('maven', maven.nodes);
    const auditSum = getAuditSummary('maven');
    setLearn({
      pct: progress.total ? Math.round((progress.cleared / progress.total) * 100) : 0,
      stage: progress.stage,
      due: due.count,
    });
    setAudit({ coveragePct: auditSum.coveragePct, uncovered: auditSum.uncovered });
  }, [user]);

  if (!user) return null;

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  async function handleExport() {
    if (!user) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.from('skills').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const md = skillsToMarkdown(data || [], user.email);
      const date = new Date().toISOString().slice(0, 10);
      downloadMarkdown(md, `witnessskills-portfolio-${date}.md`);
    } catch {
      /* export failed silently — user can use Skills page */
    } finally {
      setExporting(false);
    }
  }

  const displayName = user.email?.split('@')[0] ?? 'User';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <AppShell trail={[{ label: 'Dashboard', href: '/' }, { label: 'Profile' }]} onSignOut={handleSignOut}>
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

          {/* Portfolio, Learn & Audit stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Portfolio</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Skills', value: portfolio.skills, icon: BookOpen },
                  { label: 'Evidence', value: portfolio.evidence, icon: Award },
                  { label: 'RCT', value: portfolio.rct, icon: Brain },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <Icon className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
                  </div>
                ))}
              </div>
              <Link to="/skills" className="mt-4 block text-center text-xs text-emerald-400 hover:text-emerald-300">Manage portfolio →</Link>
              {portfolio.skills > 0 && (
                <button onClick={handleExport} disabled={exporting}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 disabled:opacity-50">
                  <Download className="w-3.5 h-3.5" />
                  {exporting ? 'Exporting…' : 'Export as markdown'}
                </button>
              )}
            </div>
            <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Learn progress</h2>
              <div className="text-3xl font-bold text-purple-300 mb-1">{learn.pct}%</div>
              <div className="text-xs text-slate-500 mb-3">Maven convergence</div>
              <div className="text-sm text-slate-400">
                Epistemic stage: <span className="text-purple-300 font-medium">{STAGES[learn.stage]?.name ?? 'Recognize'}</span>
                <span className="text-slate-600"> · {learn.stage + 1}/{STAGES.length}</span>
              </div>
              {learn.due > 0 && (
                <div className="text-xs text-amber-400/90 mt-2">{learn.due} node{learn.due !== 1 ? 's' : ''} due for retrieval</div>
              )}
              <Link to="/learn" className="mt-4 block text-center text-xs text-purple-400 hover:text-purple-300">Continue learning →</Link>
            </div>
            <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Audit coverage</h2>
              <div className="text-3xl font-bold text-cyan-300 mb-1">{audit.coveragePct}%</div>
              <div className="text-xs text-slate-500 mb-3">Maven demand covered</div>
              {audit.uncovered > 0 ? (
                <div className="text-xs text-amber-400/90">{audit.uncovered} uncovered gap{audit.uncovered !== 1 ? 's' : ''}</div>
              ) : (
                <div className="text-xs text-emerald-400/90">All questions mapped to nodes</div>
              )}
              <Link to="/learn?tab=audit" className="mt-4 block text-center text-xs text-cyan-400 hover:text-cyan-300">Open auditor →</Link>
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
            <Link to="/learn" className="flex items-center justify-between py-3 group border-b border-slate-700/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">Learn</div>
                  <div className="text-xs text-slate-500">RCT epistemic engine with spaced retrieval</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </Link>
            <Link to="/learn?tab=audit" className="flex items-center justify-between py-3 group border-b border-slate-700/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">Audit</div>
                  <div className="text-xs text-slate-500">Coverage gaps and ontology blind spots</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </Link>
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

        </div>
    </AppShell>
  );
}
