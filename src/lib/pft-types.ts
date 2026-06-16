// WitnessSkills: Promoted Field-Test Engine Types
// P1 type definitions matching the database schema

export type ProfileMode = 'personal' | 'organization';

export type PromotedFieldTest =
  | 'existing_solution_activation'
  | 'ai_generated_backend_code_review'
  | 'agentic_ai_oversight'
  | 'role_specific_ai_governance'
  | 'multi_tenant_saas_architecture';

export type SourceType =
  | 'course'
  | 'tutorial'
  | 'documentation'
  | 'job_description'
  | 'training_module'
  | 'policy'
  | 'ai_generated_pr'
  | 'secure_review_checklist'
  | 'agent_permission_model'
  | 'architecture_prompt'
  | 'incident_summary'
  | 'manual_topic';

export type SensitivityLevel = 'public' | 'anonymized' | 'sensitive' | 'confidential';
export type ReusePermission = 'this_request_only' | 'anonymous_improvement' | 'calibration_allowed';
export type PackStatus = 'draft' | 'published' | 'retired';
export type NodeTier = 'junior' | 'mid' | 'senior' | 'compress';
export type NodeStage = 'recognize' | 'discriminate' | 'abstract' | 'compress';
export type MutationMaturity = 'draft' | 'expert_reviewed' | 'field_tested' | 'calibrated' | 'retired';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type AttemptVerdict = 'mechanism_preserved' | 'partially_preserved' | 'mechanism_violated' | 'insufficient_evidence';
export type ProofReadiness = 'not_started' | 'thin' | 'needs_practice' | 'retrieval_due' | 'in_progress' | 'proof_ready';
export type WedgeStatus = 'discovery' | 'promote_field_test' | 'active_field_test' | 'recompute' | 'park' | 'killed';
export type RequestStatus = 'draft' | 'pending' | 'participant_invited' | 'probe_completed' | 'report_generated' | 'closed';
export type EvidenceConfidence = 'strong_evidence' | 'mixed_evidence' | 'weak_evidence' | 'insufficient_evidence';
export type BudgetBand = 'manual_smoke_test' | 'micro_field_test' | 'low_budget_gtm_sprint' | 'constrained_scale_test' | 'not_low_budget';

// ============================================================
// CORE ENTITIES
// ============================================================

export interface WedgeRegistry {
  id: string;
  label: string;
  target_user: string;
  primary_cta: string;
  source_artifact_types: SourceType[];
  required_receipts: string[];
  pass_threshold: number;
  fail_threshold: number;
  budget_band: BudgetBand;
  status: WedgeStatus;
  created_at: string;
  updated_at: string;
}

export interface DomainPack {
  id: string;
  wedge_id: string | null;
  promoted_field_test: PromotedFieldTest;
  name: string;
  user_facing_title: string;
  availability: 'personal' | 'organization' | 'both';
  target_user: string;
  estimated_minutes: number;
  personal_cta: string | null;
  b2b_cta: string | null;
  responsible_use_copy: string | null;
  status: PackStatus;
  created_at: string;
  updated_at: string;
  // Joined
  mechanism_nodes?: MechanismNode[];
}

export interface SourceArtifact {
  id: string;
  user_id: string;
  workspace_id: string | null;
  profile_mode: ProfileMode;
  source_type: SourceType;
  title: string;
  raw_text: string | null;
  url: string | null;
  uploaded_file_id: string | null;
  user_goal: string | null;
  decision_context: string | null;
  sensitivity: SensitivityLevel;
  reuse_permission: ReusePermission;
  suggested_pack_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MechanismNode {
  id: string;
  pack_id: string;
  name: string;
  invariant: string;
  false_causal_model: string;
  expected_expert_reasoning: string;
  common_shallow_pattern: string;
  severity: SeverityLevel;
  tier: NodeTier;
  stage: NodeStage;
  version: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MisconceptionSignature {
  id: string;
  pack_id: string;
  label: string;
  false_causal_model: string;
  response_pattern: string;
  downstream_risk: string;
  suggested_practice_next: string | null;
  suggested_reviewer_followup: string | null;
  severity: SeverityLevel;
  mechanism_node_ids: string[];
  created_at: string;
}

export interface AntiwitnessMutation {
  id: string;
  pack_id: string;
  mechanism_node_id: string;
  base_scenario: string;
  scenario_change: string;
  shallow_answer_it_breaks: string;
  expected_preserved_mechanism: string;
  expected_expert_response: string;
  misconception_signature_ids: string[];
  maturity: MutationMaturity;
  created_at: string;
  updated_at: string;
}

export interface PftAttempt {
  id: string;
  user_id: string;
  participant_id: string | null;
  verification_request_id: string | null;
  workspace_id: string | null;
  profile_mode: ProfileMode;
  pack_id: string;
  mechanism_node_id: string;
  mutation_id: string;
  source_artifact_id: string | null;
  answer: string;
  assumptions: string[];
  hints_used: string[];
  verdict: AttemptVerdict | null;
  mechanism_score: number | null;
  mutation_score: number | null;
  action_score: number | null;
  assumption_score: number | null;
  total_score: number | null;
  misconception_signature_ids: string[];
  scheduled_retrieval_at: string | null;
  submitted_at: string;
  evaluated_at: string | null;
}

export interface ProofRecord {
  id: string;
  user_id: string;
  pack_id: string;
  source_artifact_id: string | null;
  readiness: ProofReadiness;
  title: string;
  mechanisms_tested: MechanismSummary[];
  mutations_survived: MutationSummary[];
  evidence_summary: string | null;
  resume_safe_summary: string | null;
  strongest_attempt_ids: string[];
  misconception_signals_corrected: MisconceptionCorrection[];
  skill_ids: string[];
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  id: string;
  workspace_id: string | null;
  created_by: string;
  pack_id: string;
  source_artifact_id: string | null;
  goal: string;
  decision_context: string;
  report_recipient_email: string;
  deadline: string | null;
  status: RequestStatus;
  custom_notes: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceReport {
  id: string;
  verification_request_id: string;
  pack_id: string;
  decision_context: string;
  mechanisms_tested: MechanismSummary[];
  mechanisms_preserved: MechanismSummary[];
  mechanisms_violated: MechanismSummary[];
  misconception_signatures: MisconceptionSummary[];
  confidence: EvidenceConfidence;
  followup_questions: string[];
  limitations: string;
  responsible_use_statement: string;
  viewed_at: string | null;
  forwarded_at: string | null;
  generated_at: string;
}

export interface FieldTestEvent {
  id: string;
  wedge_id: string | null;
  pack_id: string | null;
  profile_mode: ProfileMode | null;
  workspace_id: string | null;
  user_id: string | null;
  event_type: string;
  is_receipt: boolean;
  is_deceptive: boolean;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

// ============================================================
// DERIVED / COMPOSITE TYPES
// ============================================================

export interface MechanismSummary {
  node_id: string;
  name: string;
  invariant: string;
  severity: SeverityLevel;
  verdict?: AttemptVerdict;
}

export interface MutationSummary {
  mutation_id: string;
  scenario_change: string;
  verdict: AttemptVerdict;
}

export interface MisconceptionSummary {
  signature_id: string;
  label: string;
  severity: SeverityLevel;
  count: number;
}

export interface MisconceptionCorrection {
  signature_id: string;
  label: string;
  corrected_at: string;
}

export interface ActivationPlan {
  pack: DomainPack;
  source_artifact: SourceArtifact;
  selected_nodes: MechanismNode[];
  mutations: AntiwitnessMutation[];
  retrieval_schedule: RetrievalSlot[];
  first_challenge: Challenge;
}

export interface Challenge {
  mutation: AntiwitnessMutation;
  node: MechanismNode;
  pack: DomainPack;
  source_artifact?: SourceArtifact;
}

export interface RetrievalSlot {
  node_id: string;
  due_at: string;
  interval_days: number;
}

export interface AttemptFeedback {
  verdict: AttemptVerdict;
  verdict_label: string;
  what_stayed_true: string;
  what_changed: string;
  what_was_missed: string | null;
  practice_next: string | null;
  misconception_signatures: MisconceptionSignature[];
  scheduled_retrieval_at: string | null;
}

// Receipt event types (behavioral validation signals)
export const RECEIPT_EVENT_TYPES = [
  'source_submitted',
  'challenge_completed',
  'retrieval_return',
  'proof_record_created',
  'participant_invited',
  'probe_completed',
  'report_viewed',
  'report_forwarded',
  'second_request',
  'paid_preview_requested',
] as const;

export type ReceiptEventType = typeof RECEIPT_EVENT_TYPES[number];

// Deceptive/neutral event types (not receipts)
export const DECEPTIVE_EVENT_TYPES = [
  'waitlist_signup',
  'page_view',
  'demo_praise',
  'social_like',
  'passive_download',
  'friendly_feedback',
] as const;

export type DeceptiveEventType = typeof DECEPTIVE_EVENT_TYPES[number];

// Pack display config for UI
export interface PackCardConfig {
  pack: DomainPack;
  score: number;
  badge?: string;
  isRecommended: boolean;
}

// Source classification result
export interface SourceClassification {
  suggested_pack_id: string | null;
  suggested_field_test: PromotedFieldTest | null;
  confidence: 'high' | 'medium' | 'low';
  clarifying_question?: string;
}
