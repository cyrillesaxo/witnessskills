import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, FileText, Copy, Download, Printer, Loader2,
  AlertCircle, ExternalLink, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import OntologyGraphModal from '../components/ui/OntologyGraphModal';
import { supabase } from '../lib/supabase';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  intermediate: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  advanced: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  expert: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

interface Skill {
  id: string;
  name: string;
  level: string;
  domain: string | null;
  evidence: string | null;
  tags: string[] | null;
}

export default function ResumeBuilder() {
  useDocumentTitle('Resume Builder');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [graphSkill, setGraphSkill] = useState<{ name: string; level: string } | null>(null);
  const [resumeVersion, setResumeVersion] = useState<'A' | 'B'>('A');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadSkills();
  }, [user, navigate]);

  async function loadSkills() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('skills')
        .select('id, name, level, domain, evidence, tags')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setSkills((data ?? []) as Skill[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function buildResumeText(version: 'A' | 'B' = resumeVersion) {
    if (version === 'A') {
      // Version A: ATS-optimised (keyword-dense, scannable)
      const lines: string[] = [
        'SKILLS PORTFOLIO — ATS VERSION',
        '================================',
        '',
        'CORE TECHNICAL SKILLS',
        skills.map(s => s.name.toUpperCase() + ' (' + s.level + ')').join(' | '),
        '',
        'SKILLS BY DOMAIN',
        '─────────────────',
      ];
      const byDomain: Record<string, Skill[]> = {};
      skills.forEach(s => {
        const domain = s.domain || 'General';
        if (!byDomain[domain]) byDomain[domain] = [];
        byDomain[domain].push(s);
      });
      Object.entries(byDomain).forEach(([domain, domainSkills]) => {
        lines.push('');
        lines.push(domain.toUpperCase() + ':');
        domainSkills.forEach(s => {
          lines.push('• ' + s.name + ' [' + s.level + ']');
          if (s.tags?.length) lines.push('  Keywords: ' + s.tags.join(', '));
        });
      });
      return lines.join('\n');
    } else {
      // Version B: Human/Networking — narrative with evidence
      const lines: string[] = [
        'SKILLS PORTFOLIO — HUMAN / NETWORKING VERSION',
        '===============================================',
        '',
        'SUMMARY',
        '─────────',
        'A practitioner with depth in ' + [...new Set(skills.map(s => s.domain || 'Technology').filter(Boolean))].slice(0, 3).join(', ') + '.',
        '',
        'SKILL NARRATIVES',
        '─────────────────',
      ];
      const byDomain: Record<string, Skill[]> = {};
      skills.forEach(s => {
        const domain = s.domain || 'General';
        if (!byDomain[domain]) byDomain[domain] = [];
        byDomain[domain].push(s);
      });
      Object.entries(byDomain).forEach(([domain, domainSkills]) => {
        lines.push('');
        lines.push(domain + ':');
        domainSkills.forEach(s => {
          lines.push('');
          lines.push('  ' + s.name + ' — ' + s.level.charAt(0).toUpperCase() + s.level.slice(1));
          if (s.evidence) lines.push('  ' + s.evidence);
          if (s.tags?.length) lines.push('  Areas: ' + s.tags.join(' · '));
        });
      });
      return lines.join('\n');
    }
  }

  function handleCopy() {
    const text = buildResumeText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadTxt() {
    const text = buildResumeText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skills-resume.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintPDF() {
    const style = document.createElement('style');
    style.id = 'print-override';
    style.textContent = `
      @media print {
        body > *:not(#resume-print-area) { display: none !important; }
        #resume-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; background: white; color: black; padding: 2rem; font-family: Georgia, serif; }
      }
    `;
    document.head.appendChild(style);
    const printEl = document.getElementById('resume-print-area');
    if (printEl) printEl.style.display = 'block';
    window.print();
    setTimeout(() => {
      style.remove();
      if (printEl) printEl.style.display = 'none';
    }, 500);
  }

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  if (!user) return null;

  const withEvidence = skills.filter(s => s.evidence);
  const byDomain: Record<string, Skill[]> = {};
  skills.forEach(s => {
    const d = s.domain ?? 'General';
    if (!byDomain[d]) byDomain[d] = [];
    byDomain[d].push(s);
  });

  return (
    <>
      <AppShell
        trail={[{ label: 'Dashboard', href: '/' }, { label: 'Apply', href: '/apply' }, { label: 'Resume Builder' }]}
        onSignOut={handleSignOut}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleCopy} aria-label="Copy resume text"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700 transition-colors">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleDownloadTxt} aria-label="Download as .txt"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700 transition-colors">
              <Download className="w-3.5 h-3.5" />
              .txt
            </button>
            <button onClick={handlePrintPDF} aria-label="Save as PDF via print dialog"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-500/30 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/40 transition-colors">
              <Printer className="w-3.5 h-3.5" />
              Save as PDF
            </button>
          </div>
        }
      >
        <div className="space-y-6">

          {/* Stats bar */}
          <div className="flex items-center gap-4 mb-6 text-xs text-slate-500 flex-wrap">
            <span>Skills tracked: <strong className="text-slate-300">{skills.length}</strong></span>
            <span>With evidence: <strong className="text-slate-300">{withEvidence.length}</strong></span>
            <span>Domains: <strong className="text-slate-300">{Object.keys(byDomain).length}</strong></span>
          </div>

          {/* Version selector */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setResumeVersion('A')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                resumeVersion === 'A'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-transparent border-slate-600 text-slate-400 hover:text-white hover:border-slate-400'
              }`}
            >
              Version A — ATS
            </button>
            <button
              onClick={() => setResumeVersion('B')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                resumeVersion === 'B'
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-transparent border-slate-600 text-slate-400 hover:text-white hover:border-slate-400'
              }`}
            >
              Version B — Human / Networking
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && skills.length === 0 && (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 font-semibold mb-1">No skills to show</h3>
              <p className="text-slate-500 text-sm mb-5">Add skills to your portfolio first, then build your resume.</p>
              <Link to="/skills"
                className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors">
                Go to Skills Portfolio
              </Link>
            </div>
          )}

          {/* Resume preview */}
          {!loading && skills.length > 0 && (
            <div className="space-y-6" ref={printRef} id="resume-content">

              {/* Core skills section */}
              <section className="p-5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Core Technical Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <div key={skill.id} className="flex items-center gap-1">
                      <Link
                        to={'/learn?node=' + encodeURIComponent(skill.name)}
                        title={'Train ' + skill.name + ' in RCT graph'}
                        aria-label={'Train ' + skill.name + ' in RCT learning graph'}
                        className={'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:scale-105 ' + (LEVEL_COLORS[skill.level] ?? LEVEL_COLORS.intermediate)}
                      >
                        {skill.name}
                        <ExternalLink className="w-3 h-3 opacity-50" aria-hidden="true" />
                      </Link>
                      {/* Brain icon → opens OntologyGraphModal */}
                      <button
                        onClick={() => setGraphSkill({ name: skill.name, level: skill.level })}
                        title={'Open RCT ontology graph for ' + skill.name}
                        aria-label={'Open RCT ontology graph for ' + skill.name}
                        className="p-1 rounded-full text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors opacity-50 hover:opacity-100"
                      >
                        <Brain className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* By-domain sections */}
              {Object.entries(byDomain).map(([domain, list]) => (
                <section key={domain} className="p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{domain}</h2>
                  <div className="space-y-3">
                    {list.map(skill => (
                      <div key={skill.id} className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={'/learn?node=' + encodeURIComponent(skill.name)}
                              aria-label={'Open ' + skill.name + ' in RCT graph'}
                              className="font-semibold text-sm text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1"
                            >
                              {skill.name}
                              <ExternalLink className="w-3 h-3 opacity-40" aria-hidden="true" />
                            </Link>
                            <span className={'text-xs px-1.5 py-0.5 rounded-full border ' + (LEVEL_COLORS[skill.level] ?? LEVEL_COLORS.intermediate)}>
                              {skill.level}
                            </span>
                            {/* Brain icon */}
                            <button
                              onClick={() => setGraphSkill({ name: skill.name, level: skill.level })}
                              title={'Open RCT ontology graph for ' + skill.name}
                              aria-label={'Open RCT ontology for ' + skill.name}
                              className="p-0.5 text-violet-400 hover:text-violet-300 opacity-50 hover:opacity-100 transition-opacity"
                            >
                              <Brain className="w-3 h-3" />
                            </button>
                          </div>
                          {skill.evidence && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{skill.evidence}</p>
                          )}
                          {skill.tags && skill.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {skill.tags.map(tag => (
                                <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </AppShell>

      {/* Hidden print area */}
      <div id="resume-print-area" style={{ display: 'none' }}>
        <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Skills Portfolio</h1>
        <h2 style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Core Technical Skills</h2>
        <p>{skills.map(s => s.name + ' (' + s.level + ')').join(' | ')}</p>
        <hr style={{ margin: '16px 0' }} />
        {Object.entries(byDomain).map(([domain, list]) => (
          <div key={domain} style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>{domain}</h3>
            {list.map(s => (
              <div key={s.id} style={{ marginBottom: 6 }}>
                <strong>{s.name}</strong> [{s.level}]
                {s.evidence && <div style={{ color: '#555', fontSize: 11 }}>{s.evidence}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>

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
