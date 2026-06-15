import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabase';
import AppShell from '../components/ui/AppShell';
import {
  Search, ChevronLeft, AlertCircle, CheckCircle,
  XCircle, PlusCircle, BookOpen, TrendingUp, Zap
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  domain?: string;
}

interface GapResult {
  skill: string;
  inPortfolio: boolean;
  witnessed: boolean;
  portfolioId?: string;
}

// Common tech skill keywords to look for in JD text
const SKILL_PATTERNS = [
  // AI/ML
  'machine learning', 'deep learning', 'llm', 'large language model', 'rag', 'vector database',
  'langchain', 'openai', 'anthropic', 'ai governance', 'mlops', 'model deployment',
  // Cloud
  'aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker', 'terraform', 'ansible',
  'cloudformation', 'eks', 'aks', 'lambda', 'serverless', 'microservices',
  // Security/IAM
  'vault', 'hashicorp', 'pki', 'oauth2', 'oidc', 'jwt', 'saml', 'okta', 'iam',
  'zero trust', 'secrets management', 'rbac', 'identity', 'sso',
  // Integration/Data
  'kafka', 'event-driven', 'api gateway', 'graphql', 'rest api', 'grpc',
  'postgresql', 'mongodb', 'redis', 'elasticsearch', 'supabase',
  // Languages/Frameworks
  'java', 'spring boot', 'python', 'typescript', 'react', 'node.js', 'go', 'rust',
  // Architecture
  'solutions architect', 'enterprise architect', 'platform engineering', 'domain-driven',
  'togaf', 'zachman', 'c4 model', 'hexagonal', 'event sourcing', 'cqrs',
  // Compliance
  'sox', 'hipaa', 'pci-dss', 'gdpr', 'fedramp', 'nist', 'iso 27001', 'soc 2',
  'audit trail', 'compliance', 'governance',
  // Soft skills / leadership
  'technical leadership', 'staff engineer', 'principal engineer', 'architecture review',
  'cross-functional', 'stakeholder management', 'technical strategy',
];

function extractSkillsFromJD(jd: string): string[] {
  const lower = jd.toLowerCase();
  const found = new Set<string>();
  for (const pattern of SKILL_PATTERNS) {
    if (lower.includes(pattern)) {
      found.add(pattern);
    }
  }
  // Also extract capitalized terms (acronyms and proper nouns)
  const words = jd.match(/\b[A-Z][A-Z0-9]{2,}\b/g) || [];
  for (const w of words) {
    if (!['THE', 'AND', 'OR', 'FOR', 'NOT', 'ARE', 'YOU', 'OUR', 'WILL', 'WITH', 'HAVE', 'THIS', 'FROM'].includes(w)) {
      found.add(w.toLowerCase());
    }
  }
  return Array.from(found).sort();
}

export default function GapAnalyzer() {
  useDocumentTitle('JD Gap Analyzer · WitnessSkills');
  const { user } = useAuth();

  const [jdText, setJdText] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<GapResult[] | null>(null);
  const [addingToLearn, setAddingToLearn] = useState<Set<string>>(new Set());
  const [addedToLearn, setAddedToLearn] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadSkills();
  }, [user]);

  async function loadSkills() {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('skills')
        .select('id, name, domain')
        .eq('user_id', user!.id);
      if (err) throw err;
      setSkills(data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }

  function analyze() {
    if (!jdText.trim()) return;
    setAnalyzing(true);

    const jdSkills = extractSkillsFromJD(jdText);
    const portfolioNames = skills.map(s => s.name.toLowerCase());

    const gapResults: GapResult[] = jdSkills.map(skill => {
      const match = skills.find(s => s.name.toLowerCase().includes(skill) || skill.includes(s.name.toLowerCase()));
      return {
        skill,
        inPortfolio: !!match,
        witnessed: !!match,
        portfolioId: match?.id,
      };
    });

    setResults(gapResults);
    setAnalyzing(false);
  }

  async function addToLearnQueue(skillName: string) {
    if (!user) return;
    setAddingToLearn(prev => new Set(prev).add(skillName));
    try {
      // Add to skill_gaps table
      await supabase.from('skill_gaps').upsert({
        user_id: user.id,
        skill_name: skillName,
        source: 'job_market',
        frequency: 1,
        added_to_learn: true,
      }, { onConflict: 'user_id,skill_name' });

      // Also add to skills table if not present
      const existing = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
      if (!existing) {
        await supabase.from('skills').insert({
          user_id: user.id,
          name: skillName,
          source: 'job_market',
          level: 'beginner',
        });
      }

      setAddedToLearn(prev => new Set(prev).add(skillName));
      await loadSkills();
    } catch (e) {
      console.error('Failed to add skill:', e);
    } finally {
      setAddingToLearn(prev => {
        const next = new Set(prev);
        next.delete(skillName);
        return next;
      });
    }
  }

  const gaps = results?.filter(r => !r.inPortfolio) || [];
  const covered = results?.filter(r => r.inPortfolio) || [];
  const coverageRate = results && results.length > 0
    ? Math.round((covered.length / results.length) * 100)
    : 0;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/apply" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">JD Gap Analyzer</h1>
              <p className="text-slate-400 text-sm">Paste a job description — find your skill gaps and close them</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* JD Input */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
          <label className="block text-white font-medium mb-3">Job Description</label>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={10}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">{jdText.length} characters · {loading ? 'Loading portfolio...' : `${skills.length} skills in portfolio`}</span>
            <button
              onClick={analyze}
              disabled={!jdText.trim() || analyzing || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 rounded-xl text-white font-medium text-sm transition-all shadow-lg shadow-violet-900/30"
            >
              <Zap className="w-4 h-4" />
              {analyzing ? 'Analyzing...' : 'Analyze JD'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-5">

            {/* Coverage summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-white mb-1">{results.length}</div>
                <div className="text-slate-400 text-sm">Skills detected</div>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">{covered.length}</div>
                <div className="text-slate-400 text-sm">In your portfolio</div>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-center">
                <div className={`text-3xl font-bold mb-1 ${gaps.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{gaps.length}</div>
                <div className="text-slate-400 text-sm">Gaps to close</div>
              </div>
            </div>

            {/* Coverage bar */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  Portfolio coverage
                </span>
                <span className={`text-lg font-bold ${coverageRate >= 70 ? 'text-emerald-400' : coverageRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {coverageRate}%
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${coverageRate >= 70 ? 'bg-emerald-500' : coverageRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${coverageRate}%` }}
                />
              </div>
              {coverageRate >= 70 && (
                <p className="text-emerald-400 text-xs mt-2">Strong match — you cover most required skills.</p>
              )}
              {coverageRate < 70 && coverageRate >= 50 && (
                <p className="text-amber-400 text-xs mt-2">Partial match — consider training on the gaps before applying.</p>
              )}
              {coverageRate < 50 && (
                <p className="text-red-400 text-xs mt-2">Low coverage — significant skill development needed for this role.</p>
              )}
            </div>

            {/* Gaps to close */}
            {gaps.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-slate-700/50">
                  <XCircle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-white font-medium">Gaps to close ({gaps.length})</h3>
                  <span className="ml-auto text-xs text-slate-400">Click "+ Add to Learn" to queue for training</span>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {gaps.map(gap => (
                    <div key={gap.skill} className="flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="text-white text-sm capitalize">{gap.skill}</span>
                      </div>
                      {addedToLearn.has(gap.skill) ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Added to skills
                        </div>
                      ) : (
                        <button
                          onClick={() => addToLearnQueue(gap.skill)}
                          disabled={addingToLearn.has(gap.skill)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-300 hover:text-violet-200 text-xs transition-all disabled:opacity-50"
                        >
                          <PlusCircle className="w-3 h-3" />
                          {addingToLearn.has(gap.skill) ? 'Adding...' : 'Add to skills'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Covered skills */}
            {covered.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-slate-700/50">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-white font-medium">Already in your portfolio ({covered.length})</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {covered.map(c => (
                    <span key={c.skill}
                      className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-xs capitalize flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {c.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {gaps.length > 0 && (
              <div className="flex items-center justify-between p-5 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-violet-400" />
                  <div>
                    <div className="text-white text-sm font-medium">Ready to train on these gaps?</div>
                    <div className="text-slate-400 text-xs mt-0.5">Added skills will appear in your RCT training queue</div>
                  </div>
                </div>
                <Link to="/learn"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-sm font-medium transition-all">
                  Go to Learn →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
  }
