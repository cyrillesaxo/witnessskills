import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Brain, AlertCircle, CheckCircle, XCircle, Zap, Plus } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import BackgroundGlow from '../components/ui/BackgroundGlow';

interface Skill {
  id: string;
  name: string;
  level: string;
}

interface GapResult {
  skill: string;
  inPortfolio: boolean;
  portfolioLevel?: string;
  isGap: boolean;
}

export default function GapAnalyzer() {
  useDocumentTitle('Gap Analyzer');
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [jdText, setJdText] = useState('');
  const [results, setResults] = useState<GapResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToQueue, setAddedToQueue] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadSkills();
  }, [user]);

  async function loadSkills() {
    try {
      setLoadingSkills(true);
      const { data, error: err } = await supabase
        .from('skills')
        .select('id, name, level')
        .eq('user_id', user!.id);
      if (err) throw new Error(err.message);
      setSkills(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingSkills(false);
    }
  }

  function extractSkillsFromJD(text: string): string[] {
    // Keyword extraction: look for tech terms, frameworks, tools
    const techPatterns = [
      /\b(Python|JavaScript|TypeScript|Java|Go|Rust|C\+\+|C#|Ruby|PHP|Swift|Kotlin)\b/gi,
      /\b(React|Vue|Angular|Next\.js|Node\.js|Express|Django|FastAPI|Spring|Rails)\b/gi,
      /\b(AWS|GCP|Azure|Kubernetes|Docker|Terraform|Ansible|Jenkins|GitHub Actions)\b/gi,
      /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|Kafka|RabbitMQ|Cassandra)\b/gi,
      /\b(Machine Learning|Deep Learning|NLP|LLM|GPT|RAG|Vector|Embedding|Fine-tuning)\b/gi,
      /\b(Microservices|REST|GraphQL|gRPC|API|OAuth|JWT|SAML|SSO|PKI|Vault)\b/gi,
      /\b(Agile|Scrum|Kanban|CI\/CD|DevOps|SRE|Platform Engineering|MLOps)\b/gi,
      /\b(React Native|Flutter|iOS|Android|Mobile|PWA)\b/gi,
      /\b(Spark|Hadoop|Databricks|Snowflake|dbt|Airflow|ETL|Data Pipeline)\b/gi,
      /\b(Prometheus|Grafana|Datadog|OpenTelemetry|Jaeger|Zipkin)\b/gi,
      /\b(Linux|Unix|Bash|Shell|PowerShell|Windows Server)\b/gi,
      /\b(Git|SVN|Mercurial|CI|CD|GitOps|ArgoCD|FluxCD)\b/gi,
    ];

    const found = new Set<string>();
    for (const pattern of techPatterns) {
      const matches = text.match(pattern) || [];
      for (const m of matches) {
        found.add(m.trim());
      }
    }

    // Also extract capitalized multi-word phrases (2-3 words)
    const phraseMatches = text.match(/\b[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+){1,2}\b/g) || [];
    for (const phrase of phraseMatches) {
      if (phrase.length >= 4 && phrase.length <= 40) {
        found.add(phrase);
      }
    }

    return Array.from(found).slice(0, 30);
  }

  function analyzeGaps() {
    if (!jdText.trim()) return;
    setAnalyzing(true);
    setError(null);

    try {
      const jdSkills = extractSkillsFromJD(jdText);
      const portfolioNames = new Set(skills.map(s => s.name.toLowerCase()));

      const gapResults: GapResult[] = jdSkills.map(jdSkill => {
        const match = skills.find(s =>
          s.name.toLowerCase() === jdSkill.toLowerCase() ||
          s.name.toLowerCase().includes(jdSkill.toLowerCase()) ||
          jdSkill.toLowerCase().includes(s.name.toLowerCase())
        );
        return {
          skill: jdSkill,
          inPortfolio: !!match,
          portfolioLevel: match?.level,
          isGap: !match,
        };
      });

      // Sort: gaps first, then matched
      gapResults.sort((a, b) => {
        if (a.isGap && !b.isGap) return -1;
        if (!a.isGap && b.isGap) return 1;
        return 0;
      });

      setResults(gapResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function addGapToLearnQueue(skillName: string) {
    if (!user) return;
    try {
      await supabase.from('skill_gaps').upsert({
        user_id: user.id,
        skill_name: skillName,
        source: 'job_market',
        frequency: 1,
        added_to_learn: true,
      }, { onConflict: 'user_id,skill_name' });
      setAddedToQueue(prev => new Set(prev).add(skillName));
    } catch (err) {
      console.error('Failed to add to queue:', err);
    }
  }

  const gaps = results?.filter(r => r.isGap) || [];
  const matched = results?.filter(r => !r.isGap) || [];
  const coveragePercent = results && results.length > 0
    ? Math.round((matched.length / results.length) * 100)
    : 0;

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
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              JD Gap Analyzer
            </h1>
            <p className="text-slate-400 mt-1">
              Paste a job description to instantly see which skills you have and which are gaps — each gap links directly to its training node.
            </p>
          </div>

          {/* JD Input */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
            <label className="text-sm font-medium text-slate-300">Job Description</label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here — requirements, qualifications, tech stack..."
              className="w-full h-44 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {loadingSkills ? 'Loading portfolio...' : skills.length + ' skills in your portfolio'}
              </p>
              <button
                onClick={analyzeGaps}
                disabled={!jdText.trim() || analyzing || loadingSkills}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Zap className="w-4 h-4" />
                {analyzing ? 'Analyzing...' : 'Analyze Gaps'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Coverage summary */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">JD Coverage</h2>
                  <span className={'text-2xl font-bold ' + (coveragePercent >= 70 ? 'text-emerald-400' : coveragePercent >= 40 ? 'text-amber-400' : 'text-red-400')}>
                    {coveragePercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                  <div
                    className={'h-2 rounded-full transition-all ' + (coveragePercent >= 70 ? 'bg-emerald-500' : coveragePercent >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{width: coveragePercent + '%'}}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-white">{results.length}</p>
                    <p className="text-xs text-slate-500">Skills detected</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-400">{matched.length}</p>
                    <p className="text-xs text-slate-500">In portfolio</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-400">{gaps.length}</p>
                    <p className="text-xs text-slate-500">Gaps to fill</p>
                  </div>
                </div>
              </div>

              {/* Gaps — each links to Learn */}
              {gaps.length > 0 && (
                <div className="bg-slate-900/50 border border-red-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    Gaps ({gaps.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    These skills are in the JD but not in your portfolio. Click Train to open the RCT engine for that skill.
                  </p>
                  <div className="space-y-2">
                    {gaps.map(gap => (
                      <div key={gap.skill} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-white">{gap.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {addedToQueue.has(gap.skill) ? (
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Added to queue
                            </span>
                          ) : (
                            <button
                              onClick={() => addGapToLearnQueue(gap.skill)}
                              className="text-xs flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Queue
                            </button>
                          )}
                          <Link
                            to={'/learn?node=' + encodeURIComponent(gap.skill)}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors font-medium"
                          >
                            <Brain className="w-3 h-3" /> Train
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched — each links to Learn */}
              {matched.length > 0 && (
                <div className="bg-slate-900/50 border border-emerald-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    In Portfolio ({matched.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {matched.map(m => (
                      <Link
                        key={m.skill}
                        to={'/learn?node=' + encodeURIComponent(m.skill)}
                        title={'Review training: ' + m.skill}
                        className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:ring-2 hover:ring-white/10 ' + (LEVEL_COLORS[m.portfolioLevel || ''] || 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20')}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {m.skill}
                        {m.portfolioLevel && <span className="opacity-60">({m.portfolioLevel})</span>}
                      </Link>
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
