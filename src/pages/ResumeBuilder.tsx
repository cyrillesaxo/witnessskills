import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Copy, Download, Brain, ExternalLink, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import BackgroundGlow from '../components/ui/BackgroundGlow';

interface Skill {
  id: string;
  name: string;
  level: string;
  domain?: string;
  evidence?: string;
  tags?: string[];
  rct_node_id?: string;
}

type ResumeVersion = 'A' | 'B';

const VERSION_INFO = {
  A: { label: 'Version A — ATS/Boards', desc: 'LinkedIn Easy Apply, Workday, Greenhouse, Lever, Indeed, Dice' },
  B: { label: 'Version B — Human Outreach', desc: 'LinkedIn DM, recruiter email, hiring manager, referral intro' },
};

const LEVEL_ORDER: Record<string, number> = {
  expert: 4, advanced: 3, intermediate: 2, beginner: 1,
};

export default function ResumeBuilder() {
  useDocumentTitle('Resume Builder');
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<ResumeVersion>('A');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSkills();
  }, [user]);

  async function loadSkills() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('skills')
        .select('id, name, level, domain, evidence, tags, rct_node_id')
        .eq('user_id', user!.id)
        .order('level', { ascending: false });
      if (err) throw new Error(err.message);
      setSkills(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function buildResumeText(): string {
    if (skills.length === 0) return '';
    const sortedSkills = [...skills].sort((a, b) =>
      (LEVEL_ORDER[b.level] || 0) - (LEVEL_ORDER[a.level] || 0)
    );
    const byDomain: Record<string, Skill[]> = {};
    for (const s of sortedSkills) {
      const key = s.domain || 'General';
      byDomain[key] = byDomain[key] || [];
      byDomain[key].push(s);
    }

    const header = version === 'A'
      ? 'TECHNICAL SKILLS PORTFOLIO\n' + '='.repeat(40) + '\n'
      : 'EXPERTISE OVERVIEW\n' + '-'.repeat(40) + '\n';

    const sections = Object.entries(byDomain)
      .map(([domain, domainSkills]) => {
        const names = domainSkills.map(s => s.name).join(' | ');
        return domain + ':\n  ' + names;
      })
      .join('\n\n');

    const evidenceSections = sortedSkills
      .filter(s => s.evidence && s.evidence.length > 0)
      .slice(0, 6)
      .map(s => '• ' + s.name + ' (' + s.level + '):\n  ' + s.evidence)
      .join('\n\n');

    const evidenceBlock = evidenceSections
      ? '\n\nSELECTED EVIDENCE\n' + '='.repeat(40) + '\n' + evidenceSections
      : '';

    return header + sections + evidenceBlock;
  }

  function handleCopy() {
    const text = buildResumeText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const text = buildResumeText();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume_v' + version + '_' + new Date().toISOString().split('T')[0] + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  const sortedSkills = [...skills].sort((a, b) =>
    (LEVEL_ORDER[b.level] || 0) - (LEVEL_ORDER[a.level] || 0)
  );

  const byDomain: Record<string, Skill[]> = {};
  for (const s of sortedSkills) {
    const key = s.domain || 'General';
    byDomain[key] = byDomain[key] || [];
    byDomain[key].push(s);
  }

  const LEVEL_COLORS: Record<string, string> = {
    expert: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
    advanced: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
    intermediate: 'text-teal-400 bg-teal-500/10 border border-teal-500/20',
    beginner: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <BackgroundGlow />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-emerald-400" />
                Resume Builder
              </h1>
              <p className="text-slate-400 mt-1">
                Generated from your skills portfolio. Each competence links to its training node.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={skills.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                disabled={skills.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>
          </div>

          {/* Version toggle */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Resume Version</p>
            <div className="flex gap-3">
              {(['A', 'B'] as ResumeVersion[]).map(v => (
                <button
                  key={v}
                  onClick={() => setVersion(v)}
                  className={'flex-1 text-left p-4 rounded-lg border transition-all ' + (version === v
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600')}
                >
                  <p className={'font-semibold text-sm ' + (version === v ? 'text-emerald-300' : 'text-white')}>
                    {VERSION_INFO[v].label}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{VERSION_INFO[v].desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button onClick={loadSkills} className="ml-auto underline hover:no-underline">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-900/50 rounded-xl animate-pulse" />)}
            </div>
          ) : skills.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-12 text-center">
              <Brain className="w-14 h-14 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No skills in your portfolio</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Add skills to your portfolio first. Your resume will be generated automatically from them,
                and each competence will link directly to its training node.
              </p>
              <Link
                to="/skills"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Skills
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Skills tracked', value: skills.length },
                  { label: 'With evidence', value: skills.filter(s => s.evidence && s.evidence.length > 0).length },
                  { label: 'RCT converged', value: skills.filter(s => s.rct_node_id).length },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Skills by domain — each chip links to Learn node */}
              {Object.entries(byDomain).map(([domain, domainSkills]) => (
                <div key={domain} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    {domain}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {domainSkills.map(skill => (
                      <Link
                        key={skill.id}
                        to={'/learn?node=' + encodeURIComponent(skill.name)}
                        title={'Train: ' + skill.name + ' — click to open in RCT engine'}
                        className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:ring-2 hover:ring-white/20 cursor-pointer ' + (LEVEL_COLORS[skill.level] || 'text-slate-400 bg-slate-800 border border-slate-700')}
                      >
                        {skill.name}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-3">Click any skill to open its training node in the RCT engine</p>
                </div>
              ))}

              {/* Evidence preview */}
              {skills.filter(s => s.evidence && s.evidence.length > 0).length > 0 && (
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Evidence Highlights
                  </h3>
                  <div className="space-y-3">
                    {skills
                      .filter(s => s.evidence && s.evidence.length > 0)
                      .slice(0, 6)
                      .map(skill => (
                        <div key={skill.id} className="flex gap-3">
                          <Link
                            to={'/learn?node=' + encodeURIComponent(skill.name)}
                            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap flex items-center gap-1"
                          >
                            {skill.name}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <span className={'text-xs px-2 py-0.5 rounded-full self-start mt-0.5 ' + (LEVEL_COLORS[skill.level] || '')}>
                            {skill.level}
                          </span>
                          <p className="text-sm text-slate-400 flex-1">{skill.evidence}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
