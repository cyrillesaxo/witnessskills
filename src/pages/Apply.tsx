import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import {
  Briefcase, Send, TrendingUp, Clock, CheckCircle,
  XCircle, MessageSquare, RefreshCw, Plus, ExternalLink,
  FileText, Search, ChevronRight, AlertCircle
} from 'lucide-react';

interface JobApplication {
  id: string;
  company: string;
  title: string;
  url?: string;
  email?: string;
  resume_version: 'A' | 'B';
  status: 'sent' | 'opened' | 'replied' | 'rejected' | 'interview';
  source: 'manual' | 'scan' | 'referral';
  applied_at: string;
  notes?: string;
}

interface ScanRun {
  id: string;
  run_date: string;
  jobs_found: number;
  emails_sent: number;
  created_at: string;
}

const STATUS_CONFIG = {
  sent:      { label: 'Sent',      color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',    icon: Send },
  opened:    { label: 'Opened',    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',        icon: Clock },
  replied:   { label: 'Replied',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: MessageSquare },
  rejected:  { label: 'Rejected',  color: 'bg-red-500/20 text-red-300 border-red-500/30',           icon: XCircle },
  interview: { label: 'Interview', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',  icon: CheckCircle },
} as const;

export default function Apply() {
  useDocumentTitle('Apply');
  const { user } = useAuth();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [scanRuns, setScanRuns] = useState<ScanRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Stats derived from applications
  const stats = {
    total: applications.length,
    sent: applications.filter(a => a.status === 'sent').length,
    replied: applications.filter(a => a.status === 'replied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    replyRate: applications.length > 0
      ? Math.round((applications.filter(a => ['replied', 'interview'].includes(a.status)).length / applications.length) * 100)
      : 0,
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [appsResult, scansResult] = await Promise.all([
        supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', user!.id)
          .order('applied_at', { ascending: false })
          .limit(50),
        supabase
          .from('scan_runs')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (appsResult.data) setApplications(appsResult.data);
      if (scansResult.data) setScanRuns(scansResult.data);
      if (appsResult.error) throw appsResult.error;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: JobApplication['status']) {
    const { error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', id);
    if (!error) setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  const lastScan = scanRuns[0];

  return (
    <AppShell>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ApplyAI</h1>
                <p className="text-slate-400 text-sm">Job campaign dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/60 rounded-xl text-slate-300 hover:text-white transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add manual
            </button>
            <Link
              to="/apply/resume"
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/60 rounded-xl text-slate-300 hover:text-white transition-all text-sm"
            >
              <FileText className="w-4 h-4" />
              Résumé builder
            </Link>
            <Link
              to="/apply/gaps"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all text-sm shadow-lg shadow-violet-900/30"
            >
              <Search className="w-4 h-4" />
              Analyze JD
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total sent', value: stats.total, icon: Send, color: 'text-violet-400' },
            { label: 'In flight', value: stats.sent, icon: Clock, color: 'text-blue-400' },
            { label: 'Replies', value: stats.replied, icon: MessageSquare, color: 'text-emerald-400' },
            { label: 'Reply rate', value: stats.replyRate + '%', icon: TrendingUp, color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Last scan info */}
        {lastScan && (
          <div className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
            <RefreshCw className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div className="text-sm text-slate-300">
              Last scan: <span className="text-white font-medium">{new Date(lastScan.created_at).toLocaleDateString()}</span>
              {' · '}{lastScan.jobs_found} jobs found{' · '}{lastScan.emails_sent} emails sent
            </div>
            <div className="ml-auto text-xs text-slate-500">
              Daily scan runs automatically at 8am via cron
            </div>
          </div>
        )}

        {/* Applications table */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <h2 className="text-white font-semibold">Applications</h2>
            <div className="flex gap-2">
              {['all', 'sent', 'opened', 'replied', 'interview', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs capitalize transition-all ${
                    filter === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading applications...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No applications yet</p>
              <p className="text-slate-500 text-sm">
                Set up the daily scan script or add applications manually.
              </p>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-sm transition-all"
                >
                  Add first application
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {filtered.map(app => {
                const cfg = STATUS_CONFIG[app.status];
                const Icon = cfg.icon;
                return (
                  <div key={app.id} className="flex items-center gap-4 p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm truncate">{app.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${cfg.color} flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-400">
                          v{app.resume_version}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-xs">
                        <span>{app.company}</span>
                        {app.email && <span>· {app.email}</span>}
                        <span>· {new Date(app.applied_at).toLocaleDateString()}</span>
                        {app.source === 'scan' && <span className="text-violet-400">· auto-scan</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.url && (
                        <a href={app.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <select
                        value={app.status}
                        onChange={e => updateStatus(app.id, e.target.value as JobApplication['status'])}
                        className="text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                          <option key={val} value={val}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/apply/resume"
            className="flex items-center justify-between p-5 bg-slate-800/40 border border-slate-700/50 hover:border-violet-500/50 rounded-2xl group transition-all">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-violet-400" />
              <div>
                <div className="text-white text-sm font-medium">Résumé Builder</div>
                <div className="text-slate-400 text-xs mt-0.5">Generate Version A or B from your skills</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          </Link>
          <Link to="/apply/gaps"
            className="flex items-center justify-between p-5 bg-slate-800/40 border border-slate-700/50 hover:border-violet-500/50 rounded-2xl group transition-all">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-violet-400" />
              <div>
                <div className="text-white text-sm font-medium">JD Gap Analyzer</div>
                <div className="text-slate-400 text-xs mt-0.5">Paste a job description, find skill gaps</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          </Link>
        </div>

      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <AddApplicationModal
          userId={user!.id}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); loadData(); }}
        />
      )}
    </AppShell>
  );
}

function AddApplicationModal({ userId, onClose, onSaved }: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    company: '', title: '', url: '', email: '',
    resume_version: 'A' as 'A' | 'B',
    status: 'sent' as JobApplication['status'],
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.company || !form.title) return;
    setSaving(true);
    const { error } = await supabase.from('job_applications').insert({
      user_id: userId,
      company: form.company,
      title: form.title,
      url: form.url || null,
      email: form.email || null,
      resume_version: form.resume_version,
      status: form.status,
      notes: form.notes || null,
      source: 'manual',
    });
    setSaving(false);
    if (!error) onSaved();
  }

  const inputClass = 'w-full px-4 py-3 bg-slate-900/50 border border-slate-600/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Add Application</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company *</label>
              <input className={inputClass} placeholder="e.g. Stripe" value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Job Title *</label>
              <input className={inputClass} placeholder="e.g. Principal Architect" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Job URL</label>
            <input className={inputClass} placeholder="https://..." value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Contact Email</label>
            <input className={inputClass} placeholder="recruiter@company.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Résumé Version</label>
              <select className={inputClass} value={form.resume_version}
                onChange={e => setForm(f => ({ ...f, resume_version: e.target.value as 'A' | 'B' }))}>
                <option value="A">Version A — ATS</option>
                <option value="B">Version B — Human/Networking</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as JobApplication['status'] }))}>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea className={inputClass + ' resize-none'} rows={3} placeholder="Any notes about this application..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-slate-300 text-sm transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.company || !form.title}
            className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-white font-medium text-sm transition-all">
            {saving ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
