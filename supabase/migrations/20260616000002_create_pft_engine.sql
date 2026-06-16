-- WitnessSkills: P1 Generic Field-Test Engine Schema
-- Migration: 20260616000002
-- Creates: source_artifacts, domain_packs, mechanism_nodes, antiwitness_mutations,
--          misconception_signatures, pft_attempts, proof_records,
--          verification_requests, pft_participants, evidence_reports,
--          field_test_events, wedge_registry

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  create type profile_mode as enum ('personal', 'organization');
exception when duplicate_object then null; end $$;

do $$ begin
  create type promoted_field_test as enum (
    'existing_solution_activation',
    'ai_generated_backend_code_review',
    'agentic_ai_oversight',
    'role_specific_ai_governance',
    'multi_tenant_saas_architecture'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type source_type as enum (
    'course', 'tutorial', 'documentation', 'job_description',
    'training_module', 'policy', 'ai_generated_pr',
    'secure_review_checklist', 'agent_permission_model',
    'architecture_prompt', 'incident_summary', 'manual_topic'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type sensitivity_level as enum ('public', 'anonymized', 'sensitive', 'confidential');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reuse_permission as enum ('this_request_only', 'anonymous_improvement', 'calibration_allowed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pack_status as enum ('draft', 'published', 'retired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type node_tier as enum ('junior', 'mid', 'senior', 'compress');
exception when duplicate_object then null; end $$;

do $$ begin
  create type node_stage as enum ('recognize', 'discriminate', 'abstract', 'compress');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mutation_maturity as enum ('draft', 'expert_reviewed', 'field_tested', 'calibrated', 'retired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type severity_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attempt_verdict as enum (
    'mechanism_preserved', 'partially_preserved',
    'mechanism_violated', 'insufficient_evidence'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type proof_readiness as enum (
    'not_started', 'thin', 'needs_practice',
    'retrieval_due', 'in_progress', 'proof_ready'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type wedge_status as enum (
    'discovery', 'promote_field_test', 'active_field_test',
    'recompute', 'park', 'killed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum (
    'draft', 'pending', 'participant_invited',
    'probe_completed', 'report_generated', 'closed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type evidence_confidence as enum (
    'strong_evidence', 'mixed_evidence',
    'weak_evidence', 'insufficient_evidence'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type budget_band as enum (
    'manual_smoke_test', 'micro_field_test',
    'low_budget_gtm_sprint', 'constrained_scale_test', 'not_low_budget'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- WEDGE REGISTRY
-- ============================================================

create table if not exists public.wedge_registry (
  id text primary key,
  label text not null,
  target_user text not null,
  primary_cta text not null,
  source_artifact_types source_type[] not null default '{}',
  required_receipts text[] not null default '{}',
  pass_threshold integer not null default 3,
  fail_threshold integer not null default 3,
  budget_band budget_band not null default 'manual_smoke_test',
  status wedge_status not null default 'discovery',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DOMAIN PACKS
-- ============================================================

create table if not exists public.domain_packs (
  id uuid primary key default uuid_generate_v4(),
  wedge_id text references public.wedge_registry(id),
  promoted_field_test promoted_field_test not null,
  name text not null,
  user_facing_title text not null,
  availability text not null default 'both' check (availability in ('personal', 'organization', 'both')),
  target_user text not null,
  estimated_minutes integer not null default 10,
  personal_cta text,
  b2b_cta text,
  responsible_use_copy text,
  status pack_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SOURCE ARTIFACTS
-- ============================================================

create table if not exists public.source_artifacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  workspace_id uuid,
  profile_mode profile_mode not null default 'personal',
  source_type source_type not null,
  title text not null,
  raw_text text,
  url text,
  uploaded_file_id text,
  user_goal text,
  decision_context text,
  sensitivity sensitivity_level not null default 'public',
  reuse_permission reuse_permission not null default 'this_request_only',
  suggested_pack_id uuid references public.domain_packs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- MECHANISM NODES
-- ============================================================

create table if not exists public.mechanism_nodes (
  id uuid primary key default uuid_generate_v4(),
  pack_id uuid not null references public.domain_packs(id) on delete cascade,
  name text not null,
  invariant text not null,
  false_causal_model text not null,
  expected_expert_reasoning text not null,
  common_shallow_pattern text not null,
  severity severity_level not null default 'medium',
  tier node_tier not null default 'mid',
  stage node_stage not null default 'recognize',
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- MISCONCEPTION SIGNATURES
-- ============================================================

create table if not exists public.misconception_signatures (
  id uuid primary key default uuid_generate_v4(),
  pack_id uuid not null references public.domain_packs(id) on delete cascade,
  label text not null,
  false_causal_model text not null,
  response_pattern text not null,
  downstream_risk text not null,
  suggested_practice_next text,
  suggested_reviewer_followup text,
  severity severity_level not null default 'medium',
  mechanism_node_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- ANTIWITNESS MUTATIONS
-- ============================================================

create table if not exists public.antiwitness_mutations (
  id uuid primary key default uuid_generate_v4(),
  pack_id uuid not null references public.domain_packs(id) on delete cascade,
  mechanism_node_id uuid not null references public.mechanism_nodes(id) on delete cascade,
  base_scenario text not null,
  scenario_change text not null,
  shallow_answer_it_breaks text not null,
  expected_preserved_mechanism text not null,
  expected_expert_response text not null,
  misconception_signature_ids uuid[] not null default '{}',
  maturity mutation_maturity not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PFT ATTEMPTS (Personal + B2B)
-- ============================================================

create table if not exists public.pft_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  participant_id uuid,
  verification_request_id uuid,
  workspace_id uuid,
  profile_mode profile_mode not null default 'personal',
  pack_id uuid not null references public.domain_packs(id),
  mechanism_node_id uuid not null references public.mechanism_nodes(id),
  mutation_id uuid not null references public.antiwitness_mutations(id),
  source_artifact_id uuid references public.source_artifacts(id),
  answer text not null,
  assumptions text[] not null default '{}',
  hints_used text[] not null default '{}',
  verdict attempt_verdict,
  mechanism_score numeric(4,3),
  mutation_score numeric(4,3),
  action_score numeric(4,3),
  assumption_score numeric(4,3),
  total_score numeric(4,3),
  misconception_signature_ids uuid[] not null default '{}',
  scheduled_retrieval_at timestamptz,
  submitted_at timestamptz not null default now(),
  evaluated_at timestamptz
);

-- ============================================================
-- PROOF RECORDS (Personal)
-- ============================================================

create table if not exists public.proof_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id uuid not null references public.domain_packs(id),
  source_artifact_id uuid references public.source_artifacts(id),
  readiness proof_readiness not null default 'not_started',
  title text not null,
  mechanisms_tested jsonb not null default '[]',
  mutations_survived jsonb not null default '[]',
  evidence_summary text,
  resume_safe_summary text,
  strongest_attempt_ids uuid[] not null default '{}',
  misconception_signals_corrected jsonb not null default '[]',
  skill_ids uuid[] not null default '{}',
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- VERIFICATION REQUESTS (B2B)
-- ============================================================

create table if not exists public.verification_requests (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid,
  created_by uuid not null references auth.users(id) on delete cascade,
  pack_id uuid not null references public.domain_packs(id),
  source_artifact_id uuid references public.source_artifacts(id),
  goal text not null,
  decision_context text not null,
  report_recipient_email text not null,
  deadline timestamptz,
  status request_status not null default 'draft',
  custom_notes text,
  invite_token text unique,
  invite_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PFT PARTICIPANTS (B2B probe participants)
-- ============================================================

create table if not exists public.pft_participants (
  id uuid primary key default uuid_generate_v4(),
  verification_request_id uuid not null references public.verification_requests(id) on delete cascade,
  email text not null,
  invite_token text unique not null,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- EVIDENCE REPORTS (B2B)
-- ============================================================

create table if not exists public.evidence_reports (
  id uuid primary key default uuid_generate_v4(),
  verification_request_id uuid not null references public.verification_requests(id) on delete cascade,
  pack_id uuid not null references public.domain_packs(id),
  decision_context text not null,
  mechanisms_tested jsonb not null default '[]',
  mechanisms_preserved jsonb not null default '[]',
  mechanisms_violated jsonb not null default '[]',
  misconception_signatures jsonb not null default '[]',
  confidence evidence_confidence not null default 'insufficient_evidence',
  followup_questions text[] not null default '{}',
  limitations text not null default '',
  responsible_use_statement text not null default 'This report describes observable reasoning patterns and is not a validated hiring predictor. Use alongside other information. Do not make employment decisions solely from this report.',
  viewed_at timestamptz,
  forwarded_at timestamptz,
  generated_at timestamptz not null default now()
);

-- ============================================================
-- FIELD TEST EVENTS (Telemetry)
-- ============================================================

create table if not exists public.field_test_events (
  id uuid primary key default uuid_generate_v4(),
  wedge_id text references public.wedge_registry(id),
  pack_id uuid references public.domain_packs(id),
  profile_mode profile_mode,
  workspace_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  is_receipt boolean not null default false,
  is_deceptive boolean not null default false,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists source_artifacts_user_id_idx on public.source_artifacts(user_id);
create index if not exists source_artifacts_profile_mode_idx on public.source_artifacts(profile_mode);
create index if not exists mechanism_nodes_pack_id_idx on public.mechanism_nodes(pack_id);
create index if not exists antiwitness_mutations_pack_id_idx on public.antiwitness_mutations(pack_id);
create index if not exists antiwitness_mutations_node_id_idx on public.antiwitness_mutations(mechanism_node_id);
create index if not exists misconception_signatures_pack_id_idx on public.misconception_signatures(pack_id);
create index if not exists pft_attempts_user_id_idx on public.pft_attempts(user_id);
create index if not exists pft_attempts_pack_id_idx on public.pft_attempts(pack_id);
create index if not exists pft_attempts_verdict_idx on public.pft_attempts(verdict);
create index if not exists pft_attempts_retrieval_idx on public.pft_attempts(scheduled_retrieval_at) where scheduled_retrieval_at is not null;
create index if not exists proof_records_user_id_idx on public.proof_records(user_id);
create index if not exists proof_records_pack_id_idx on public.proof_records(pack_id);
create index if not exists verification_requests_created_by_idx on public.verification_requests(created_by);
create index if not exists verification_requests_status_idx on public.verification_requests(status);
create index if not exists field_test_events_wedge_id_idx on public.field_test_events(wedge_id);
create index if not exists field_test_events_event_type_idx on public.field_test_events(event_type);
create index if not exists field_test_events_occurred_at_idx on public.field_test_events(occurred_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.source_artifacts enable row level security;
alter table public.pft_attempts enable row level security;
alter table public.proof_records enable row level security;
alter table public.verification_requests enable row level security;
alter table public.pft_participants enable row level security;
alter table public.evidence_reports enable row level security;
alter table public.field_test_events enable row level security;

-- Domain packs, mechanism nodes, mutations, misconception signatures are public read
alter table public.domain_packs enable row level security;
alter table public.mechanism_nodes enable row level security;
alter table public.antiwitness_mutations enable row level security;
alter table public.misconception_signatures enable row level security;
alter table public.wedge_registry enable row level security;

-- Public read for pack catalog
create policy "Published packs are readable by all" on public.domain_packs
  for select using (status = 'published');

create policy "Mechanism nodes readable by all" on public.mechanism_nodes
  for select using (true);

create policy "Mutations readable by all" on public.antiwitness_mutations
  for select using (true);

create policy "Misconception signatures readable by all" on public.misconception_signatures
  for select using (true);

create policy "Wedge registry readable by authenticated" on public.wedge_registry
  for select using (auth.uid() is not null);

-- Source artifacts: user owns their own
create policy "Users can view own source artifacts" on public.source_artifacts
  for select using (auth.uid() = user_id);

create policy "Users can create source artifacts" on public.source_artifacts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own source artifacts" on public.source_artifacts
  for update using (auth.uid() = user_id);

-- PFT Attempts: user owns their own
create policy "Users can view own attempts" on public.pft_attempts
  for select using (auth.uid() = user_id);

create policy "Users can create attempts" on public.pft_attempts
  for insert with check (auth.uid() = user_id);

-- Proof Records: user owns their own
create policy "Users can view own proof records" on public.proof_records
  for select using (auth.uid() = user_id);

create policy "Users can create proof records" on public.proof_records
  for insert with check (auth.uid() = user_id);

create policy "Users can update own proof records" on public.proof_records
  for update using (auth.uid() = user_id);

-- Verification Requests: creator can view/manage
create policy "Org users can view own requests" on public.verification_requests
  for select using (auth.uid() = created_by);

create policy "Org users can create requests" on public.verification_requests
  for insert with check (auth.uid() = created_by);

create policy "Org users can update own requests" on public.verification_requests
  for update using (auth.uid() = created_by);

-- Evidence Reports: accessible to request creator
create policy "Request creators can view evidence reports" on public.evidence_reports
  for select using (
    exists (
      select 1 from public.verification_requests vr
      where vr.id = evidence_reports.verification_request_id
      and vr.created_by = auth.uid()
    )
  );

-- Field test events: users can insert their own
create policy "Users can insert field test events" on public.field_test_events
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can view own field test events" on public.field_test_events
  for select using (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_domain_packs_updated_at
  before update on public.domain_packs
  for each row execute function public.set_updated_at();

create trigger set_source_artifacts_updated_at
  before update on public.source_artifacts
  for each row execute function public.set_updated_at();

create trigger set_mechanism_nodes_updated_at
  before update on public.mechanism_nodes
  for each row execute function public.set_updated_at();

create trigger set_mutations_updated_at
  before update on public.antiwitness_mutations
  for each row execute function public.set_updated_at();

create trigger set_proof_records_updated_at
  before update on public.proof_records
  for each row execute function public.set_updated_at();

create trigger set_verification_requests_updated_at
  before update on public.verification_requests
  for each row execute function public.set_updated_at();
