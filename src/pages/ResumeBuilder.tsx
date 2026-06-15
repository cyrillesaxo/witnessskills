import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Copy, Download, Printer, Brain, ExternalLink, AlertCircle, Plus, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import BackgroundGlow from '../components/ui/BackgroundGlow';

interface Skill {
  id: string; name: string; level: string; domain?: string;
  evidence?: string; tags?: string[]; rct_node_id?: string;
}
type ResumeVersion = 'A' | 'B';

const VERSION_INFO = {
  A: { label: 'Version A — ATS/Boards', desc: 'LinkedIn Easy Apply, Workday, Greenhouse, Lever, Indeed, Dice' },
  B: { label: 'Version B — Human Outreach', desc: 'LinkedIn DM, recruiter email, hiring manager, referral intro' },
};
const LEVEL_ORDER: Record<string, number> = { expert: 4, advanced: 3, intermediate: 2, beginner: 1 };
const LEVEL_COLORS: Record<string, string> = {
  expert: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
  advanced: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
  intermediate: 'text-teal-400 bg-teal-500/10 border border-teal-500/20',
  beginner: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
};

export default function ResumeBuilder() {
  useDocumentTitle('Resume Builder');
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<ResumeVersion>('A');
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!user) return; loadSkills(); }, [user]);

  async function loadSkills() {
    try {
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('skills').select('id, name, level, domain, evidence, tags, rct_node_id')
        .eq('user_id', user!.id).order('level', { ascending: false });
      if (err) throw new Error(err.message);
      setSkills(data || []);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setLoading(false); }
  }

  function buildResumeText(): string {
    if (!skills.length) return '';
    const sorted = [...skills].sort((a, b) => (LEVEL_ORDER[b.level] || 0) - (LEVEL_ORDER[a.level] || 0));
    const byDomain: Record<string, Skill[]> = {};
    for (const s of sorted) { const k = s.domain || 'General'; byDomain[k] = byDomain[k] || []; byDomain[k].push(s); }
    const header = version === 'A' ? 'TECHNICAL SKILLS PORTFOLIO\n' + '='.repeat(40) + '\n' : 'EXPERTISE OVERVIEW\n' + '-'.repeat(40) + '\n';
    const sections = Object.entries(byDomain).map(([d, ds]) => d + ':\n  ' + ds.map(s => s.name + ' (' + s.level + ')').join(' | ')).join('\n\n');
    const ev = sorted.filter(s => s.evidence).slice(0, 6).map(s => '• ' + s.name + ' (' + s.level + '):\n  ' + s.evidence).join('\n\n');
    return header + sections + (ev ? '\n\nSELECTED EVIDENCE\n' + '='.repeat(40) + '\n' + ev : '');
  }

  function handleCopy() {
    const t = buildResumeText(); if (!t) return;
    navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function handleDownloadTxt() {
    const t = buildResumeText(); if (!t) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' }));
    a.download = 'resume_v' + version + '_' + new Date().toISOString().split('T')[0] + '.txt';
    a.click();
  }

  function handlePrintPDF() {
    // Inject @media print styles, trigger browser Save as PDF
    const style = document.createElement('style');
    style.id = 'resume-print-style';
    style.textContent = '@media print { body > * { display: none !important; } #resume-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; color: #000 !important; background: #fff !important; padding: 20pt; font-family: serif; } #resume-print-area h1 { font-size: 22pt; font-weight: bold; margin-bottom: 4pt; } #resume-print-area h2 { font-size: 14pt; font-weight: bold; margin: 12pt 0 4pt; border-bottom: 1pt solid #ccc; } #resume-print-area .sc { display: inline-block; margin: 2pt; padding: 2pt 6pt; border: 1pt solid #999; border-radius: 4pt; font-size: 10pt; } #resume-print-area .ev { margin: 6pt 0; font-size: 10pt; } #resume-print-area .evn { font-weight: bold; } }';
    document.head.appendChild(style);
    window.print();
    setTimeout(() => { const s = document.getElementById('resume-print-style'); if (s) s.remove(); }, 1000);
  }

  const sorted = [...skills].sort((a, b) => (LEVEL_ORDER[b.level] || 0) - (LEVEL_ORDER[a.level] || 0));
  const byDomain: Record<string, Skill[]> = {};
  for (const s of sorted) { const k = s.domain || 'General'; byDomain[k] = byDomain[k] || []; byDomain[k].push(s); }

  return (
    <AppShell>
      {skills.length > 0 && (
        <div id="resume-print-area" style={{display: 'none'}} aria-hidden="true">
          <h1>{version === 'A' ? 'Technical Skills Portfolio' : 'Expertise Overview'}</h1>
          {Object.entries(byDomain).map(([d, ds]) => (
            <div key={d}><h2>{d}</h2>{ds.map(s => <span key={s.id} className="sc">{s.name} ({s.level})</span>)}</div>
          ))}
          {sorted.filter(s => s.evidence).length > 0 && (
            <div><h2>Selected Evidence</h2>
              {sorted.filter(s => s.evidence).slice(0, 6).map(s => (
                <div key={s.id} className="ev"><span className="evn">{s.name} ({s.level}):</span><div>{s.evidence}</div></div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <BackgroundGlow />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="w-7 h-7 text-emerald-400" aria-hidden="true" />Resume Builder
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Generated from your portfolio. Click any skill to open its training node.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleCopy} disabled={!skills.length} aria-label="Copy resume to clipboard"
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-sm">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleDownloadTxt} disabled={!skills.length} aria-label="Download as .txt"
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-sm">
                <Download className="w-4 h-4" aria-hidden="true" />.txt
              </button>
              <button onClick={handlePrintPDF} disabled={!skills.length} aria-label="Save resume as PDF via browser print"
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium">
                <Printer className="w-4 h-4" aria-hidden="true" />Save as PDF
              </button>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Resume Version</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Resume version">
              {(['A', 'B'] as ResumeVersion[]).map(v => (
                <button key={v} onClick={() => setVersion(v)} role="radio" aria-checked={version === v}
                  className={'text-left p-4 rounded-lg border transition-all ' + (version === v ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600')}>
                  <p className={'font-semibold text-sm ' + (version === v ? 'text-emerald-300' : 'text-white')}>{VERSION_INFO[v].label}</p>
                  <p className="text-xs text-slate-500 mt-1">{VERSION_INFO[v].desc}</p>
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />{error}
              <button onClick={loadSkills} className="ml-auto underline text-xs">Retry</button>
            </div>
          )}
          {loading ? (
            <div aria-busy="true" aria-label="Loading skills" className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-900/50 rounded-xl animate-pulse" />)}
            </div>
          ) : !skills.length ? (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8 sm:p-12 text-center">
              <Brain className="w-12 h-12 text-slate-700 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-white mb-2">No skills in portfolio yet</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">Add skills first — your resume generates from them automatically.</p>
              <Link to="/skills" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm">
                <Plus className="w-4 h-4" aria-hidden="true" />Add Skills
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[{label:'Skills', value: skills.length},{label:'Evidence', value: skills.filter(s=>s.evidence&&s.evidence.length>0).length},{label:'RCT done', value: skills.filter(s=>s.rct_node_id).length}].map(stat => (
                  <div key={stat.label} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              {Object.entries(byDomain).map(([domain, ds]) => (
                <div key={domain} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 sm:p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-400" aria-hidden="true" />{domain}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ds.map(skill => (
                      <Link key={skill.id} to={'/learn?node=' + encodeURIComponent(skill.name)}
                        aria-label={'Open ' + skill.name + ' training in RCT engine (' + skill.level + ')'}
                        className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:ring-2 hover:ring-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 ' + (LEVEL_COLORS[skill.level] || 'text-slate-400 bg-slate-800 border border-slate-700')}>
                        {skill.name}<ExternalLink className="w-3 h-3 opacity-50" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-3">Click any skill to open its training node</p>
                </div>
              ))}
              {skills.filter(s => s.evidence && s.evidence.length > 0).length > 0 && (
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 sm:p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Evidence Highlights</h3>
                  <div className="space-y-3">
                    {skills.filter(s => s.evidence && s.evidence.length > 0).slice(0, 6).map(skill => (
                      <div key={skill.id} className="flex flex-col sm:flex-row sm:gap-3">
                        <Link to={'/learn?node=' + encodeURIComponent(skill.name)}
                          aria-label={'Open ' + skill.name + ' training'}
                          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 sm:whitespace-nowrap focus:outline-none focus:underline">
                          {skill.name}<ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </Link>
                        <span className={'text-xs px-2 py-0.5 rounded-full self-start ' + (LEVEL_COLORS[skill.level] || '')}>{skill.level}</span>
                        <p className="text-sm text-slate-400 flex-1 mt-1 sm:mt-0">{skill.evidence}</p>
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
