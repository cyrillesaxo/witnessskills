// WitnessSkills: PFT Engine - Supabase Query Helpers
// P1/P2 Supabase query functions for the field-test engine

import { supabase } from './supabase';
import type {
  DomainPack, SourceArtifact, MechanismNode, AntiwitnessMutation,
  MisconceptionSignature, PftAttempt, ProofRecord, VerificationRequest,
  AttemptVerdict, SourceClassification, Challenge, PackCardConfig,
} from './pft-types';

// ============================================================
// DOMAIN PACKS
// ============================================================

export async function getPublishedPacks(): Promise<DomainPack[]> {
  const { data, error } = await supabase
    .from('domain_packs')
    .select('*')
    .eq('status', 'published')
    .order('user_facing_title');
  if (error) throw error;
  return data ?? [];
}

export async function getPackById(packId: string): Promise<DomainPack | null> {
  const { data, error } = await supabase
    .from('domain_packs')
    .select('*')
    .eq('id', packId)
    .single();
  if (error) return null;
  return data;
}

export async function getPacksWithNodes(): Promise<PackCardConfig[]> {
  const packs = await getPublishedPacks();
  return packs.map(pack => ({
    pack,
    score: 0,
    isRecommended: false,
  }));
}

// ============================================================
// MECHANISM NODES
// ============================================================

export async function getNodesByPack(packId: string): Promise<MechanismNode[]> {
  const { data, error } = await supabase
    .from('mechanism_nodes')
    .select('*')
    .eq('pack_id', packId)
    .eq('active', true)
    .order('severity', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getNodeById(nodeId: string): Promise<MechanismNode | null> {
  const { data, error } = await supabase
    .from('mechanism_nodes')
    .select('*')
    .eq('id', nodeId)
    .single();
  if (error) return null;
  return data;
}

// ============================================================
// ANTIWITNESS MUTATIONS
// ============================================================

export async function getMutationsByNode(nodeId: string): Promise<AntiwitnessMutation[]> {
  const { data, error } = await supabase
    .from('antiwitness_mutations')
    .select('*')
    .eq('mechanism_node_id', nodeId)
    .neq('maturity', 'retired')
    .order('maturity', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMutationsByPack(packId: string): Promise<AntiwitnessMutation[]> {
  const { data, error } = await supabase
    .from('antiwitness_mutations')
    .select('*')
    .eq('pack_id', packId)
    .neq('maturity', 'retired');
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// MISCONCEPTION SIGNATURES
// ============================================================

export async function getMisconceptionsByPack(packId: string): Promise<MisconceptionSignature[]> {
  const { data, error } = await supabase
    .from('misconception_signatures')
    .select('*')
    .eq('pack_id', packId)
    .order('severity', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// SOURCE ARTIFACTS
// ============================================================

export async function createSourceArtifact(
  artifact: Omit<SourceArtifact, 'id' | 'created_at' | 'updated_at'>
): Promise<SourceArtifact> {
  const { data, error } = await supabase
    .from('source_artifacts')
    .insert(artifact)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserSourceArtifacts(userId: string): Promise<SourceArtifact[]> {
  const { data, error } = await supabase
    .from('source_artifacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function classifySourceType(text: string, url: string = ''): SourceClassification {
  const combined = (text + ' ' + url).toLowerCase();

  const scores: Record<string, number> = {
    existing_solution_activation: 0,
    ai_generated_backend_code_review: 0,
    agentic_ai_oversight: 0,
    role_specific_ai_governance: 0,
    multi_tenant_saas_architecture: 0,
  };

  // Pack 1: Existing solution activation
  if (/course|lesson|module|tutorial|syllabus|video|curriculum/.test(combined)) scores.existing_solution_activation += 30;
  if (/job.?description|jd|requirements|qualifications/.test(combined)) scores.existing_solution_activation += 20;

  // Pack 2: AI code review
  if (/pull.?request|copilot|cursor|claude.?code|github.?copilot|ai.?generat|generated.?code/.test(combined)) scores.ai_generated_backend_code_review += 40;
  if (/code.?review|pr.?review|security.?review/.test(combined)) scores.ai_generated_backend_code_review += 20;

  // Pack 3: Agentic AI oversight
  if (/agent|autonomous|tool.?permission|kill.?switch|escalation.?matrix/.test(combined)) scores.agentic_ai_oversight += 40;
  if (/approval.?threshold|human.?in.?loop|oversight/.test(combined)) scores.agentic_ai_oversight += 20;

  // Pack 4: AI governance
  if (/ai.?use.?policy|ai.?policy|acceptable.?use/.test(combined)) scores.role_specific_ai_governance += 40;
  if (/governance|compliance|risk|hr|legal.?ops|customer.?support/.test(combined)) scores.role_specific_ai_governance += 20;

  // Pack 5: SaaS architecture
  if (/multi.?tenant|tenant.?isolation|staff.?engineer|saas/.test(combined)) scores.multi_tenant_saas_architecture += 40;
  if (/architecture|idempotent|customer.?managed.?key|cmk/.test(combined)) scores.multi_tenant_saas_architecture += 20;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const second = sorted[1];

  if (best[1] < 20) {
    return {
      suggested_pack_id: null,
      suggested_field_test: null,
      confidence: 'low',
      clarifying_question: 'What is this source primarily about? (e.g., learning a skill, reviewing code, AI policy, system architecture)',
    };
  }

  // Map field test to pack ID
  const packIdMap: Record<string, string> = {
    existing_solution_activation: 'a1b2c3d4-0001-0001-0001-000000000001',
    ai_generated_backend_code_review: 'a1b2c3d4-0002-0002-0002-000000000002',
    agentic_ai_oversight: 'a1b2c3d4-0003-0003-0003-000000000003',
    role_specific_ai_governance: 'a1b2c3d4-0004-0004-0004-000000000004',
    multi_tenant_saas_architecture: 'a1b2c3d4-0005-0005-0005-000000000005',
  };

  return {
    suggested_pack_id: packIdMap[best[0]] ?? null,
    suggested_field_test: best[0] as ReturnType<typeof classifySourceType>['suggested_field_test'],
    confidence: best[1] - second[1] > 15 ? 'high' : 'medium',
  };
}

// ============================================================
// PFT ATTEMPTS
// ============================================================

export async function createAttempt(
  attempt: Omit<PftAttempt, 'id' | 'submitted_at' | 'evaluated_at'>
): Promise<PftAttempt> {
  const { data, error } = await supabase
    .from('pft_attempts')
    .insert(attempt)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAttemptVerdict(
  attemptId: string,
  verdict: AttemptVerdict,
  scores: {
    mechanism_score: number;
    mutation_score: number;
    action_score: number;
    assumption_score: number;
    total_score: number;
  },
  misconceptionSignatureIds: string[],
  scheduledRetrievalAt: string | null
): Promise<void> {
  const { error } = await supabase
    .from('pft_attempts')
    .update({
      verdict,
      ...scores,
      misconception_signature_ids: misconceptionSignatureIds,
      scheduled_retrieval_at: scheduledRetrievalAt,
      evaluated_at: new Date().toISOString(),
    })
    .eq('id', attemptId);
  if (error) throw error;
}

export async function getUserAttemptsForPack(
  userId: string,
  packId: string
): Promise<PftAttempt[]> {
  const { data, error } = await supabase
    .from('pft_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('pack_id', packId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDueRetrievals(userId: string): Promise<PftAttempt[]> {
  const { data, error } = await supabase
    .from('pft_attempts')
    .select('*')
    .eq('user_id', userId)
    .lte('scheduled_retrieval_at', new Date().toISOString())
    .order('scheduled_retrieval_at');
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// CHALLENGE SELECTION
// ============================================================

export async function selectNextChallenge(
  userId: string,
  packId: string
): Promise<Challenge | null> {
  const [nodes, mutations, previousAttempts] = await Promise.all([
    getNodesByPack(packId),
    getMutationsByPack(packId),
    getUserAttemptsForPack(userId, packId),
  ]);

  if (!nodes.length || !mutations.length) return null;

  const pack = await getPackById(packId);
  if (!pack) return null;

  // Prefer: not yet attempted > failed > due for retrieval
  const attemptedNodeIds = new Set(previousAttempts.map(a => a.mechanism_node_id));
  const failedNodeIds = new Set(
    previousAttempts
      .filter(a => a.verdict === 'mechanism_violated' || a.verdict === 'partially_preserved')
      .map(a => a.mechanism_node_id)
  );

  // Score nodes: unstarted high-severity first, then failed, then retrieval
  const scoredNodes = nodes.map(node => {
    let score = 0;
    if (!attemptedNodeIds.has(node.id)) score += 100;
    if (failedNodeIds.has(node.id)) score += 50;
    const severityScores = { critical: 40, high: 30, medium: 20, low: 10 };
    score += severityScores[node.severity] ?? 0;
    return { node, score };
  });

  scoredNodes.sort((a, b) => b.score - a.score);
  const selectedNode = scoredNodes[0].node;

  // Find a mutation for this node not yet attempted
  const attemptedMutationIds = new Set(
    previousAttempts
      .filter(a => a.mechanism_node_id === selectedNode.id)
      .map(a => a.mutation_id)
  );

  const nodeMutations = mutations.filter(m => m.mechanism_node_id === selectedNode.id);
  const unattemptedMutations = nodeMutations.filter(m => !attemptedMutationIds.has(m.id));
  const selectedMutation = unattemptedMutations[0] ?? nodeMutations[0];

  if (!selectedMutation) return null;

  return {
    mutation: selectedMutation,
    node: selectedNode,
    pack,
  };
}

// ============================================================
// PROOF RECORDS
// ============================================================

export async function getUserProofRecords(userId: string): Promise<ProofRecord[]> {
  const { data, error } = await supabase
    .from('proof_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProofRecord(
  record: Omit<ProofRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<ProofRecord> {
  const { data, error } = await supabase
    .from('proof_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProofRecord(
  recordId: string,
  updates: Partial<ProofRecord>
): Promise<void> {
  const { error } = await supabase
    .from('proof_records')
    .update(updates)
    .eq('id', recordId);
  if (error) throw error;
}

// ============================================================
// VERIFICATION REQUESTS (B2B)
// ============================================================

export async function createVerificationRequest(
  request: Omit<VerificationRequest, 'id' | 'status' | 'invite_token' | 'invite_expires_at' | 'created_at' | 'updated_at'>
): Promise<VerificationRequest> {
  const { data, error } = await supabase
    .from('verification_requests')
    .insert({ ...request, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// FIELD TEST EVENTS (Telemetry)
// ============================================================

export async function emitFieldTestEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
  wedgeId?: string,
  packId?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const RECEIPT_TYPES = new Set([
      'source_submitted', 'challenge_completed', 'retrieval_return',
      'proof_record_created', 'participant_invited', 'probe_completed',
      'report_viewed', 'report_forwarded', 'second_request', 'paid_preview_requested',
    ]);
    
    const DECEPTIVE_TYPES = new Set([
      'waitlist_signup', 'page_view', 'demo_praise', 'social_like',
      'passive_download', 'friendly_feedback',
    ]);

    await supabase.from('field_test_events').insert({
      event_type: eventType,
      wedge_id: wedgeId ?? null,
      pack_id: packId ?? null,
      profile_mode: 'personal',
      user_id: user?.id ?? null,
      is_receipt: RECEIPT_TYPES.has(eventType),
      is_deceptive: DECEPTIVE_TYPES.has(eventType),
      metadata,
    });
  } catch {
    // Telemetry failures must not break product flows
    console.warn('[PFT] Event emission failed:', eventType);
  }
}
