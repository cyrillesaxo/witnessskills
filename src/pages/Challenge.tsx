import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AppShell from '../components/ui/AppShell';
import { supabase } from '../lib/supabase';
import {
  getPublishedPacks, getNodesByPack, getMutationsByPack,
  getMisconceptionsByPack, selectNextChallenge, createAttempt,
  updateAttemptVerdict, createSourceArtifact, classifySourceType,
  emitFieldTestEvent,
} from '../lib/pft-queries';
import { evaluateAttempt, calculateProofReadiness, generateActivationPlan } from '../lib/pft-engine';
import type {
  DomainPack, Challenge as ChallengeType, AttemptFeedback,
  SourceArtifact, MechanismNode, AntiwitnessMutation, MisconceptionSignature,
} from '../lib/pft-types';
import {
  Brain, ChevronRight, RotateCcw, CheckCircle, AlertCircle,
  XCircle, Clock, ArrowLeft, Plus, Zap, FileText, BookOpen,
  Target, TrendingUp, Award,
} from 'lucide-react';

// ============================================================
// PHASE TYPES
// ============================================================

type Phase =
  | 'select-pack'
  | 'add-source'
  | 'confirm-plan'
  | 'challenge'
  | 'feedback'
  | 'complete';

const VERDICT_CONFIG = {
  mechanism_preserved: { label: 'Strong', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', Icon: CheckCircle },
  partially_preserved: { label: 'Partial', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', Icon: AlertCircle },
  mechanism_violated: { label: 'Needs practice', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', Icon: XCircle },
  insufficient_evidence: { label: 'Not enough detail', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', Icon: AlertCircle },
} as const;

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Challenge() {
  useDocumentTitle('Challenge');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packIdParam = searchParams.get('pack');

  const [phase, setPhase] = useState<Phase>('select-pack');
  const [packs, setPacks] = useState<DomainPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<DomainPack | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeType | null>(null);
  const [answer, setAnswer] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceGoal, setSourceGoal] = useState('create proof');
  const [sourceArtifact, setSourceArtifact] = useState<SourceArtifact | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load packs on mount
  useEffect(() => {
    getPublishedPacks().then(setPacks).catch(console.error);
  }, []);

  // Auto-select pack from URL param
  useEffect(() => {
    if (packIdParam && packs.length) {
      const pack = packs.find(p => p.id === packIdParam);
      if (pack) { setSelectedPack(pack); setPhase('challenge'); loadChallenge(pack); }
    }
  }, [packIdParam, packs]);

  const loadChallenge = useCallback(async (pack: DomainPack) => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const challenge = await selectNextChallenge(user.id, pack.id);
      if (challenge) {
        setCurrentChallenge(challenge);
        setAnswer(''); setAssumptions(''); setFeedback(null);
        setPhase('challenge');
      } else {
        setError('No more challenges available for this pack. Come back for retrieval practice!');
      }
    } catch (e) {
      setError('Failed to load challenge.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handlePackSelect = (pack: DomainPack) => {
    setSelectedPack(pack);
    setPhase('add-source');
  };

  const handleSkipSource = async () => {
    if (!selectedPack) return;
    await loadChallenge(selectedPack);
  };

  const handleSourceSubmit = async () => {
    if (!user || !selectedPack) return;
    setLoading(true);
    try {
      const classification = classifySourceType(sourceText + ' ' + sourceTitle, sourceUrl);
      const artifact = await createSourceArtifact({
        user_id: user.id,
        workspace_id: null,
        profile_mode: 'personal',
        source_type: 'manual_topic',
        title: sourceTitle || 'Unnamed source',
        raw_text: sourceText || null,
        url: sourceUrl || null,
        uploaded_file_id: null,
        user_goal: sourceGoal,
        decision_context: null,
        sensitivity: 'public',
        reuse_permission: 'this_request_only',
        suggested_pack_id: classification.suggested_pack_id,
      });
      setSourceArtifact(artifact);
      await emitFieldTestEvent('source_submitted', { pack_id: selectedPack.id, source_type: 'manual_topic' }, selectedPack.wedge_id ?? undefined, selectedPack.id);
      await loadChallenge(selectedPack);
    } catch (e) {
      setError('Failed to save source.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !currentChallenge || !answer.trim()) return;
    setLoading(true);
    try {
      const misconceptions = await getMisconceptionsByPack(currentChallenge.pack.id);
      const assumptionList = assumptions.split('\n').map(s => s.trim()).filter(Boolean);

      const attempt = await createAttempt({
        user_id: user.id,
        participant_id: null,
        verification_request_id: null,
        workspace_id: null,
        profile_mode: 'personal',
        pack_id: currentChallenge.pack.id,
        mechanism_node_id: currentChallenge.node.id,
        mutation_id: currentChallenge.mutation.id,
        source_artifact_id: sourceArtifact?.id ?? null,
        answer,
        assumptions: assumptionList,
        hints_used: [],
        verdict: null,
        mechanism_score: null,
        mutation_score: null,
        action_score: null,
        assumption_score: null,
        total_score: null,
        misconception_signature_ids: [],
        scheduled_retrieval_at: null,
      });

      const result = evaluateAttempt(answer, assumptionList, currentChallenge.node, currentChallenge.mutation, misconceptions);

      await updateAttemptVerdict(
        attempt.id,
        result.verdict,
        result.scores,
        result.detectedMisconceptionIds,
        result.feedback.scheduled_retrieval_at,
      );

      setCurrentAttemptId(attempt.id);
      setFeedback(result.feedback);
      setPhase('feedback');
      setCompletedCount(c => c + 1);

      await emitFieldTestEvent('challenge_completed', { verdict: result.verdict, pack_id: currentChallenge.pack.id }, currentChallenge.pack.wedge_id ?? undefined, currentChallenge.pack.id);
    } catch (e) {
      setError('Failed to evaluate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextChallenge = async () => {
    if (!selectedPack) return;
    await loadChallenge(selectedPack);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {selectedPack ? selectedPack.user_facing_title : 'Challenge'}
            </h1>
            {selectedPack && (
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedPack.personal_cta ?? selectedPack.target_user}
              </p>
            )}
          </div>
          {completedCount > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-sm text-indigo-600 font-medium">
              <Zap size={14} />
              <span>{completedCount} completed</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {/* Phase: Select Pack */}
        {phase === 'select-pack' && (
          <PackSelectPhase packs={packs} loading={loading} onSelect={handlePackSelect} />
        )}

        {/* Phase: Add Source */}
        {phase === 'add-source' && selectedPack && (
          <AddSourcePhase
            pack={selectedPack}
            sourceText={sourceText} setSourceText={setSourceText}
            sourceUrl={sourceUrl} setSourceUrl={setSourceUrl}
            sourceTitle={sourceTitle} setSourceTitle={setSourceTitle}
            sourceGoal={sourceGoal} setSourceGoal={setSourceGoal}
            loading={loading}
            onSubmit={handleSourceSubmit}
            onSkip={handleSkipSource}
          />
        )}

        {/* Phase: Challenge */}
        {phase === 'challenge' && currentChallenge && (
          <ChallengePhase
            challenge={currentChallenge}
            answer={answer} setAnswer={setAnswer}
            assumptions={assumptions} setAssumptions={setAssumptions}
            loading={loading}
            onSubmit={handleSubmitAnswer}
          />
        )}

        {/* Phase: Feedback */}
        {phase === 'feedback' && feedback && currentChallenge && (
          <FeedbackPhase
            feedback={feedback}
            node={currentChallenge.node}
            onNext={handleNextChallenge}
            onDone={() => navigate('/skills')}
          />
        )}

        {/* Loading state */}
        {loading && !currentChallenge && (
          <div className="text-center py-16 text-gray-400">
            <Brain size={40} className="mx-auto mb-3 animate-pulse" />
            <p className="text-sm">Loading challenge...</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function PackSelectPhase({ packs, loading, onSelect }: { packs: DomainPack[]; loading: boolean; onSelect: (p: DomainPack) => void }) {
  const icons: Record<string, typeof Brain> = {
    existing_solution_activation: BookOpen,
    ai_generated_backend_code_review: FileText,
    agentic_ai_oversight: Target,
    role_specific_ai_governance: TrendingUp,
    multi_tenant_saas_architecture: Award,
  };
  return (
    <div>
      <p className="text-sm text-gray-600 mb-6">
        Choose a challenge type. Each turns your existing learning or artifacts into active proof.
      </p>
      {!loading && packs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-5">
            <span className="text-3xl">🏆</span>
          </div>
          <h3 className="text-slate-200 font-semibold text-lg mb-2">No challenges yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-6">Challenges are unlocked as you progress through trainings in the Learn tab. Complete at least one training node to get started.</p>
          <a href="/learn" className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors">
            Go to Learn →
          </a>
        </div>
      )}
      <div className="grid gap-4">
        {packs.map(pack => {
          const Icon = icons[pack.promoted_field_test] ?? Brain;
          return (
            <button
              key={pack.id}
              onClick={() => onSelect(pack)}
              className="w-full text-left p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{pack.user_facing_title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{pack.personal_cta ?? pack.target_user}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{pack.estimated_minutes} min</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 mt-1 flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddSourcePhase({
  pack, sourceText, setSourceText, sourceUrl, setSourceUrl,
  sourceTitle, setSourceTitle, sourceGoal, setSourceGoal,
  loading, onSubmit, onSkip,
}: {
  pack: DomainPack;
  sourceText: string; setSourceText: (v: string) => void;
  sourceUrl: string; setSourceUrl: (v: string) => void;
  sourceTitle: string; setSourceTitle: (v: string) => void;
  sourceGoal: string; setSourceGoal: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const hasContent = sourceText.trim() || sourceUrl.trim();
  return (
    <div>
      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-sm text-indigo-800">
          <strong>Optional:</strong> Paste an existing source to make your challenge more relevant.
          {' '}{pack.responsible_use_copy ?? ''}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
          <input
            type="text"
            value={sourceTitle}
            onChange={e => setSourceTitle(e.target.value)}
            placeholder="e.g. React course, AI policy doc, PR to review"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Or paste text (optional)</label>
          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            rows={4}
            placeholder="Paste a job description, code snippet, policy text, or course outline..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your goal</label>
          <select
            value={sourceGoal}
            onChange={e => setSourceGoal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="create proof">Create proof of skill</option>
            <option value="retain topic">Retain a topic I learned</option>
            <option value="close JD gap">Close a job description gap</option>
            <option value="verify transfer">Verify I can transfer this concept</option>
            <option value="finish learning">Finish learning a topic</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          {hasContent ? (
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save source and start challenge'}
            </button>
          ) : null}
          <button
            onClick={onSkip}
            disabled={loading}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Skip — start challenge now
          </button>
        </div>
      </div>
    </div>
  );
}

function ChallengePhase({
  challenge, answer, setAnswer, assumptions, setAssumptions, loading, onSubmit
}: {
  challenge: ChallengeType;
  answer: string; setAnswer: (v: string) => void;
  assumptions: string; setAssumptions: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  const canSubmit = answer.trim().split(/\s+/).length >= 15;
  return (
    <div className="space-y-6">

      {/* Node info */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Target size={12} />
        <span>{challenge.node.name}</span>
        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 capitalize">
          {challenge.node.severity}
        </span>
      </div>

      {/* Base scenario */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scenario</p>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{challenge.mutation.base_scenario}</p>
      </div>

      {/* Scenario change - the mutation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">What changes</p>
        <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{challenge.mutation.scenario_change}</p>
      </div>

      {/* Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your answer
          <span className="ml-1 text-gray-400 font-normal">(minimum 15 words)</span>
        </label>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={7}
          placeholder="Describe how this change affects the mechanism, what holds, what breaks, and what you would do..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          {answer.trim() ? answer.trim().split(/\s+/).length : 0} words
        </p>
      </div>

      {/* Assumptions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assumptions (optional)
          <span className="ml-1 text-gray-400 font-normal">one per line</span>
        </label>
        <textarea
          value={assumptions}
          onChange={e => setAssumptions(e.target.value)}
          rows={3}
          placeholder="e.g. I'm assuming the background job uses a separate worker thread..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Evaluating...' : 'Submit answer'}
      </button>
    </div>
  );
}

function FeedbackPhase({
  feedback, node, onNext, onDone,
}: {
  feedback: AttemptFeedback;
  node: MechanismNode;
  onNext: () => void;
  onDone: () => void;
}) {
  const config = VERDICT_CONFIG[feedback.verdict];
  const { Icon } = config;
  return (
    <div className="space-y-5">

      {/* Verdict banner */}
      <div className={['p-5 rounded-xl border', config.bg, config.border].join(' ')}>
        <div className="flex items-center gap-3 mb-3">
          <Icon size={22} className={config.color} />
          <span className={'text-lg font-semibold ' + config.color}>{config.label}</span>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-0.5">What stayed true</p>
            <p className="text-gray-600">{feedback.what_stayed_true}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-0.5">What changed</p>
            <p className="text-gray-600">{feedback.what_changed}</p>
          </div>
          {feedback.what_was_missed && (
            <div>
              <p className="font-medium text-gray-700 mb-0.5">What was missed</p>
              <p className="text-gray-600">{feedback.what_was_missed}</p>
            </div>
          )}
        </div>
      </div>

      {/* Misconception signatures */}
      {feedback.misconception_signatures.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Pattern noticed</p>
          {feedback.misconception_signatures.map(sig => (
            <div key={sig.id} className="text-sm">
              <p className="font-medium text-orange-900">{sig.label}</p>
              {sig.suggested_practice_next && (
                <p className="text-orange-700 mt-1">{sig.suggested_practice_next}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Practice next */}
      {feedback.practice_next && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Practice next</p>
          <p className="text-sm text-blue-800">{feedback.practice_next}</p>
        </div>
      )}

      {/* Retrieval schedule */}
      {feedback.scheduled_retrieval_at && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RotateCcw size={12} />
          <span>Scheduled for retrieval: {new Date(feedback.scheduled_retrieval_at).toLocaleDateString()}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onNext}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Next challenge
        </button>
        <button
          onClick={onDone}
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          View skills
        </button>
      </div>
    </div>
  );
}
