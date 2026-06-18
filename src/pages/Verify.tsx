import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, Clock, CheckCircle2, AlertCircle, Copy, ExternalLink, Loader2, Plus, FileText, Users } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import {
  getPublishedPacks,
  getUserVerificationRequests,
  createVerificationRequest,
} from '../lib/pft-queries';
import { emitFieldTestEvent } from '../lib/pft-queries';
import type { DomainPack, VerificationRequest } from '../lib/pft-types';

// ---------------------------------------------------------------
// PACK CARD
// ---------------------------------------------------------------

const PACK_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'ai_generated_backend_code_review': {
    bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-300', badge: 'bg-blue-500/15 text-blue-300',
  },
  'role_specific_ai_governance': {
    bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-300', badge: 'bg-amber-500/15 text-amber-300',
  },
  'agentic_ai_oversight': {
    bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-300', badge: 'bg-rose-500/15 text-rose-300',
  },
  'multi_tenant_saas_architecture': {
    bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-300', badge: 'bg-emerald-500/15 text-emerald-300',
  },
  default: {
    bg: 'bg-slate-800/40', border: 'border-slate-700/40', text: 'text-slate-300', badge: 'bg-slate-700/60 text-slate-300',
  },
};

function packColor(pft: string) {
  return PACK_COLORS[pft] ?? PACK_COLORS.default;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft:               { label: 'Draft',          color: 'text-slate-400',  icon: Clock },
  pending:             { label: 'Awaiting invite', color: 'text-amber-400',  icon: Clock },
  participant_invited: { label: 'Invited',         color: 'text-blue-400',   icon: Users },
  probe_completed:     { label: 'Probe done',      color: 'text-teal-400',   icon: CheckCircle2 },
  report_generated:    { label: 'Report ready',    color: 'text-emerald-400',icon: FileText },
  closed:              { label: 'Closed',          color: 'text-slate-500',  icon: CheckCircle2 },
};

// ---------------------------------------------------------------
// NEW REQUEST FORM
// ---------------------------------------------------------------

interface NewRequestFormProps {
  packs: DomainPack[];
  onCreated: (req: VerificationRequest) => void;
  onCancel: () => void;
}

function NewRequestForm({ packs, onCreated, onCancel }: NewRequestFormProps) {
  const { user } = useAuth();
  const [packId, setPackId] = useState(packs[0]?.id ?? '');
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !packId || !goal.trim() || !context.trim() || !email.trim()) return;
    setSaving(true);
    setError('');
    try {
      const req = await createVerificationRequest({
        pack_id: packId,
        created_by: user.id,
        workspace_id: null,
        source_artifact_id: null,
        goal: goal.trim(),
        decision_context: context.trim(),
        report_recipient_email: email.trim(),
        deadline: null,
        custom_notes: null,
      });
      await emitFieldTestEvent('participant_invited', { pack_id: packId }, undefined, packId);
      onCreated(req);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request.');
    } finally {
      setSaving(false);
    }
  }

  const selectedPack = packs.find(p => p.id === packId);
  const colors = packColor(selectedPack?.promoted_field_test ?? '');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pack selector */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Select a probe pack</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {packs.map(pack => {
            const c = packColor(pack.promoted_field_test);
            const sel = packId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setPackId(pack.id)}
                className={`text-left p-3 rounded-xl border transition-all ${sel ? `${c.bg} ${c.border} ring-1 ring-offset-0` : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60'}`}
                style={sel ? { ['--tw-ring-color' as string]: 'rgba(99,102,241,0.3)' } : undefined}
              >
                <div className={`text-[10px] font-mono uppercase tracking-wider mb-0.5 ${sel ? c.text : 'text-slate-500'}`}>
                  ~{pack.estimated_minutes} min
                </div>
                <div className={`text-sm font-medium ${sel ? 'text-white' : 'text-slate-300'}`}>{pack.user_facing_title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{pack.b2b_cta}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          What decision will this probe inform?
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="e.g. Evaluating a candidate for a senior backend role"
          value={goal}
          onChange={e => setGoal(e.target.value)}
          required
        />
      </div>

      {/* Decision context */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Context for the report reader</label>
        <textarea
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
          rows={2}
          placeholder="e.g. Backend role at a multi-tenant SaaS company. Team uses AI coding tools heavily."
          value={context}
          onChange={e => setContext(e.target.value)}
          required
        />
      </div>

      {/* Recipient email */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Your email (report recipient)</label>
        <input
          type="email"
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="you@yourcompany.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      {/* Responsible use note */}
      {selectedPack?.responsible_use_copy && (
        <div className={`p-3 rounded-lg text-[11px] leading-relaxed ${colors.bg} ${colors.border} border ${colors.text} opacity-80`}>
          {selectedPack.responsible_use_copy}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !packId || !goal.trim() || !context.trim() || !email.trim()}
          className="flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold disabled:opacity-50 transition-all"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Create request
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------
// REQUEST CARD
// ---------------------------------------------------------------

function InviteLinkBox({ token, packName }: { token: string; packName: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/probe/${token}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/40 space-y-2">
      <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Participant probe link</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-emerald-300 font-mono truncate">{url}</code>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-700/60 text-slate-300 hover:text-white transition-colors flex-shrink-0"
        >
          {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[10px] text-slate-600">
        Send this to your participant. They complete the {packName} probe and you receive the evidence report.
      </p>
    </div>
  );
}

function RequestCard({
  req,
  packs,
}: {
  req: VerificationRequest;
  packs: DomainPack[];
}) {
  const pack = packs.find(p => p.id === req.pack_id);
  const colors = packColor(pack?.promoted_field_test ?? '');
  const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border} space-y-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}>
              {pack?.user_facing_title ?? 'Unknown pack'}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-mono ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm font-medium text-white mt-1 truncate">{req.goal}</p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{req.decision_context}</p>
        </div>
        <div className="text-[10px] font-mono text-slate-600 flex-shrink-0 mt-1">
          {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {req.invite_token && (
        <InviteLinkBox token={req.invite_token} packName={pack?.user_facing_title ?? 'probe'} />
      )}

      {req.status === 'report_generated' && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300">Evidence report ready</span>
          <button className="ml-auto flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors">
            View report <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// EMPTY STATE
// ---------------------------------------------------------------

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto">
        <Shield className="w-7 h-7 text-slate-500" />
      </div>
      <div>
        <p className="text-slate-300 font-medium">No verification requests yet</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Choose a pack, set context, and send a probe link. Get an evidence report — not a score.
        </p>
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
      >
        <Plus className="w-4 h-4" />
        New verification request
      </button>
    </div>
  );
}

// ---------------------------------------------------------------
// PACK EXPLAINER
// ---------------------------------------------------------------

const PACK_DESCRIPTIONS: Record<string, { why: string; artifact: string; for_org: string }> = {
  ai_generated_backend_code_review: {
    why: 'AI-generated code can pass linting and basic tests while violating authorization boundaries, tenant isolation, or embedding secrets. A green build is not proof of understanding.',
    artifact: 'Anonymized PR or secure-review checklist',
    for_org: 'AppSec leads, VP Eng, hiring managers for backend roles',
  },
  role_specific_ai_governance: {
    why: 'Employees using AI in regulated contexts (customer support, HR, legal, finance) face real misuse risk when policy is silent. Training completion does not prove judgment under ambiguity.',
    artifact: 'AI-use policy, escalation matrix, or QA rubric',
    for_org: 'AI governance owners, compliance leads, support/ops managers',
  },
  agentic_ai_oversight: {
    why: 'Agents granted permissions for one task may take irreversible actions in adjacent contexts. Explicit escalation thresholds and scope boundaries are required, not assumed.',
    artifact: 'Agent permission model, escalation policy, or incident scenario',
    for_org: 'Risk owners, security leads, AI platform teams',
  },
  multi_tenant_saas_architecture: {
    why: 'SaaS architecture invariants (tenant isolation, idempotency, key revocation) must hold under scenario mutation. Staff+ reasoning under change is what matters — not recitation of principles.',
    artifact: 'Staff+ JD, architecture prompt, or anonymized incident',
    for_org: 'CTOs, VP Eng, staff engineering leads',
  },
};

function PackExplainerPanel({ packs }: { packs: DomainPack[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Available packs</p>
      {packs.filter(p => p.availability !== 'personal').map(pack => {
        const colors = packColor(pack.promoted_field_test);
        const desc = PACK_DESCRIPTIONS[pack.promoted_field_test];
        const open = expanded === pack.id;

        return (
          <button
            key={pack.id}
            onClick={() => setExpanded(open ? null : pack.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all ${colors.bg} ${colors.border} hover:opacity-90`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${colors.text}`}>
                  ~{pack.estimated_minutes} min
                </span>
                <p className="text-sm font-medium text-white mt-0.5">{pack.user_facing_title}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
            </div>

            {open && desc && (
              <div className="mt-3 space-y-2 text-xs text-left" onClick={e => e.stopPropagation()}>
                <p className="text-slate-300 leading-relaxed">{desc.why}</p>
                <div className="flex gap-4">
                  <div>
                    <span className="text-slate-500">Artifact: </span>
                    <span className="text-slate-400">{desc.artifact}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">For: </span>
                  <span className="text-slate-400">{desc.for_org}</span>
                </div>
                {pack.responsible_use_copy && (
                  <p className={`italic ${colors.text} opacity-70`}>{pack.responsible_use_copy}</p>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------

export default function Verify() {
  useDocumentTitle('Verify');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [packs, setPacks] = useState<DomainPack[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user, navigate]);

  async function loadData() {
    setLoading(true);
    try {
      const [ps, rs] = await Promise.all([
        getPublishedPacks(),
        getUserVerificationRequests(user!.id),
      ]);
      // Filter to org-available packs only for this page
      setPacks(ps.filter(p => p.availability !== 'personal' || p.availability === 'both'));
      setRequests(rs);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }

  function handleCreated(req: VerificationRequest) {
    setRequests(prev => [req, ...prev]);
    setShowForm(false);
  }

  if (loading) {
    return (
      <AppShell onSignOut={signOut}>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell onSignOut={signOut}>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Verify</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Send a probe. Get an evidence report — not a score.
            </p>
          </div>
          {!showForm && requests.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-600/30 transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              New request
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: requests + form */}
          <div className="lg:col-span-2 space-y-4">

            {showForm ? (
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <h2 className="text-sm font-semibold text-white mb-4">New verification request</h2>
                <NewRequestForm
                  packs={packs}
                  onCreated={handleCreated}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState onNew={() => setShowForm(true)} />
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <RequestCard key={req.id} req={req} packs={packs} />
                ))}
              </div>
            )}
          </div>

          {/* Right: pack guide */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-semibold text-white">How it works</span>
              </div>
              <ol className="space-y-2">
                {[
                  ['Choose a pack', 'Matches the role, risk, or decision you need to inform.'],
                  ['Set context', 'The report reader sees the decision this probe supports.'],
                  ['Send a link', 'Participant completes the probe — ~8–15 minutes.'],
                  ['Read the report', 'Mechanisms tested, patterns observed, follow-up questions. Not a pass/fail.'],
                ].map(([step, desc], i) => (
                  <li key={i} className="flex gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-700/60 border border-slate-600/40 text-slate-400 font-mono flex items-center justify-center flex-shrink-0 text-[10px]">{i + 1}</span>
                    <div>
                      <span className="font-medium text-slate-300">{step} — </span>
                      <span className="text-slate-500">{desc}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="pt-1 border-t border-slate-700/40 text-[10px] text-slate-600 leading-relaxed">
                Results describe observable reasoning patterns. Use alongside other information. Do not make decisions solely from this report.
              </div>
            </div>

            {packs.length > 0 && <PackExplainerPanel packs={packs} />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
