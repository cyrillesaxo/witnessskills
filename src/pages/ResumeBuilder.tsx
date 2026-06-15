import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import {
  FileText, Copy, Download, ChevronLeft, AlertCircle,
  CheckCircle, Star, Lock, Sparkles
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  domain?: string;
  level?: string;
  evidence_count?: number;
  source?: string;
}

const RESUME_A = (skills: Skill[], name: string) => `
CYRILLE ELOUNDOU
cyrillesaxo@gmail.com | +1-943-240-6807 | linkedin.com/in/cyrille-eloundou

SUMMARY
Principal Enterprise AI / Platform Architect with 17+ years of experience designing secure cloud,
identity, integration, and AI-governance platforms for regulated enterprises. Hands-on background
across Vault/PKI/secrets management, Java/Spring microservices, Kafka/event-driven integration,
Terraform/Ansible automation, RAG/NLP governance, and compliance-grade audit trails.

SELECTED ARCHITECTURE DECISIONS
- Vault onboarding automation: Reduced secrets-onboarding from 6 weeks to 5 days via Terraform +
  Ansible + Java pipeline with full approval-gate auditability. (Bank of America, 2024-present)
- AI validation controls: Designed human-gated AI validation for legal-AI production workflows,
  0.0% observed false-allow rate across 847 production episodes. (APX / DODO LLC, 2024-present)
- OAuth2/JWT migration: Eliminated expired certificate exposure across production financial services
  via Okta integration. (FINEOS / Insurance, 2020-2022)
- T-Mobile billing migration: Zero-downtime Amdocs NGBS migration for 84M subscribers,
  achieving 99.97% billing accuracy post-migration. (T-Mobile / Amdocs, 2017-2020)

WITNESSED SKILLS
${skills.filter(s => (s.evidence_count ?? 0) > 0).map(s =>
  `${s.name}${s.domain ? ' (' + s.domain + ')' : ''} — ${s.evidence_count} evidence item(s)`
).join('\n')}

CORE TECHNICAL SKILLS
Vault/PKI/Secrets Management | Java/Spring Boot | Kafka/Event-Driven | Terraform/Ansible
RAG/NLP AI Governance | OAuth2/JWT/Okta/IAM | Kubernetes/Docker | AWS/Azure/GCP
Supabase/PostgreSQL | React/TypeScript | Python | Compliance & Audit (SOX, HIPAA, PCI-DSS)

EXPERIENCE
Senior Architect, Platform Engineering — Bank of America | Aug 2024–Present
Principal AI Governance Architect — DODO LLC / APX | Apr 2024–Present (Independent R&D)
Principal Solutions Architect — Cognizant | 2022–2024
Principal Architect — FINEOS (Insurance SaaS) | 2020–2022
Senior Solutions Architect — T-Mobile / Amdocs | 2017–2020

EDUCATION
Wroclaw University of Science and Technology | MS, Computer Science

PATENTS & RESEARCH
APX Governance Framework — Provisional patent filed, 2024
`.trim();

const RESUME_B = (skills: Skill[], name: string) => `
CYRILLE ELOUNDOU
Principal Enterprise AI & Platform Architect
${name ? name : 'cyrillesaxo@gmail.com'} | +1-943-240-6807
linkedin.com/in/cyrille-eloundou | x-dodo.com

─────────────────────────────────────────────────
WHAT I'VE DESIGNED AND DELIVERED
─────────────────────────────────────────────────

Enterprise AI Architect with 17+ years turning complex regulated environments into governed,
automated, AI-enabled platforms. I don't just advise — I design the architecture, write the
Terraform, build the pipelines, and own the audit trail.

SELECTED ARCHITECTURE DECISIONS

1. Vault Secrets Onboarding Pipeline (Bank of America, 2024–present)
   Problem: New services taking 6 weeks to onboard secrets with manual approvals.
   What I designed: Terraform + Ansible + Java automation pipeline with policy-gated workflow
   and full auditability. Result: 6 weeks → 5 days, zero policy violations.

2. AI Validation Controls for Legal-AI (APX / DODO LLC, 2024–present)
   Problem: Legal teams needed AI assistance without risk of unreviewed outputs reaching courts.
   What I designed: Human-gated validation layer separating low-risk from mandatory-review paths.
   Result: 0.0% false-allow rate across 847 production episodes.

3. OAuth2/JWT Platform Migration (FINEOS, 2020–2022)
   Eliminated expired certificate exposure and unsecured WebSphere nodes across production
   insurance platform via Okta integration.

4. T-Mobile NGBS Billing Migration (2017–2020)
   Zero-downtime Amdocs migration for 84M subscribers. 99.97% billing accuracy post-migration.

─────────────────────────────────────────────────
MY WITNESSED SKILLS PORTFOLIO
─────────────────────────────────────────────────
${skills.filter(s => (s.evidence_count ?? 0) > 0).map(s =>
  `✓ ${s.name}${s.domain ? ' · ' + s.domain : ''} (${s.evidence_count} evidenced)`
).join('\n')}

─────────────────────────────────────────────────
EXPERIENCE SNAPSHOT
─────────────────────────────────────────────────
Bank of America — Senior Architect, Platform Engineering (Aug 2024–Present)
DODO LLC / APX — Principal AI Governance Architect (Apr 2024–Present, Independent R&D)
Cognizant — Principal Solutions Architect (2022–2024)
FINEOS — Principal Architect, Insurance SaaS (2020–2022)
T-Mobile / Amdocs — Senior Solutions Architect (2017–2020)
ADP, WIPRO/State Street, TCS/Barclays, Siemens — Prior consulting (2009–2020)

Education: Wroclaw University of Science and Technology, MS Computer Science
Patents: APX Governance Framework — Provisional patent filed, 2024
Portfolio: linkedin.com/in/cyrille-eloundou | x-dodo.com
`.trim();

export default function ResumeBuilder() {
  useDocumentTitle('Résumé Builder · WitnessSkills');
  const { user } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<'A' | 'B'>('A');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSkills();
  }, [user]);

  async function loadSkills() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('skills')
        .select('id, name, domain, level, source')
        .eq('user_id', user!.id)
        .order('name');
      if (err) throw err;
      setSkills(data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }

  const witnessedSkills = skills.filter(s => (s.evidence_count ?? 0) > 0);
  const unwithessedSkills = skills.filter(s => !s.evidence_count);

  const resumeText = version === 'A'
    ? RESUME_A(skills, user?.email || '')
    : RESUME_B(skills, user?.email || '');

  function handleCopy() {
    navigator.clipboard.writeText(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cyrille_Eloundou_Resume_v${version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/apply" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Résumé Builder</h1>
              <p className="text-slate-400 text-sm">Generated from your witnessed skills portfolio</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Controls + Skill status */}
          <div className="space-y-5">

            {/* Version selector */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Version
              </h3>
              <div className="space-y-3">
                {(['A', 'B'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      version === v
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${version === v ? 'text-violet-300' : 'text-white'}`}>
                        Version {v}
                      </span>
                      <span className="text-xs text-slate-400">
                        {v === 'A' ? '— ATS / Job board' : '— Human / Networking'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {v === 'A'
                        ? 'Plain text, one-column, ATS-optimized. Use for Workday, Greenhouse, LinkedIn Easy Apply.'
                        : 'Narrative format with architecture story. Use for LinkedIn DM, recruiter email, referral intro.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Skills status */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-white font-medium mb-4">Skill Coverage</h3>
              {loading ? (
                <div className="text-slate-400 text-sm">Loading skills...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">Witnessed skills</span>
                    <span className="text-emerald-400 font-bold">{witnessedSkills.length}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm">Unwitnessed</span>
                    <span className="text-amber-400 font-bold">{unwithessedSkills.length}</span>
                  </div>
                  {unwithessedSkills.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <div className="flex items-start gap-2 text-xs text-amber-300">
                        <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{unwithessedSkills.length} skills have no evidence yet. Add evidence in My Skills to strengthen your résumé.</span>
                      </div>
                    </div>
                  )}
                  {skills.length === 0 && (
                    <div className="p-3 bg-slate-700/30 rounded-xl text-xs text-slate-400">
                      No skills tracked yet. Go to My Skills to add your first skill with evidence.
                    </div>
                  )}
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {skills.slice(0, 15).map(skill => (
                      <div key={skill.id} className="flex items-center gap-2 text-xs">
                        {(skill.evidence_count ?? 0) > 0
                          ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          : <Star className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        }
                        <span className={`${(skill.evidence_count ?? 0) > 0 ? 'text-white' : 'text-slate-400'} truncate`}>
                          {skill.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Resume preview + actions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Preview — Version {version}</h3>
              <div className="flex gap-2">
                <button onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/60 rounded-xl text-slate-300 hover:text-white text-sm transition-all">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium text-sm transition-all">
                  <Download className="w-4 h-4" />
                  Download .txt
                </button>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[600px]">
              {resumeText}
            </div>

            <div className="p-4 bg-slate-800/30 border border-slate-700/40 rounded-xl">
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-violet-400 font-medium">Version A →</span>
                  <span>LinkedIn Easy Apply, Workday, Greenhouse, Lever, Indeed, Dice</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-violet-400 font-medium">Version B →</span>
                  <span>LinkedIn DM, recruiter email, hiring manager outreach, referral intro, post-call follow-up</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
  }
