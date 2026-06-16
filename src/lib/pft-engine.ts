// WitnessSkills: PFT Engine - Evaluation, Scoring, and Proof Logic
// P2 - Client-side evaluation using heuristic scoring
// Note: First version uses keyword/heuristic scoring.
// Production will add LLM-based evaluation via Netlify Function.

import type {
  MechanismNode, AntiwitnessMutation, MisconceptionSignature,
  PftAttempt, AttemptVerdict, AttemptFeedback, ProofReadiness,
  MechanismSummary, MutationSummary, ProofRecord, DomainPack,
} from './pft-types';
import { updateAttemptVerdict, getMisconceptionsByPack, getUserAttemptsForPack } from './pft-queries';

// ============================================================
// HEURISTIC EVALUATION
// ============================================================

export function evaluateAttempt(
  answer: string,
  assumptions: string[],
  node: MechanismNode,
  mutation: AntiwitnessMutation,
  misconceptions: MisconceptionSignature[]
): {
  verdict: AttemptVerdict;
  scores: { mechanism_score: number; mutation_score: number; action_score: number; assumption_score: number; total_score: number; };
  detectedMisconceptionIds: string[];
  feedback: AttemptFeedback;
} {
  const answerLower = answer.toLowerCase();
  const combinedText = answer + ' ' + assumptions.join(' ');
  const wordCount = answer.trim().split(/\s+/).length;

  if (wordCount < 15) {
    return {
      verdict: 'insufficient_evidence',
      scores: { mechanism_score: 0, mutation_score: 0, action_score: 0, assumption_score: 0, total_score: 0 },
      detectedMisconceptionIds: [],
      feedback: buildFeedback('insufficient_evidence', node, mutation, [], null),
    };
  }

  const mechanismKeywords = extractKeywords(node.invariant + ' ' + node.expected_expert_reasoning);
  const mechanismScore = scoreKeywordPresence(answerLower, mechanismKeywords, 0.4);
  const mutationKeywords = extractKeywords(mutation.scenario_change + ' ' + mutation.expected_preserved_mechanism);
  const mutationScore = scoreKeywordPresence(answerLower, mutationKeywords, 0.5);
  const actionScore = scoreActionQuality(answer, mutation.expected_expert_response);
  const assumptionScore = assumptions.length > 0 ? Math.min(1.0, assumptions.length * 0.25) : 0;
  const totalScore = 0.40 * mechanismScore + 0.25 * mutationScore + 0.25 * actionScore + 0.10 * assumptionScore;

  let verdict: AttemptVerdict;
  if (totalScore >= 0.75) verdict = 'mechanism_preserved';
  else if (totalScore >= 0.50) verdict = 'partially_preserved';
  else verdict = 'mechanism_violated';

  const detectedMisconceptionIds: string[] = [];
  for (const sig of misconceptions) {
    if (answerMatchesMisconception(combinedText, sig, node, mutation)) {
      detectedMisconceptionIds.push(sig.id);
    }
  }

  const scores = {
    mechanism_score: round3(mechanismScore),
    mutation_score: round3(mutationScore),
    action_score: round3(actionScore),
    assumption_score: round3(assumptionScore),
    total_score: round3(totalScore),
  };

  const feedback = buildFeedback(verdict, node, mutation,
    misconceptions.filter(s => detectedMisconceptionIds.includes(s.id)), totalScore);

  return { verdict, scores, detectedMisconceptionIds, feedback };
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the','a','an','is','are','was','were','in','on','at','to','for','of','and','or','but','not','with','by','from','as','be','it','this','that','when','where','which','who','will','can','must','should','has','have','had','do','does','did','if','each','every','all','any','they','them','their']);
  return text.toLowerCase().replace(/[^a-z0-9\s-_]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w)).slice(0, 20);
}

function scoreKeywordPresence(answer: string, keywords: string[], weight: number): number {
  if (!keywords.length) return weight;
  const hits = keywords.filter(kw => answer.includes(kw)).length;
  return Math.min(1.0, hits / Math.max(1, keywords.length * 0.4));
}

function scoreActionQuality(answer: string, expectedResponse: string): number {
  const answerLower = answer.toLowerCase();
  const actionVerbs = ['would','should','need to','must','require','check','verify','ensure','add','fix','change','update','pass','include','scope','validate'];
  const hasActionVerb = actionVerbs.some(v => answerLower.includes(v));
  const expectedKeywords = extractKeywords(expectedResponse);
  const specificityScore = scoreKeywordPresence(answerLower, expectedKeywords, 0.5);
  const wordCount = answer.trim().split(/\s+/).length;
  const lengthBonus = Math.min(0.3, (wordCount - 15) / 200);
  return Math.min(1.0, (hasActionVerb ? 0.3 : 0) + specificityScore * 0.5 + lengthBonus);
}

function answerMatchesMisconception(answer: string, sig: MisconceptionSignature, node: MechanismNode, mutation: AntiwitnessMutation): boolean {
  const shallowKeywords = extractKeywords(mutation.shallow_answer_it_breaks + ' ' + sig.response_pattern);
  const shallowHits = shallowKeywords.filter(kw => answer.toLowerCase().includes(kw)).length;
  const shallowRatio = shallowHits / Math.max(1, shallowKeywords.length);
  const mechanismKeywords = extractKeywords(node.invariant);
  const mechanismHits = mechanismKeywords.filter(kw => answer.toLowerCase().includes(kw)).length;
  const mechanismRatio = mechanismHits / Math.max(1, mechanismKeywords.length);
  return shallowRatio > 0.4 && mechanismRatio < 0.25;
}

function buildFeedback(verdict: AttemptVerdict, node: MechanismNode, mutation: AntiwitnessMutation, detectedSigs: MisconceptionSignature[], totalScore: number | null): AttemptFeedback {
  const verdictLabels: Record<AttemptVerdict, string> = {
    mechanism_preserved: 'Strong',
    partially_preserved: 'Partial',
    mechanism_violated: 'Needs practice',
    insufficient_evidence: 'Not enough detail',
  };
  const whatStayedTrue = 'Core invariant: ' + node.invariant.substring(0, 120);
  const whatChanged = 'Scenario change: ' + mutation.scenario_change.substring(0, 150);
  let whatWasMissed: string | null = null;
  let practiceNext: string | null = null;
  if (verdict === 'mechanism_violated' || verdict === 'partially_preserved') {
    whatWasMissed = mutation.expected_preserved_mechanism;
    practiceNext = detectedSigs[0]?.suggested_practice_next ?? ('Practice: ' + node.name + ' in a different context.');
  }
  let scheduledRetrievalAt: string | null = null;
  const d = new Date();
  if (verdict === 'mechanism_preserved') { d.setDate(d.getDate() + 7); scheduledRetrievalAt = d.toISOString(); }
  else if (verdict === 'partially_preserved') { d.setDate(d.getDate() + 3); scheduledRetrievalAt = d.toISOString(); }
  else if (verdict === 'mechanism_violated') { d.setDate(d.getDate() + 1); scheduledRetrievalAt = d.toISOString(); }
  return { verdict, verdict_label: verdictLabels[verdict], what_stayed_true: whatStayedTrue, what_changed: whatChanged, what_was_missed: whatWasMissed, practice_next: practiceNext, misconception_signatures: detectedSigs, scheduled_retrieval_at: scheduledRetrievalAt };
}

// ============================================================
// PROOF READINESS
// ============================================================

export async function calculateProofReadiness(userId: string, pack: DomainPack, nodeCount: number): Promise<ProofReadiness> {
  const attempts = await getUserAttemptsForPack(userId, pack.id);
  if (!attempts.length) return 'not_started';
  const preservedCount = attempts.filter(a => a.verdict === 'mechanism_preserved').length;
  const partialCount = attempts.filter(a => a.verdict === 'partially_preserved').length;
  const highSeverityOpen = attempts.filter(a => a.verdict === 'mechanism_violated' && (a.mechanism_score ?? 1) < 0.3).length;
  const convergence = nodeCount > 0 ? (preservedCount + partialCount * 0.5) / Math.max(1, nodeCount) : 0;
  const overdue = attempts.filter(a => a.scheduled_retrieval_at && new Date(a.scheduled_retrieval_at) < new Date()).length;
  if (convergence < 0.35) return 'thin';
  if (highSeverityOpen > 0) return 'needs_practice';
  if (overdue > 0) return 'retrieval_due';
  if (convergence >= 0.65) return 'proof_ready';
  return 'in_progress';
}

export function generateResumeBullet(pack: DomainPack, preservedCount: number, nodeSummaries: MechanismSummary[]): string {
  const packTitle = pack.user_facing_title;
  const order = { critical: 3, high: 2, medium: 1, low: 0 };
  const best = nodeSummaries.filter(n => n.verdict === 'mechanism_preserved').sort((a, b) => (order[b.severity] ?? 0) - (order[a.severity] ?? 0))[0];
  if (!best) return 'Completed ' + packTitle + ' challenge sequence (' + preservedCount + ' checks).';
  return 'Demonstrated ' + best.name.toLowerCase() + ' reasoning under scenario mutation (' + packTitle + ') — ' + preservedCount + ' mechanism checks verified.';
}

export function generateActivationPlan(nodes: MechanismNode[], mutations: AntiwitnessMutation[]): { selectedNodes: MechanismNode[]; selectedMutations: AntiwitnessMutation[]; estimatedMinutes: number; } {
  const stageOrder: Record<string, number> = { recognize: 0, discriminate: 1, abstract: 2, compress: 3 };
  const severityOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  const scored = nodes.map(n => ({ node: n, score: (severityOrder[n.severity] ?? 0) * 10 + (3 - (stageOrder[n.stage] ?? 3)) }));
  scored.sort((a, b) => b.score - a.score);
  const selectedNodes = scored.slice(0, Math.min(5, Math.max(3, scored.length))).map(s => s.node);
  const selectedMutations = selectedNodes.map(n => mutations.find(m => m.mechanism_node_id === n.id)).filter(Boolean) as AntiwitnessMutation[];
  return { selectedNodes, selectedMutations, estimatedMinutes: selectedNodes.length * 8 };
}

function round3(n: number): number { return Math.round(n * 1000) / 1000; }
